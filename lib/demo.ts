// ─────────────────────────────────────────────────────────────
// Demo mode: the whole app runs without TMDB, Google Places or
// Upstash Redis — mock data for movies/places, and invites saved in
// the browser (see lib/demoStore.ts). Meant for a second deploy with
// no API keys at all, to show the app off safely.
//
// NEXT_PUBLIC_ vars are inlined at build time, so flipping this
// requires a rebuild. Always read it through IS_DEMO — never
// process.env directly elsewhere.
// ─────────────────────────────────────────────────────────────

export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
