'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, X, Route, Navigation } from 'lucide-react';
import { usePlanner } from '@/lib/PlannerContext';
import { PLACE_SUGGESTIONS } from '@/lib/mockData';
import { toggleRank, rankOf, MAX_RANK } from '@/lib/ranking';
import { CLOSENESS_LABEL, CLOSENESS_LABEL_SHORT } from '@/lib/matching';
import RankTapButton from '@/components/RankTapButton';
import PortalDropdown from '@/components/PortalDropdown';
import type { Place } from '@/lib/types';

const uid = () => Math.random().toString(36).slice(2, 9);
const norm = (s: string) => s.trim().toLowerCase();

export default function PlacesTab() {
  const { isHost, me, other, updateMe, matches } = usePlanner();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<
    { name: string; category: string }[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Real Google Places Autocomplete (via /api/places), debounced.
  // Falls back to the local mock list if the live call fails or is
  // unconfigured, so search never dead-ends.
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
      fetch(`/api/places?input=${encodeURIComponent(q)}`)
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
  }, [query]);

  const addPlace = (name: string, category: string) => {
    if (!name.trim()) return;
    const place: Place = { id: uid(), name: name.trim(), category };
    updateMe({ places: [...me.places, place] });
    setQuery('');
  };

  const removePlace = (place: Place) => {
    updateMe({
      places: me.places.filter((p) => p.id !== place.id),
      placeRanks: me.placeRanks.filter((n) => norm(n) !== norm(place.name)),
    });
  };

  // Tap-to-rank — shared top-3 list across both the host's suggestions
  // (favorited by name) and this person's own added places.
  const toggleRankPlace = (name: string) => {
    updateMe({ placeRanks: toggleRank(me.placeRanks, name) });
  };
  const atCap = me.placeRanks.length >= MAX_RANK;

  const closenessByName = new Map(
    matches.places.map((m) => [norm(m.id), m.closeness])
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-wine">
        <MapPin size={18} />
        <h2 className="section-title">Lugares</h2>
      </div>
      <p className="text-sm text-mist">
        Toque em ordem nos até 3 lugares que você mais quer ir — sua 1ª
        escolha primeiro.
      </p>

      {/* GUEST: host's suggested places to rank */}
      {!isHost && (other?.places.length ?? 0) > 0 && (
        <div className="card space-y-3">
          <p className="text-sm text-mist">Lugares que ele(a) sugeriu:</p>
          <div className="space-y-2">
            {other!.places.map((p) => {
              const rank = rankOf(me.placeRanks, p.name);
              const closeness = closenessByName.get(norm(p.name));
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 transition ${
                    closeness
                      ? 'border-rose bg-rose/10'
                      : 'border-sand bg-white/60'
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
                      onTap={() => toggleRankPlace(p.name)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Autocomplete add */}
      <div className="card relative z-20 space-y-3">
        <p className="section-title text-base">
          {isHost ? 'Adicione 3 a 5 lugares' : 'Sugerir um lugar seu'}
        </p>
        <div className="relative">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar café, parque, restaurante…"
            className="field"
          />
          <PortalDropdown anchorRef={inputRef} open={suggestions.length > 0}>
            <ul className="w-full rounded-2xl border border-sand bg-white shadow-soft">
              {suggestions.map((s) => (
                <li key={s.name}>
                  <button
                    onClick={() => addPlace(s.name, s.category)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-blush/20"
                  >
                    <MapPin size={16} className="text-rose" />
                    <span className="text-sm text-ink">{s.name}</span>
                    <span className="ml-auto text-xs text-mist">
                      {s.category}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </PortalDropdown>
        </div>
        {query.trim() && suggestions.length === 0 && (
          <button
            onClick={() => addPlace(query, 'Personalizado')}
            className="btn-ghost w-full"
          >
            <Plus size={16} /> Adicionar “{query.trim()}”
          </button>
        )}
      </div>

      {/* My places */}
      {me.places.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-mist">
            Seus lugares
          </p>
          {me.places.map((p) => {
            const rank = rankOf(me.placeRanks, p.name);
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
                    onTap={() => toggleRankPlace(p.name)}
                  />
                  <button
                    onClick={() => removePlace(p)}
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

      {/* Match → tiny conceptual route card */}
      {matches.places.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card relative z-0 bg-gradient-to-br from-blush/40 to-white"
        >
          <div className="flex items-center gap-2 text-wine">
            <Route size={18} />
            <p className="font-semibold">
              {CLOSENESS_LABEL[matches.places[0].closeness]}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-card">
              📍
            </span>
            <div className="h-px flex-1 border-t-2 border-dashed border-rose/50" />
            <span className="rounded-full bg-rose px-3 py-1 text-xs font-semibold text-white">
              {matches.places[0].id}
            </span>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              matches.places[0].id
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost mt-3 w-full"
          >
            <Navigation size={16} /> Ver rota no Google Maps
          </a>
        </motion.div>
      )}
    </div>
  );
}
