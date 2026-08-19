'use client';

import { useEffect, useState } from 'react';
import { NOW_PLAYING, type Movie } from './mockData';

export type MoviesSource = 'loading' | 'live' | 'fallback';

// Shared by MoviesTab (browsing) and SummaryTab (looking up a matched
// movie's title) so both agree on the same list — real TMDB ids don't
// exist in the mock catalog, so each needs the live list to resolve titles.
export function useNowPlaying() {
  const [movies, setMovies] = useState<Movie[]>(NOW_PLAYING);
  const [source, setSource] = useState<MoviesSource>('loading');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/movies')
      .then((r) => r.json())
      .then((data: { movies?: Movie[] }) => {
        if (cancelled) return;
        if (data.movies && data.movies.length > 0) {
          setMovies(data.movies);
          setSource('live');
        } else {
          setSource('fallback');
        }
      })
      .catch(() => {
        if (!cancelled) setSource('fallback');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { movies, source };
}
