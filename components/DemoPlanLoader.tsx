'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import DatePlanner from './DatePlanner';
import InviteNotFound from './InviteNotFound';
import { getDemoPlan } from '@/lib/demoStore';
import { emptyPlan, type Mode, type PlanData } from '@/lib/types';

// Demo-mode counterpart of app/page.tsx's server-side getPlan: the plan
// lives in this browser's localStorage (lib/demoStore.ts), so it can only
// be read once we're on the client.
//
// It's the page root for every demo URL (with or without id) on purpose:
// after "Gerar Link" the URL gains ?id=…, and keeping the same root lets
// the mounted DatePlanner keep its state (current tab, edits) — just like
// the normal flow, where the root is always <DatePlanner>.
export default function DemoPlanLoader({ mode, id }: { mode: Mode; id?: string }) {
  const [plan, setPlan] = useState<PlanData | null | undefined>(() =>
    id ? undefined : emptyPlan()
  );

  useEffect(() => {
    if (id) setPlan(getDemoPlan(id));
  }, [id]);

  if (plan === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Heart size={32} className="animate-pulse fill-blush text-blush" />
      </div>
    );
  }
  if (!plan) return <InviteNotFound isGuest={mode === 'guest'} />;
  return <DatePlanner initialMode={mode} initialPlan={plan} planId={id ?? null} />;
}
