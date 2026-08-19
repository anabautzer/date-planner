'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PlannerProvider, usePlanner } from '@/lib/PlannerContext';
import type { Mode, PlanData, TabId } from '@/lib/types';
import Header from './Header';
import TabBar from './TabBar';
import MatchBurst from './MatchBurst';
import ScheduleTab from './tabs/ScheduleTab';
import PlacesTab from './tabs/PlacesTab';
import MoviesTab from './tabs/MoviesTab';
import FoodTab from './tabs/FoodTab';
import ActivitiesTab from './tabs/ActivitiesTab';
import SummaryTab from './tabs/SummaryTab';

const TAB_COMPONENTS: Record<TabId, () => JSX.Element> = {
  schedule: ScheduleTab,
  places: PlacesTab,
  movies: MoviesTab,
  food: FoodTab,
  activities: ActivitiesTab,
  summary: SummaryTab,
};

function Shell() {
  const { matches, isGuest } = usePlanner();
  const [tab, setTab] = useState<TabId>('schedule');

  // Switching tabs doesn't navigate, so the window keeps whatever scroll
  // position the previous (possibly taller) tab was at — jump back to the
  // top so every tab always opens from the beginning.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab]);

  // Fire the "Match!" burst whenever the total number of overlaps grows.
  const [burst, setBurst] = useState(false);
  const prevCount = useRef(0);
  const totalMatches =
    matches.slots.length +
    matches.places.length +
    matches.movies.length +
    matches.cuisines.length +
    matches.drinks.length +
    matches.activities.length;

  useEffect(() => {
    if (isGuest && totalMatches > prevCount.current) {
      setBurst(true);
      const t = setTimeout(() => setBurst(false), 1100);
      prevCount.current = totalMatches;
      return () => clearTimeout(t);
    }
    prevCount.current = totalMatches;
  }, [totalMatches, isGuest]);

  const ActiveTab = TAB_COMPONENTS[tab];

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <Header />

      <main className="flex-1 px-5 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <ActiveTab />
          </motion.div>
        </AnimatePresence>
      </main>

      <TabBar active={tab} onChange={setTab} />
      <MatchBurst show={burst} />
    </div>
  );
}

export default function DatePlanner({
  initialMode,
  initialPlan,
  planId = null,
}: {
  initialMode: Mode;
  initialPlan: PlanData;
  planId?: string | null;
}) {
  return (
    <PlannerProvider
      mode={initialMode}
      initialPlan={initialPlan}
      initialPlanId={planId}
    >
      <Shell />
    </PlannerProvider>
  );
}
