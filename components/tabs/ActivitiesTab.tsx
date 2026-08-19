'use client';

import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlanner } from '@/lib/PlannerContext';
import { ACTIVITIES } from '@/lib/mockData';
import { toggleRank, rankOf, MAX_RANK } from '@/lib/ranking';
import { CLOSENESS_LABEL_SHORT } from '@/lib/matching';
import RankTapButton from '@/components/RankTapButton';

export default function ActivitiesTab() {
  const { me, updateMe, matches } = usePlanner();

  const closenessById = new Map(matches.activities.map((m) => [m.id, m.closeness]));
  const atCap = me.activities.length >= MAX_RANK;

  const toggle = (id: string) => {
    updateMe({ activities: toggleRank(me.activities, id) });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-wine">
        <Sparkles size={18} />
        <h2 className="section-title">Atividades Juntos</h2>
      </div>
      <p className="text-sm text-mist">
        Toque em ordem nas até <b className="text-wine">3</b> que você mais
        quer fazer — a 1ª que tocar é sua favorita.
      </p>

      <div className="grid grid-cols-1 gap-3">
        {ACTIVITIES.map((a) => {
          const rank = rankOf(me.activities, a.id);
          const closeness = closenessById.get(a.id);
          return (
            <motion.div
              key={a.id}
              whileTap={{ scale: 0.99 }}
              className={`card flex items-center gap-3 ${
                closeness ? 'ring-2 ring-rose' : ''
              }`}
            >
              <span className="text-2xl">{a.emoji}</span>
              <span className="min-w-0 flex-1 text-sm font-medium text-ink">
                {a.label}
              </span>
              {closeness && (
                <span className="flex-none whitespace-nowrap rounded-full bg-rose px-2 py-0.5 text-[10px] font-bold text-white">
                  {CLOSENESS_LABEL_SHORT[closeness]}
                </span>
              )}
              <RankTapButton
                rank={rank}
                atCap={atCap && !rank}
                onTap={() => toggle(a.id)}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
