// ─────────────────────────────────────────────────────────────
// Domain types shared by Host and Guest.
// Everything the two people fill in lives inside `Person`.
// The whole plan is persisted server-side, keyed by an id (see lib/store.ts).
// ─────────────────────────────────────────────────────────────

export type Mode = 'host' | 'guest';

export type TabId =
  | 'schedule'
  | 'places'
  | 'movies'
  | 'food'
  | 'activities'
  | 'summary';

export interface TimeSlot {
  id: string;
  date: string; // ISO date, e.g. "2026-07-25"
  from: string; // "19:00"
  to: string; // "22:00"
}

export interface Place {
  id: string;
  name: string;
  category: string; // "Café", "Restaurante", "Parque"...
  /** Optional coords for the little map/route flourish. */
  lat?: number;
  lng?: number;
}

/**
 * Preference lists below (movies, cuisines, drinks, activities, placeRanks)
 * are all "top 3, tap in order" — array order IS the rank (index 0 = #1
 * pick), capped at 3 items. See lib/ranking.ts for the shared toggle logic.
 */
export interface Person {
  slots: TimeSlot[];
  /** Places this person proposes/adds. */
  places: Place[];
  /**
   * This person's top-3 favorite places, in order. Stores normalized place
   * NAMES rather than ids — a host's proposal and a guest's own addition
   * can refer to "the same place" by name even though they have different
   * Place.id values.
   */
  placeRanks: string[];
  /** TMDB movie ids, top 3 in order of preference. */
  movies: number[];
  /**
   * Cuisine ids (see lib/mockData.ts CUISINES). Up to 6 selected, but only
   * the first 3 (by tap order) count as the "ranked" top 3 for closeness —
   * 4–6 are a fallback pool so there's still something to match on even if
   * the top picks don't align. Same shape for `drinks` below.
   */
  cuisines: string[];
  /** Drink ids (see lib/mockData.ts DRINKS) — up to 6, same top-3+fallback shape. */
  drinks: string[];
  dietary: string;
  /** Activity ids (see lib/mockData.ts ACTIVITIES), top 3 in order. */
  activities: string[];
  /** Restaurant names this person wants to go to, top 3 in order (like placeRanks). */
  restaurants: Place[];
  restaurantRanks: string[];
  /** Bar names this person wants to go to, top 3 in order (like placeRanks). */
  bars: Place[];
  barRanks: string[];
  note: string;
}

export interface PlanData {
  version: 1;
  createdAt: string;
  hostName: string;
  guestName: string;
  host: Person;
  guest: Person | null; // null until the guest starts responding
}

export const emptyPerson = (): Person => ({
  slots: [],
  places: [],
  placeRanks: [],
  movies: [],
  cuisines: [],
  drinks: [],
  dietary: '',
  activities: [],
  restaurants: [],
  restaurantRanks: [],
  bars: [],
  barRanks: [],
  note: '',
});

export const emptyPlan = (): PlanData => ({
  version: 1,
  createdAt: new Date().toISOString(),
  hostName: '',
  guestName: '',
  host: emptyPerson(),
  guest: null,
});

/**
 * Backfills any fields missing from a Person loaded from storage (Redis or
 * a local draft) — a schema boundary check for data written before a field
 * was added. Without this, an old saved plan crashes the app the moment a
 * tab reads a field that didn't exist yet when it was saved.
 */
export function normalizePerson(p: Partial<Person> | null | undefined): Person {
  return { ...emptyPerson(), ...p };
}

export function normalizePlan(plan: PlanData): PlanData {
  return {
    ...plan,
    host: normalizePerson(plan.host),
    guest: plan.guest ? normalizePerson(plan.guest) : null,
  };
}
