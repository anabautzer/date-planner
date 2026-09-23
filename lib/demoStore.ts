import { normalizePlan, type PlanData } from './types';

// ─────────────────────────────────────────────────────────────
// Browser-only stand-in for lib/store.ts, used when IS_DEMO is on.
// Same operations (create / get / patch), but plans live in
// localStorage under `demo-plan:<id>` — so the guest and results
// links work across tabs of the same browser, and nothing ever
// reaches a server.
//
// Every localStorage access is wrapped in try/catch (private mode,
// blocked storage…). If it fails, an in-memory map takes over — good
// enough to demo the flow within a single tab.
// ─────────────────────────────────────────────────────────────

const keyFor = (id: string) => `demo-plan:${id}`;
const memory = new Map<string, string>();

function write(id: string, plan: PlanData) {
  const raw = JSON.stringify(plan);
  memory.set(keyFor(id), raw);
  try {
    localStorage.setItem(keyFor(id), raw);
  } catch {}
}

function read(id: string): PlanData | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(keyFor(id));
  } catch {}
  raw = raw ?? memory.get(keyFor(id)) ?? null;
  if (!raw) return null;
  try {
    return normalizePlan(JSON.parse(raw));
  } catch {
    return null;
  }
}

function generateDemoPlanId(): string {
  try {
    return crypto.randomUUID().replace(/-/g, '');
  } catch {
    // randomUUID needs a secure context — fine for a demo id.
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

export function createDemoPlan(plan: PlanData): string {
  const id = generateDemoPlanId();
  write(id, plan);
  return id;
}

export function getDemoPlan(id: string): PlanData | null {
  if (!id) return null;
  return read(id);
}

export function patchDemoPlan(
  id: string,
  patch: Partial<Pick<PlanData, 'host' | 'guest'>> & { guestName?: string }
): PlanData | null {
  const existing = read(id);
  if (!existing) return null;
  const updated: PlanData = { ...existing, ...patch };
  write(id, updated);
  return updated;
}
