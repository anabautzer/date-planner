import { NextResponse } from 'next/server';
import type { Movie } from '@/lib/mockData';

// ─────────────────────────────────────────────────────────────
// Server-side proxy for TMDB "now playing" — keeps the token off
// the client bundle and lets us reshape the response into `Movie`.
//
// Note: TMDB has no public real-world cinema showtime data, so the
// UI's "tags" are TMDB genres, not actual session times.
// ─────────────────────────────────────────────────────────────

const TMDB_BASE = 'https://api.themoviedb.org/3';

function tmdbHeaders(token: string): Record<string, string> {
  // v4 tokens are long JWTs → Bearer header. v3 keys are short hex
  // strings → passed as a query param instead (added by the caller).
  const headers: Record<string, string> = { accept: 'application/json' };
  if (token.startsWith('eyJ')) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function withKey(url: string, token: string) {
  if (token.startsWith('eyJ')) return url; // v4: auth via header
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}api_key=${token}`;
}

// Explicit charset so any client that (unlike browsers) relies on the
// Content-Type header to detect encoding decodes accented text correctly.
function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function GET() {
  const token = process.env.TMDB_API_TOKEN;
  if (!token) {
    return json({ error: 'TMDB_API_TOKEN não configurado', movies: [] });
  }

  try {
    const headers = tmdbHeaders(token);

    const [nowPlayingRes, genresRes] = await Promise.all([
      fetch(
        withKey(
          `${TMDB_BASE}/movie/now_playing?language=pt-BR&region=BR&page=1`,
          token
        ),
        { headers, next: { revalidate: 3600 } }
      ),
      fetch(withKey(`${TMDB_BASE}/genre/movie/list?language=pt-BR`, token), {
        headers,
        next: { revalidate: 86400 },
      }),
    ]);

    if (!nowPlayingRes.ok) {
      const body = await nowPlayingRes.text();
      throw new Error(`TMDB ${nowPlayingRes.status}: ${body}`);
    }

    const nowPlaying = await nowPlayingRes.json();
    const genresJson = genresRes.ok ? await genresRes.json() : { genres: [] };
    const genreMap = new Map<number, string>(
      (genresJson.genres ?? []).map((g: { id: number; name: string }) => [
        g.id,
        g.name,
      ])
    );

    const movies: Movie[] = (nowPlaying.results ?? [])
      .slice(0, 10)
      .map(
        (m: {
          id: number;
          title: string;
          overview: string;
          poster_path: string | null;
          vote_average: number;
          genre_ids: number[];
        }) => ({
          id: m.id,
          title: m.title,
          overview: m.overview || 'Sem sinopse disponível.',
          poster: '🎬',
          posterUrl: m.poster_path
            ? `https://image.tmdb.org/t/p/w300${m.poster_path}`
            : undefined,
          rating: Math.round(m.vote_average * 10) / 10,
          tags: (m.genre_ids ?? [])
            .map((id) => genreMap.get(id))
            .filter((x): x is string => Boolean(x))
            .slice(0, 3),
        })
      );

    return json({ movies });
  } catch (err) {
    console.error('[api/movies] TMDB fetch failed:', err);
    return json({ error: 'Falha ao buscar filmes na TMDB', movies: [] });
  }
}
