import type { PlanData } from './types';

// ─────────────────────────────────────────────────────────────
// Pure functions that compute the overlaps between host & guest.
// Movies/cuisines/drinks/activities/places/restaurants/bars are all
// "ranked" lists (see lib/ranking.ts) — a match carries both people's
// rank for that item so the UI can tell a "both picked it #1" match
// apart from a looser one.
//
// Cuisines/drinks allow up to 6 picks (see FOOD_MAX in FoodTab.tsx), but
// only positions 1–3 count as a truly "ranked" pick — see the `<= 3`
// guard in closenessOf. Positions 4–6 are a fallback pool: they still
// produce a match if the other person also has that item somewhere in
// their list, just never "perfect"/"close", since tap order beyond 3
// isn't meant to signal real preference intensity.
// ─────────────────────────────────────────────────────────────

const norm = (s: string) => s.trim().toLowerCase();
const TRUE_RANK_MAX = 3;

export type Closeness = 'perfect' | 'close' | 'match';

export interface RankedMatch<T> {
  id: T;
  hostRank: number;
  guestRank: number;
  closeness: Closeness;
}

function closenessOf(hostRank: number, guestRank: number): Closeness {
  if (hostRank <= TRUE_RANK_MAX && guestRank <= TRUE_RANK_MAX) {
    if (hostRank === guestRank) return 'perfect';
    if (Math.abs(hostRank - guestRank) <= 1) return 'close';
  }
  return 'match';
}

export const CLOSENESS_LABEL: Record<Closeness, string> = {
  perfect: '✨ Match perfeito!',
  close: '🌟 Quase igual!',
  match: '💫 Deram match!',
};

// Shorter labels for compact per-item badges (place/movie/food/activity
// cards) — the full labels above are for the one-off Summary banner,
// which has room to breathe.
export const CLOSENESS_LABEL_SHORT: Record<Closeness, string> = {
  perfect: '✨ Perfeito',
  close: '🌟 Quase',
  match: '💫 Match',
};

/** Exact-id ranked lists (movie ids, cuisine/drink/activity ids). */
function rankedIntersection<T>(hostList: T[], guestList: T[]): RankedMatch<T>[] {
  const matches: RankedMatch<T>[] = [];
  hostList.forEach((id, i) => {
    const gi = guestList.indexOf(id);
    if (gi === -1) return;
    const hostRank = i + 1;
    const guestRank = gi + 1;
    matches.push({ id, hostRank, guestRank, closeness: closenessOf(hostRank, guestRank) });
  });
  return matches;
}

/** Place/restaurant/bar ranks are free-typed names — compare case/whitespace-insensitively. */
function rankedPlaceIntersection(
  hostRanks: string[],
  guestRanks: string[]
): RankedMatch<string>[] {
  const matches: RankedMatch<string>[] = [];
  hostRanks.forEach((name, i) => {
    const gi = guestRanks.findIndex((g) => norm(g) === norm(name));
    if (gi === -1) return;
    const hostRank = i + 1;
    const guestRank = gi + 1;
    matches.push({
      id: name, // keep host's original casing for display
      hostRank,
      guestRank,
      closeness: closenessOf(hostRank, guestRank),
    });
  });
  return matches;
}

export interface Matches {
  slots: { date: string; from: string; to: string }[];
  places: RankedMatch<string>[];
  restaurants: RankedMatch<string>[];
  bars: RankedMatch<string>[];
  movies: RankedMatch<number>[];
  cuisines: RankedMatch<string>[];
  drinks: RankedMatch<string>[];
  activities: RankedMatch<string>[];
  /** 0–100 "vibe" score: how much both picked the same things (see computeMatches). */
  score: number;
  hasAny: boolean;
}

export function computeMatches(plan: PlanData): Matches {
  const empty: Matches = {
    slots: [],
    places: [],
    restaurants: [],
    bars: [],
    movies: [],
    cuisines: [],
    drinks: [],
    activities: [],
    score: 0,
    hasAny: false,
  };
  if (!plan.guest) return empty;

  const host = plan.host;
  const guest = plan.guest;

  // Schedule: a match is a guest slot whose date the host also offered.
  const hostDates = new Set(host.slots.map((s) => s.date));
  const slots = guest.slots
    .filter((s) => hostDates.has(s.date))
    .map((s) => ({ date: s.date, from: s.from, to: s.to }));

  const places = rankedPlaceIntersection(host.placeRanks, guest.placeRanks);
  const restaurants = rankedPlaceIntersection(host.restaurantRanks, guest.restaurantRanks);
  const bars = rankedPlaceIntersection(host.barRanks, guest.barRanks);
  const movies = rankedIntersection(host.movies, guest.movies);
  const cuisines = rankedIntersection(host.cuisines, guest.cuisines);
  const drinks = rankedIntersection(host.drinks, guest.drinks);
  const activities = rankedIntersection(host.activities, guest.activities);

  // Score = how much the two picked the same things. Per category:
  // matches ÷ the bigger of the two selections (host 3 + guest 2, both
  // matching → 2/3; identical picks → 100%). Categories nobody filled in
  // are left out, and the weights of the rest are rescaled to add up to
  // 100 — so leaving e.g. bars empty on both sides doesn't cap the score.
  const guestDates = new Set(guest.slots.map((s) => s.date));
  const sharedDates = Array.from(guestDates).filter((d) => hostDates.has(d)).length;

  const categories: { matched: number; hostCount: number; guestCount: number; weight: number }[] = [
    { matched: sharedDates, hostCount: hostDates.size, guestCount: guestDates.size, weight: 15 },
    { matched: places.length, hostCount: host.placeRanks.length, guestCount: guest.placeRanks.length, weight: 15 },
    { matched: movies.length, hostCount: host.movies.length, guestCount: guest.movies.length, weight: 15 },
    { matched: restaurants.length, hostCount: host.restaurantRanks.length, guestCount: guest.restaurantRanks.length, weight: 10 },
    { matched: bars.length, hostCount: host.barRanks.length, guestCount: guest.barRanks.length, weight: 10 },
    { matched: cuisines.length, hostCount: host.cuisines.length, guestCount: guest.cuisines.length, weight: 15 },
    { matched: drinks.length, hostCount: host.drinks.length, guestCount: guest.drinks.length, weight: 10 },
    { matched: activities.length, hostCount: host.activities.length, guestCount: guest.activities.length, weight: 10 },
  ];
  const active = categories.filter((c) => c.hostCount + c.guestCount > 0);
  const totalWeight = active.reduce((sum, c) => sum + c.weight, 0);
  const score =
    totalWeight === 0
      ? 0
      : Math.round(
          (active.reduce(
            (sum, c) => sum + (c.matched / Math.max(c.hostCount, c.guestCount)) * c.weight,
            0
          ) /
            totalWeight) *
            100
        );

  const hasAny =
    slots.length +
      places.length +
      restaurants.length +
      bars.length +
      movies.length +
      cuisines.length +
      drinks.length +
      activities.length >
    0;

  return {
    slots,
    places,
    restaurants,
    bars,
    movies,
    cuisines,
    drinks,
    activities,
    score,
    hasAny,
  };
}
