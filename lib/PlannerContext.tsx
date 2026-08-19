'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { Mode, PlanData, Person } from './types';
import { emptyPerson, normalizePlan } from './types';
import { computeMatches, type Matches } from './matching';

// ─────────────────────────────────────────────────────────────
// Central store. Every tab reads the plan and edits *its own side*.
//
// `mode` decides which Person the edits land on:
//   host  → plan.host
//   guest → plan.guest (lazily created on first edit)
//
// This is the heart of the unidirectional access rule: a guest can
// never mutate plan.host, only mirror/favorite it into plan.guest.
//
// When `planId` is set (the invite was saved to the backend), guest
// edits auto-save there (debounced) so the Host can see them by
// revisiting their results link. See app/api/plan/[id]/route.ts.
// ─────────────────────────────────────────────────────────────

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

// Local safety net for a Host filling out a brand-new invite (no planId
// yet, so there's nothing to auto-save to the backend). Protects against
// an accidental refresh/tab close wiping unsaved work.
const DRAFT_KEY = 'date-planner-draft';

interface PlannerCtx {
  mode: Mode;
  plan: PlanData;
  setPlan: React.Dispatch<React.SetStateAction<PlanData>>;
  /** The Person the current user is allowed to edit. */
  me: Person;
  /** The other side (read-only for the current user). May be null for guest. */
  other: Person | null;
  /** Patch the current user's Person. */
  updateMe: (patch: Partial<Person>) => void;
  matches: Matches;
  isHost: boolean;
  isGuest: boolean;
  /** Backend id for this plan, once the Host has generated an invite. */
  planId: string | null;
  setPlanId: (id: string) => void;
  /** Guest-side auto-save status against the backend. */
  syncStatus: SyncStatus;
  /** True right after a local draft was restored on load (Host only). */
  draftRestored: boolean;
}

const Ctx = createContext<PlannerCtx | null>(null);

export function PlannerProvider({
  mode,
  initialPlan,
  initialPlanId = null,
  children,
}: {
  mode: Mode;
  initialPlan: PlanData;
  initialPlanId?: string | null;
  children: ReactNode;
}) {
  const [plan, setPlan] = useState<PlanData>(() => normalizePlan(initialPlan));
  const [planId, setPlanId] = useState<string | null>(initialPlanId);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [draftRestored, setDraftRestored] = useState(false);
  const router = useRouter();

  const isHost = mode === 'host';
  const isGuest = mode === 'guest';

  // Keep the address bar in sync with the generated invite. Without this,
  // the Host stays on plain "/" after clicking "Gerar Link" — an accidental
  // refresh would then load a blank plan instead of the saved one.
  useEffect(() => {
    if (!isHost || !planId) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('id') !== planId) {
      url.searchParams.set('id', planId);
      router.replace(url.pathname + url.search);
    }
  }, [isHost, planId, router]);

  // Restore a locally-saved draft — only for a brand-new Host visit (no id
  // in the URL yet). A Host revisiting their results link already gets
  // real data from the server via `initialPlan`, so don't clobber that.
  useEffect(() => {
    if (!isHost || initialPlanId) return;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        setPlan(normalizePlan(JSON.parse(saved)));
        setDraftRestored(true);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep saving the draft locally while there's no backend copy yet.
  useEffect(() => {
    if (!isHost || planId) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(plan));
    } catch {}
  }, [plan, isHost, planId]);

  // Once the invite is generated, the data is safely on the server —
  // the local draft has done its job.
  useEffect(() => {
    if (!isHost || !planId) return;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }, [isHost, planId]);

  const me: Person = isHost ? plan.host : plan.guest ?? emptyPerson();
  const other: Person | null = isHost ? plan.guest : plan.host;

  const updateMe = (patch: Partial<Person>) => {
    setPlan((prev) => {
      if (isHost) {
        return { ...prev, host: { ...prev.host, ...patch } };
      }
      const base = prev.guest ?? emptyPerson();
      return { ...prev, guest: { ...base, ...patch } };
    });
  };

  // Debounced auto-save of this person's own side to the backend — covers
  // both roles: Guest answers, and Host edits made after generating the
  // invite (so a later refresh/tab close doesn't lose unsaved changes).
  useEffect(() => {
    if (!planId) return;
    if (isGuest && !plan.guest) return; // guest hasn't started yet
    setSyncStatus('saving');
    const t = setTimeout(() => {
      const patch = isHost ? { host: plan.host } : { guest: plan.guest };
      fetch(`/api/plan/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
        .then((res) => setSyncStatus(res.ok ? 'saved' : 'error'))
        .catch(() => setSyncStatus('error'));
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.host, plan.guest, planId, isHost, isGuest]);

  const matches = useMemo(() => computeMatches(plan), [plan]);

  const value: PlannerCtx = {
    mode,
    plan,
    setPlan,
    me,
    other,
    updateMe,
    matches,
    isHost,
    isGuest,
    planId,
    setPlanId,
    syncStatus,
    draftRestored,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlanner(): PlannerCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlanner must be used inside <PlannerProvider>');
  return ctx;
}
