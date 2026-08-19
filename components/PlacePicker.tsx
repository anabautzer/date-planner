'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Plus, X } from 'lucide-react';
import { PLACE_SUGGESTIONS } from '@/lib/mockData';
import { toggleRank, rankOf } from '@/lib/ranking';
import { CLOSENESS_LABEL_SHORT, type Closeness } from '@/lib/matching';
import RankTapButton from '@/components/RankTapButton';
import PortalDropdown from '@/components/PortalDropdown';
import type { Place } from '@/lib/types';

const uid = () => Math.random().toString(36).slice(2, 9);
const norm = (s: string) => s.trim().toLowerCase();

// Reusable search-add-rank picker for a specific place type (restaurant,
// bar…). Same interaction model as PlacesTab's generic version, just
// scoped to its own fields and with the Google Places search narrowed by
// `type` (see app/api/places/route.ts's includedPrimaryTypes handling).
export default function PlacePicker({
  title,
  addPrompt,
  searchPlaceholder,
  type,
  items,
  ranks,
  otherItems,
  onItemsChange,
  onRanksChange,
  closenessByName,
  maxRank = 3,
}: {
  title: string;
  addPrompt: string;
  searchPlaceholder: string;
  type: 'restaurant' | 'bar';
  items: Place[];
  ranks: string[];
  otherItems?: Place[];
  onItemsChange: (items: Place[]) => void;
  onRanksChange: (ranks: string[]) => void;
  closenessByName: Map<string, Closeness>;
  maxRank?: number;
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<
    { name: string; category: string }[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setSuggestions([]);
      return;
    }
    const localFallback = () =>
      PLACE_SUGGESTIONS.filter(
        (s) => norm(s.name).includes(norm(q)) || norm(s.category).includes(norm(q))
      ).slice(0, 8);

    const t = setTimeout(() => {
      fetch(`/api/places?input=${encodeURIComponent(q)}&type=${type}`)
        .then((r) => r.json())
        .then((data: { suggestions?: { name: string; category: string }[] }) => {
          if (data.suggestions && data.suggestions.length > 0) {
            setSuggestions(data.suggestions.slice(0, 8));
          } else {
            setSuggestions(localFallback());
          }
        })
        .catch(() => setSuggestions(localFallback()));
    }, 300);

    return () => clearTimeout(t);
  }, [query, type]);

  const addItem = (name: string, category: string) => {
    if (!name.trim()) return;
    onItemsChange([...items, { id: uid(), name: name.trim(), category }]);
    setQuery('');
  };

  const removeItem = (item: Place) => {
    onItemsChange(items.filter((p) => p.id !== item.id));
    onRanksChange(ranks.filter((n) => norm(n) !== norm(item.name)));
  };

  const toggleRankItem = (name: string) => {
    onRanksChange(toggleRank(ranks, name, maxRank));
  };
  const atCap = ranks.length >= maxRank;

  return (
    <div className="card relative z-20 space-y-3">
      <p className="section-title text-base">{title}</p>

      {(otherItems?.length ?? 0) > 0 && (
        <div className="space-y-2">
          {otherItems!.map((p) => {
            const rank = rankOf(ranks, p.name);
            const closeness = closenessByName.get(norm(p.name));
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 transition ${
                  closeness ? 'border-rose bg-rose/10' : 'border-sand bg-white/60'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{p.name}</p>
                  <p className="text-xs text-mist">{p.category}</p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  {closeness && (
                    <span className="whitespace-nowrap rounded-full bg-rose px-2 py-0.5 text-[10px] font-bold text-white">
                      {CLOSENESS_LABEL_SHORT[closeness]}
                    </span>
                  )}
                  <RankTapButton
                    rank={rank}
                    atCap={atCap && !rank}
                    onTap={() => toggleRankItem(p.name)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="field"
        />
        <PortalDropdown anchorRef={inputRef} open={suggestions.length > 0}>
          <ul className="w-full rounded-2xl border border-sand bg-white shadow-soft">
            {suggestions.map((s) => (
              <li key={s.name}>
                <button
                  onClick={() => addItem(s.name, s.category)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-blush/20"
                >
                  <MapPin size={16} className="text-rose" />
                  <span className="text-sm text-ink">{s.name}</span>
                  <span className="ml-auto text-xs text-mist">{s.category}</span>
                </button>
              </li>
            ))}
          </ul>
        </PortalDropdown>
      </div>
      {query.trim() && suggestions.length === 0 && (
        <button onClick={() => addItem(query, addPrompt)} className="btn-ghost w-full">
          <Plus size={16} /> Adicionar “{query.trim()}”
        </button>
      )}

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((p) => {
            const rank = rankOf(ranks, p.name);
            const closeness = closenessByName.get(norm(p.name));
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between gap-2 rounded-2xl px-4 py-3 shadow-card ${
                  closeness ? 'bg-rose/10' : 'bg-white/70'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{p.name}</p>
                  <p className="text-xs text-mist">{p.category}</p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  {closeness && (
                    <span className="whitespace-nowrap rounded-full bg-rose px-2 py-0.5 text-[10px] font-bold text-white">
                      {CLOSENESS_LABEL_SHORT[closeness]}
                    </span>
                  )}
                  <RankTapButton
                    rank={rank}
                    atCap={atCap && !rank}
                    onTap={() => toggleRankItem(p.name)}
                  />
                  <button
                    onClick={() => removeItem(p)}
                    className="text-mist hover:text-wine"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
