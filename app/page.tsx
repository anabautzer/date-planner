import DatePlanner from '@/components/DatePlanner';
import InviteNotFound from '@/components/InviteNotFound';
import { getPlan } from '@/lib/store';
import { emptyPlan, type Mode, type PlanData } from '@/lib/types';

// The one route. It reads the URL to decide who's looking:
//   /                    → Host, blank plan (first-time invite creation)
//   /?id=<id>            → Host, revisiting their saved results link
//   /?mode=guest&id=<id> → Guest, answering an invite
export default async function Home({
  searchParams,
}: {
  searchParams: { mode?: string; id?: string };
}) {
  const mode: Mode = searchParams.mode === 'guest' ? 'guest' : 'host';

  if (searchParams.id) {
    const stored = await getPlan(searchParams.id);
    if (!stored) return <InviteNotFound isGuest={mode === 'guest'} />;
    return (
      <DatePlanner initialMode={mode} initialPlan={stored} planId={searchParams.id} />
    );
  }

  if (mode === 'guest') {
    // A guest link always carries an id — no id means an incomplete link.
    return <InviteNotFound isGuest />;
  }

  const plan: PlanData = emptyPlan();
  return <DatePlanner initialMode="host" initialPlan={plan} />;
}
