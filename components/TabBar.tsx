'use client';

import { motion } from 'framer-motion';
import {
  CalendarDays,
  MapPin,
  Clapperboard,
  Wine,
  Sparkles,
  MessageCircleHeart,
} from 'lucide-react';
import type { TabId } from '@/lib/types';

const TABS: { id: TabId; label: string; icon: typeof MapPin }[] = [
  { id: 'schedule', label: 'Agenda', icon: CalendarDays },
  { id: 'places', label: 'Lugares', icon: MapPin },
  { id: 'movies', label: 'Cinema', icon: Clapperboard },
  { id: 'food', label: 'Comida', icon: Wine },
  { id: 'activities', label: 'Atividades', icon: Sparkles },
  { id: 'summary', label: 'Resumo', icon: MessageCircleHeart },
];

export default function TabBar({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <nav className="sticky bottom-0 z-20 border-t border-white/60 bg-cream/85 backdrop-blur-md">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 py-2">
        {TABS.map(({ id, label, icon: Icon }) => {
          const on = id === active;
          return (
            <li key={id} className="flex-1">
              <button
                onClick={() => onChange(id)}
                className="relative flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-2"
                aria-current={on ? 'page' : undefined}
              >
                {on && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-2xl bg-white shadow-card"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon
                  size={20}
                  className={`relative z-10 ${on ? 'text-wine' : 'text-mist'}`}
                />
                <span
                  className={`relative z-10 text-[10px] font-medium ${
                    on ? 'text-wine' : 'text-mist'
                  }`}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { TABS };
