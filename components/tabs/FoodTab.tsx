'use client';

import { Wine } from 'lucide-react';
import { usePlanner } from '@/lib/PlannerContext';
import { CUISINES, DRINKS } from '@/lib/mockData';
import { toggleRank, rankOf } from '@/lib/ranking';
import { CLOSENESS_LABEL, type Closeness } from '@/lib/matching';
import RankBadge from '@/components/RankBadge';
import PlacePicker from '@/components/PlacePicker';

// Cuisines/drinks allow more picks than the usual top-3 — only the first
// 3 (by tap order) count as a truly "ranked" pick for closeness; 4–6 are
// a fallback pool so there's still something to match on if the top
// picks don't align. See the `<= 3` guard in lib/matching.ts.
const FOOD_MAX = 6;

function ChipGroup({
  title,
  options,
  selection,
  closenessById,
  onToggle,
}: {
  title: string;
  options: { id: string; label: string; emoji: string }[];
  selection: string[];
  closenessById: Map<string, Closeness>;
  onToggle: (id: string) => void;
}) {
  const atCap = selection.length >= FOOD_MAX;
  return (
    <div className="card space-y-3">
      <p className="section-title text-base">{title}</p>
      <p className="text-xs text-mist">
        Toque em ordem — até 6. As 3 primeiras são sua escolha principal; as
        próximas 3 são reserva, pra sempre sobrar opção.
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const rank = rankOf(selection, o.id);
          const closeness = closenessById.get(o.id);
          const disabled = atCap && !rank;
          return (
            <button
              key={o.id}
              onClick={() => onToggle(o.id)}
              disabled={disabled}
              className={`chip ${rank ? 'chip-on' : 'chip-idle'} ${
                closeness ? 'ring-2 ring-rose ring-offset-1 ring-offset-cream' : ''
              } ${disabled ? 'opacity-40' : ''}`}
            >
              <span>{o.emoji}</span>
              {o.label}
              {rank && <RankBadge rank={rank} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FoodTab() {
  const { me, other, isHost, plan, updateMe, matches } = usePlanner();
  const otherName = isHost ? plan.guestName : plan.hostName;

  const cuisineCloseness = new Map(matches.cuisines.map((m) => [m.id, m.closeness]));
  const drinkCloseness = new Map(matches.drinks.map((m) => [m.id, m.closeness]));
  const restaurantCloseness = new Map(
    matches.restaurants.map((m) => [m.id.trim().toLowerCase(), m.closeness])
  );
  const barCloseness = new Map(
    matches.bars.map((m) => [m.id.trim().toLowerCase(), m.closeness])
  );

  const toggle = (key: 'cuisines' | 'drinks', id: string) => {
    const next = toggleRank(me[key], id, FOOD_MAX);
    updateMe(key === 'cuisines' ? { cuisines: next } : { drinks: next });
  };

  const allMatches = [
    ...matches.cuisines,
    ...matches.drinks,
    ...matches.restaurants,
    ...matches.bars,
  ];
  const bestCloseness: Closeness | null = allMatches.some((m) => m.closeness === 'perfect')
    ? 'perfect'
    : allMatches.some((m) => m.closeness === 'close')
    ? 'close'
    : allMatches.length > 0
    ? 'match'
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-wine">
        <Wine size={18} />
        <h2 className="section-title">Comidas, Bares & Bebidas</h2>
      </div>

      <PlacePicker
        title="Restaurantes que você quer ir"
        addPrompt="Restaurante"
        searchPlaceholder="Buscar restaurante…"
        type="restaurant"
        items={me.restaurants}
        ranks={me.restaurantRanks}
        otherItems={other?.restaurants}
        onItemsChange={(restaurants) => updateMe({ restaurants })}
        onRanksChange={(restaurantRanks) => updateMe({ restaurantRanks })}
        closenessByName={restaurantCloseness}
      />

      <ChipGroup
        title="Tipos de culinária"
        options={CUISINES}
        selection={me.cuisines}
        closenessById={cuisineCloseness}
        onToggle={(id) => toggle('cuisines', id)}
      />

      <PlacePicker
        title="Bares que você quer ir"
        addPrompt="Bar"
        searchPlaceholder="Buscar bar…"
        type="bar"
        items={me.bars}
        ranks={me.barRanks}
        otherItems={other?.bars}
        onItemsChange={(bars) => updateMe({ bars })}
        onRanksChange={(barRanks) => updateMe({ barRanks })}
        closenessByName={barCloseness}
      />

      <ChipGroup
        title="Bebidas favoritas"
        options={DRINKS}
        selection={me.drinks}
        closenessById={drinkCloseness}
        onToggle={(id) => toggle('drinks', id)}
      />

      <div className="card space-y-2">
        <p className="section-title text-base">
          Restrições ou preferências alimentares
        </p>
        <textarea
          value={me.dietary}
          onChange={(e) => updateMe({ dietary: e.target.value })}
          placeholder="Ex: vegetariano, sem lactose, alergia a frutos do mar…"
          rows={3}
          className="field resize-none"
        />
      </div>

      {other?.dietary && (
        <div className="rounded-2xl bg-blush/20 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-mist">
            Restrição {otherName ? `de ${otherName}` : isHost ? 'do convidado' : 'do anfitrião'}
          </p>
          <p className="mt-1 text-sm italic text-ink">“{other.dietary}”</p>
        </div>
      )}

      {bestCloseness && (
        <div className="card bg-rose/10">
          <p className="text-sm font-semibold text-wine">
            {CLOSENESS_LABEL[bestCloseness]} {allMatches.length} gosto(s) em
            comum
          </p>
        </div>
      )}
    </div>
  );
}
