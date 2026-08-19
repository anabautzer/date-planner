'use client';

import { useState } from 'react';
import {
  MessageCircleHeart,
  Link2,
  Copy,
  Check,
  Send,
  Sparkles,
  RefreshCw,
  Loader2,
  BookmarkCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlanner } from '@/lib/PlannerContext';
import { useNowPlaying } from '@/lib/useNowPlaying';
import {
  computeMatches,
  CLOSENESS_LABEL,
  type Matches,
  type Closeness,
} from '@/lib/matching';
import { ACTIVITIES, CUISINES, DRINKS } from '@/lib/mockData';
import type { Movie } from '@/lib/mockData';
import type { PlanData, Person } from '@/lib/types';

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

// Turns ranked matches into display labels, one array per category — used
// both for the on-screen recap and the WhatsApp message, so every match
// shows up in both places, not just the first one per category.
function describeMatches(matches: Matches, movies: Movie[]) {
  return {
    slots: matches.slots.map((s) => `${fmtDate(s.date)} · ${s.from}`),
    places: matches.places.map((m) => m.id),
    restaurants: matches.restaurants.map((m) => m.id),
    bars: matches.bars.map((m) => m.id),
    movies: matches.movies
      .map((m) => movies.find((mv) => mv.id === m.id)?.title)
      .filter((x): x is string => Boolean(x)),
    cuisines: matches.cuisines
      .map((m) => CUISINES.find((c) => c.id === m.id))
      .filter((c): c is (typeof CUISINES)[number] => Boolean(c))
      .map((c) => `${c.emoji} ${c.label}`),
    drinks: matches.drinks
      .map((m) => DRINKS.find((d) => d.id === m.id))
      .filter((d): d is (typeof DRINKS)[number] => Boolean(d))
      .map((d) => `${d.emoji} ${d.label}`),
    activities: matches.activities
      .map((m) => ACTIVITIES.find((a) => a.id === m.id)?.label)
      .filter((x): x is string => Boolean(x)),
  };
}

// Strips the leading "emoji " prefix describeMatches adds to cuisine/drink
// labels — used only for the WhatsApp text, which avoids emoji entirely.
function stripEmoji(labels: string[]): string[] {
  return labels.map((l) => l.replace(/^\S+\s*/, ''));
}

// Best closeness tier found across every ranked category, for a headline banner.
function bestCloseness(matches: Matches): Closeness | null {
  const all = [
    ...matches.places,
    ...matches.restaurants,
    ...matches.bars,
    ...matches.movies,
    ...matches.cuisines,
    ...matches.drinks,
    ...matches.activities,
  ];
  if (all.some((m) => m.closeness === 'perfect')) return 'perfect';
  if (all.some((m) => m.closeness === 'close')) return 'close';
  if (all.length > 0) return 'match';
  return null;
}

export default function SummaryTab() {
  const {
    isHost,
    plan,
    setPlan,
    me,
    updateMe,
    matches,
    planId,
    setPlanId,
  } = usePlanner();
  const { movies } = useNowPlaying();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-wine">
        <MessageCircleHeart size={18} />
        <h2 className="section-title">
          {isHost ? 'Gerar Convite' : 'Resumo & Confirmar'}
        </h2>
      </div>

      {/* Free-text sweet note (both roles) */}
      <div className="card space-y-2">
        <p className="section-title text-base">Um recado fofo</p>
        <textarea
          value={me.note}
          onChange={(e) => updateMe({ note: e.target.value })}
          placeholder={
            isHost
              ? 'Escreva algo especial para o convite…'
              : 'Deixe um recado de resposta…'
          }
          rows={3}
          className="field resize-none"
        />
      </div>

      {isHost ? (
        <HostPanel
          plan={plan}
          setPlan={setPlan}
          planId={planId}
          setPlanId={setPlanId}
          movies={movies}
        />
      ) : (
        <GuestPanel me={me} matches={matches} movies={movies} />
      )}
    </div>
  );
}

// ── HOST: required name, generate/update invite, view guest answers ──
function HostPanel({
  plan,
  setPlan,
  planId,
  setPlanId,
  movies,
}: {
  plan: PlanData;
  setPlan: React.Dispatch<React.SetStateAction<PlanData>>;
  planId: string | null;
  setPlanId: (id: string) => void;
  movies: Movie[];
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const guestLink = planId ? `${origin}/?mode=guest&id=${planId}` : '';
  const resultsLink = planId ? `${origin}/?id=${planId}` : '';

  const submit = async () => {
    const hostName = plan.hostName.trim();
    if (!hostName) {
      setError('Digite seu nome antes de gerar o link.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      if (planId) {
        const res = await fetch(`/api/plan/${planId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host: plan.host }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha ao atualizar');
      } else {
        const res = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hostName,
            guestName: plan.guestName.trim(),
            host: plan.host,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.id) throw new Error(data.error || 'Falha ao gerar link');
        setPlanId(data.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado');
    } finally {
      setBusy(false);
    }
  };

  const refresh = async () => {
    if (!planId) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/plan/${planId}`);
      const data = await res.json();
      if (res.ok && data.plan) {
        setPlan((prev) => ({ ...prev, guest: data.plan.guest }));
        setLastChecked(new Date());
      }
    } finally {
      setRefreshing(false);
    }
  };

  const guestAnswered = !!plan.guest;
  const guestMatches = computeMatches(plan);

  const shareWhatsApp = () => {
    if (!guestLink) return;
    const text = encodeURIComponent(
      `*Te mandei um convite pra gente combinar um encontro!*\nResponde por aqui: ${guestLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <>
      <div className="card space-y-3">
        <p className="section-title text-base">Quase lá ✨</p>
        <div>
          <input
            value={plan.hostName}
            onChange={(e) =>
              setPlan((p) => ({ ...p, hostName: e.target.value }))
            }
            placeholder="Seu nome *"
            disabled={!!planId}
            className="field disabled:opacity-60"
          />
          {error && <p className="mt-1 text-xs text-rose">{error}</p>}
        </div>
        <input
          value={plan.guestName}
          onChange={(e) =>
            setPlan((p) => ({ ...p, guestName: e.target.value }))
          }
          placeholder="Nome de quem você vai convidar"
          disabled={!!planId}
          className="field disabled:opacity-60"
        />
        <button onClick={submit} disabled={busy} className="btn-primary w-full">
          {busy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Link2 size={16} />
          )}
          {planId
            ? 'Atualizar minhas preferências'
            : busy
            ? 'Gerando...'
            : 'Gerar Link do Convite'}
        </button>

        {planId && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <CopyRow label="Link para enviar ao convidado" value={guestLink} />
            <button onClick={shareWhatsApp} className="btn-ghost w-full">
              <Send size={16} /> Enviar pelo WhatsApp
            </button>

            <CopyRow
              label="Seu link de respostas — guarde este"
              value={resultsLink}
            />
            <p className="flex items-start gap-1.5 text-[11px] text-mist">
              <BookmarkCheck size={13} className="mt-0.5 flex-none" />
              Salve esse segundo link — é como você volta aqui depois pra ver
              as respostas. Vale por 30 dias.
            </p>
          </motion.div>
        )}
      </div>

      {planId && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-wine">
              <Sparkles size={16} />
              <p className="font-semibold">
                Respostas {plan.guestName ? `de ${plan.guestName}` : 'do convidado'}
              </p>
            </div>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="flex items-center gap-1 rounded-full bg-sand px-3 py-1.5 text-xs text-wine active:scale-95"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>

          {!guestAnswered && (
            <p className="text-sm text-mist">
              Ainda sem respostas. Volte aqui depois de enviar o link, ou
              clique em Atualizar.
            </p>
          )}

          {guestAnswered && <MatchesRecap matches={guestMatches} movies={movies} />}

          {plan.guest?.dietary && (
            <div className="rounded-2xl bg-blush/20 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-mist">
                Restrição alimentar{' '}
                {plan.guestName ? `de ${plan.guestName}` : 'do convidado'}
              </p>
              <p className="mt-1 text-sm italic text-ink">“{plan.guest.dietary}”</p>
            </div>
          )}

          {plan.guest?.note && (
            <div className="rounded-2xl bg-blush/20 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-mist">
                Recado {plan.guestName ? `de ${plan.guestName}` : 'do convidado'}
              </p>
              <p className="mt-1 text-sm italic text-ink">“{plan.guest.note}”</p>
            </div>
          )}

          {lastChecked && (
            <p className="text-center text-[10px] text-mist">
              Verificado às{' '}
              {lastChecked.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      )}
    </>
  );
}

// ── GUEST: matches recap + confirm ──
function GuestPanel({
  me,
  matches,
  movies,
}: {
  me: Person;
  matches: Matches;
  movies: Movie[];
}) {
  const buildRecap = () => {
    const d = describeMatches(matches, movies);
    const lines: string[] = ['*Nosso encontro está tomando forma!*'];
    if (d.slots.length) lines.push(`*Datas:* ${d.slots.join(' · ')}`);
    if (d.places.length) lines.push(`*Lugares:* ${d.places.join(', ')}`);
    if (d.restaurants.length)
      lines.push(`*Restaurantes:* ${d.restaurants.join(', ')}`);
    if (d.bars.length) lines.push(`*Bares:* ${d.bars.join(', ')}`);
    if (d.movies.length) lines.push(`*Filmes:* ${d.movies.join(', ')}`);
    if (d.cuisines.length)
      lines.push(`*Culinária:* ${stripEmoji(d.cuisines).join(', ')}`);
    if (d.drinks.length)
      lines.push(`*Bebidas:* ${stripEmoji(d.drinks).join(', ')}`);
    if (d.activities.length)
      lines.push(`*Atividades:* ${d.activities.join(', ')}`);
    if (me.dietary) lines.push(`*Restrição alimentar:* ${me.dietary}`);
    if (me.note) lines.push(`\n_${me.note}_`);
    if (!matches.hasAny)
      lines.push('Ainda escolhendo as opções — mas já topei!');
    return lines.join('\n');
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(buildRecap());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <>
      <div className="card space-y-3">
        <div className="flex items-center gap-2 text-wine">
          <Sparkles size={16} />
          <p className="font-semibold">Seus matches</p>
        </div>
        {!matches.hasAny && (
          <p className="text-sm text-mist">
            Você ainda não tem coincidências — volte nas abas e escolha
            algumas opções 💫
          </p>
        )}
        <MatchesRecap matches={matches} movies={movies} />
      </div>

      <button onClick={shareWhatsApp} className="btn-primary w-full">
        <MessageCircleHeart size={18} /> Confirmar Encontro
      </button>
      <p className="text-center text-[11px] text-mist">
        Isso monta uma mensagem pronta pra enviar de volta.
      </p>
    </>
  );
}

function MatchesRecap({ matches, movies }: { matches: Matches; movies: Movie[] }) {
  if (!matches.hasAny) return null;
  const d = describeMatches(matches, movies);
  const best = bestCloseness(matches);

  return (
    <ul className="space-y-2 text-sm text-ink">
      {best && (
        <li className="rounded-2xl bg-rose/15 px-3 py-2 text-center text-sm font-semibold text-wine">
          {CLOSENESS_LABEL[best]}
        </li>
      )}
      {d.slots.length > 0 && (
        <RecapRow
          emoji="📅"
          label={d.slots.length > 1 ? 'Datas ideais' : 'Data ideal'}
          value={d.slots.join(' · ')}
        />
      )}
      {d.places.length > 0 && (
        <RecapRow
          emoji="📍"
          label={d.places.length > 1 ? 'Lugares' : 'Lugar'}
          value={d.places.join(', ')}
        />
      )}
      {d.restaurants.length > 0 && (
        <RecapRow
          emoji="🍽️"
          label={d.restaurants.length > 1 ? 'Restaurantes' : 'Restaurante'}
          value={d.restaurants.join(', ')}
        />
      )}
      {d.bars.length > 0 && (
        <RecapRow
          emoji="🍹"
          label={d.bars.length > 1 ? 'Bares' : 'Bar'}
          value={d.bars.join(', ')}
        />
      )}
      {d.movies.length > 0 && (
        <RecapRow
          emoji="🎬"
          label={d.movies.length > 1 ? 'Filmes' : 'Filme'}
          value={d.movies.join(', ')}
        />
      )}
      {d.cuisines.length > 0 && (
        <RecapRow
          emoji="🍽️"
          label={d.cuisines.length > 1 ? 'Culinárias' : 'Culinária'}
          value={d.cuisines.join(', ')}
        />
      )}
      {d.drinks.length > 0 && (
        <RecapRow
          emoji="🍷"
          label={d.drinks.length > 1 ? 'Bebidas' : 'Bebida'}
          value={d.drinks.join(', ')}
        />
      )}
      {d.activities.length > 0 && (
        <RecapRow
          emoji="🎯"
          label={d.activities.length > 1 ? 'Atividades' : 'Atividade'}
          value={d.activities.join(', ')}
        />
      )}
    </ul>
  );
}

function RecapRow({
  emoji,
  label,
  value,
}: {
  emoji: string;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white/60 px-3 py-2">
      <span className="text-lg">{emoji}</span>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-mist">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </li>
  );
}

function CopyRow({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-mist">
        {label}
      </p>
      <div className="flex items-center gap-2 rounded-2xl border border-sand bg-white/70 px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-xs text-mist">
          {value}
        </span>
        <button
          onClick={copy}
          className="flex-none rounded-full bg-sand p-2 text-wine active:scale-90"
          aria-label="Copiar link"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
