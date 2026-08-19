import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────
// Server-side proxy for Google Places Autocomplete (New).
// Keeps the key out of client-side fetch calls (it's still shipped
// in the bundle if referenced from 'use client' code elsewhere, but
// this route never does that — it reads process.env at request time).
//
// Requires the "Places API (New)" service enabled on the GCP project
// (distinct from the legacy "Places API").
// ─────────────────────────────────────────────────────────────

interface Suggestion {
  name: string;
  category: string;
}

// Explicit charset so any client that (unlike browsers) relies on the
// Content-Type header to detect encoding decodes accented text correctly.
function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

// Google Places "Table A" primary types. Only 'restaurant' and 'bar' are
// used today (Food tab's dedicated pickers) — the generic Places tab
// passes no type at all, searching everything.
const ALLOWED_TYPES = new Set(['restaurant', 'bar']);

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get('input')?.trim();
  const typeParam = req.nextUrl.searchParams.get('type');
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (!input || input.length < 2) {
    return json({ suggestions: [] });
  }
  if (!key) {
    return json({ error: 'NEXT_PUBLIC_GOOGLE_MAPS_KEY não configurado', suggestions: [] });
  }

  const body: Record<string, unknown> = {
    input,
    languageCode: 'pt-BR',
    regionCode: 'BR',
    // Hard-restrict to Brazil (no foreign noise for short/ambiguous
    // names like "Monk Bar") + soft bias toward São Paulo's metro area
    // so nearby results rank first without blocking other BR cities.
    includedRegionCodes: ['br'],
    locationBias: {
      circle: {
        center: { latitude: -23.5505, longitude: -46.6333 },
        radius: 40000, // meters
      },
    },
  };
  if (typeParam && ALLOWED_TYPES.has(typeParam)) {
    body.includedPrimaryTypes = [typeParam];
  }

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Places ${res.status}: ${body}`);
    }

    const data = await res.json();
    const suggestions: Suggestion[] = (data.suggestions ?? [])
      .map((s: any) => s.placePrediction)
      .filter(Boolean)
      .map((p: any) => ({
        name: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
        category: p.structuredFormat?.secondaryText?.text ?? 'Local',
      }))
      .filter((s: Suggestion) => s.name);

    return json({ suggestions });
  } catch (err) {
    console.error('[api/places] Google Places fetch failed:', err);
    return json({ error: 'Falha ao buscar lugares', suggestions: [] });
  }
}
