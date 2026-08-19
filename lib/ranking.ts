// ─────────────────────────────────────────────────────────────
// Shared "top 3, tap in order" logic used by Movies/Food/Activities/Places.
// Array order IS the rank: index 0 is the #1 pick, up to `max` items.
// ─────────────────────────────────────────────────────────────

export const MAX_RANK = 3;

/**
 * Tapping an unranked item appends it (next available rank). Tapping an
 * already-ranked item removes it (unranks). At the cap, tapping a new
 * item is a no-op — caller should nudge the user to remove one first.
 */
export function toggleRank<T>(current: T[], id: T, max = MAX_RANK): T[] {
  if (current.includes(id)) {
    return current.filter((x) => x !== id);
  }
  if (current.length >= max) return current;
  return [...current, id];
}

export function rankOf<T>(list: T[], id: T): number | null {
  const i = list.indexOf(id);
  return i === -1 ? null : i + 1;
}
