import { ACTIVITIES, CUISINES, DRINKS, PLACE_SUGGESTIONS, type Movie } from './mockData';
import { MAX_RANK } from './ranking';
import type { Closeness } from './matching';
import type { Person, Place } from './types';

// ─────────────────────────────────────────────────────────────
// Demo-only: builds a ready-made Guest answer out of the Host's own
// picks, so "Simular resposta do convidado" always produces matches —
// and, whenever the Host picked at least a few things, one of each
// badge (✨ perfect, 🌟 close, 💫 match).
//
// Mirrors lib/matching.ts › closenessOf: only ranks 1–3 are "real"
// ranks; same rank = perfect, 1 apart = close, anything else = match.
// Walking the Host's picks category by category, each one is placed at
// a guest rank that yields a badge not produced yet (falling back to
// any free rank). E.g. the Host's #1 movie lands at the guest's #1
// (perfect) and their #2 at the guest's #3 (close). Gaps in the guest
// list are padded with items the Host didn't pick.
// ─────────────────────────────────────────────────────────────

const FOOD_MAX = 6; // same cap as FoodTab.tsx — ranks 4–6 always give "match"
const BADGES: Closeness[] = ['perfect', 'close', 'match'];
const norm = (s: string) => s.trim().toLowerCase();
const uid = () => Math.random().toString(36).slice(2, 9);

/** Guest rank (1-based) that gives `badge` against `hostRank`, or null if none is free. */
function rankFor(hostRank: number, badge: Closeness, cap: number, used: Set<number>) {
  for (let p = 1; p <= cap; p++) {
    if (used.has(p)) continue;
    const ranked = hostRank <= MAX_RANK && p <= MAX_RANK;
    const got: Closeness =
      ranked && p === hostRank
        ? 'perfect'
        : ranked && Math.abs(p - hostRank) === 1
        ? 'close'
        : 'match';
    if (got === badge) return p;
  }
  return null;
}

function mirror<T>(
  hostList: T[],
  cap: number,
  fillers: T[],
  seen: Set<Closeness>
): T[] {
  const slots: (T | undefined)[] = [];
  const used = new Set<number>();

  hostList.slice(0, cap).forEach((item, i) => {
    const hostRank = i + 1;
    const order = [
      ...BADGES.filter((b) => !seen.has(b)),
      ...BADGES.filter((b) => seen.has(b)),
    ];
    for (const badge of order) {
      const p = rankFor(hostRank, badge, cap, used);
      if (p === null) continue;
      used.add(p);
      slots[p - 1] = item;
      seen.add(badge);
      return;
    }
  });

  // Pad any holes so each item keeps the exact rank chosen above.
  const pool = fillers.filter((f) => !hostList.includes(f));
  const out: T[] = [];
  for (let i = 0; i < slots.length; i++) {
    const item = slots[i] ?? pool.shift();
    if (item === undefined) break;
    out.push(item);
  }
  return out;
}

/** Same as mirror(), for name-ranked places — fillers become the guest's own additions. */
function mirrorPlaces(
  hostRanks: string[],
  hostNames: string[],
  category: string,
  seen: Set<Closeness>
): { items: Place[]; ranks: string[] } {
  const taken = new Set([...hostRanks, ...hostNames].map(norm));
  const fillers = PLACE_SUGGESTIONS.filter(
    (s) => !taken.has(norm(s.name)) && norm(s.category).includes(norm(category))
  ).map((s) => s.name);
  const ranks = mirror(hostRanks, MAX_RANK, fillers, seen);
  const items: Place[] = ranks
    .filter((name) => fillers.includes(name))
    .map((name) => ({
      id: uid(),
      name,
      category: PLACE_SUGGESTIONS.find((s) => s.name === name)?.category ?? category,
    }));
  return { items, ranks };
}

export function buildDemoGuest(host: Person, movies: Movie[]): Person {
  const seen = new Set<Closeness>();

  const movieIds = mirror(host.movies, MAX_RANK, movies.map((m) => m.id), seen);
  const cuisines = mirror(host.cuisines, FOOD_MAX, CUISINES.map((c) => c.id), seen);
  const drinks = mirror(host.drinks, FOOD_MAX, DRINKS.map((d) => d.id), seen);
  const activities = mirror(host.activities, MAX_RANK, ACTIVITIES.map((a) => a.id), seen);
  const places = mirrorPlaces(host.placeRanks, host.places.map((p) => p.name), '', seen);
  const restaurants = mirrorPlaces(
    host.restaurantRanks,
    host.restaurants.map((p) => p.name),
    'Restaurante',
    seen
  );
  const bars = mirrorPlaces(host.barRanks, host.bars.map((p) => p.name), 'Bar', seen);

  return {
    // Same dates the Host offered → schedule matches too.
    slots: host.slots.slice(0, 2).map((s) => ({ ...s, id: uid() })),
    places: places.items,
    placeRanks: places.ranks,
    movies: movieIds,
    cuisines,
    drinks,
    dietary: '',
    activities,
    restaurants: restaurants.items,
    restaurantRanks: restaurants.ranks,
    bars: bars.items,
    barRanks: bars.ranks,
    note: 'Topei! Mal posso esperar 💕',
  };
}
