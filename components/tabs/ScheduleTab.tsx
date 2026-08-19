'use client';

import { useState } from 'react';
import { Plus, X, Check, CalendarDays } from 'lucide-react';
import { usePlanner } from '@/lib/PlannerContext';
import type { TimeSlot } from '@/lib/types';

const uid = () => Math.random().toString(36).slice(2, 9);

function fmtDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

export default function ScheduleTab() {
  const { isHost, me, other, updateMe } = usePlanner();
  const [draft, setDraft] = useState({ date: '', from: '19:00', to: '22:00' });
  const [duplicateError, setDuplicateError] = useState(false);

  const addSlot = () => {
    if (!draft.date) return;
    const isDuplicate = me.slots.some(
      (s) => s.date === draft.date && s.from === draft.from && s.to === draft.to
    );
    if (isDuplicate) {
      setDuplicateError(true);
      return;
    }
    setDuplicateError(false);
    const slot: TimeSlot = { id: uid(), ...draft };
    updateMe({ slots: [...me.slots, slot] });
    setDraft({ date: '', from: '19:00', to: '22:00' });
  };

  const removeSlot = (id: string) =>
    updateMe({ slots: me.slots.filter((s) => s.id !== id) });

  // Guest picks from host's slots by mirroring them into their own list.
  const hostSlots = other?.slots ?? [];
  const mine = new Set(me.slots.map((s) => `${s.date}|${s.from}|${s.to}`));
  const toggleHostSlot = (s: TimeSlot) => {
    const key = `${s.date}|${s.from}|${s.to}`;
    if (mine.has(key)) {
      updateMe({
        slots: me.slots.filter(
          (x) => `${x.date}|${x.from}|${x.to}` !== key
        ),
      });
    } else {
      updateMe({ slots: [...me.slots, { ...s, id: uid() }] });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-wine">
        <CalendarDays size={18} />
        <h2 className="section-title">Agenda & Horários</h2>
      </div>

      {/* GUEST: host's available windows to tick */}
      {!isHost && (
        <div className="card space-y-3">
          <p className="text-sm text-mist">
            Horários que {`quem te convidou`} deixou livres — toque nos que
            funcionam pra você:
          </p>
          {hostSlots.length === 0 && (
            <p className="text-sm text-mist">Nenhum horário sugerido ainda.</p>
          )}
          <div className="space-y-2">
            {hostSlots.map((s) => {
              const on = mine.has(`${s.date}|${s.from}|${s.to}`);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleHostSlot(s)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    on
                      ? 'border-rose bg-rose/10'
                      : 'border-sand bg-white/60 hover:border-blush'
                  }`}
                >
                  <span className="text-sm font-medium text-ink">
                    {fmtDate(s.date)} · {s.from}–{s.to}
                  </span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      on ? 'bg-rose text-white' : 'bg-sand text-mist'
                    }`}
                  >
                    {on && <Check size={14} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD form — host adds availability; guest can suggest an alternative */}
      <div className="card space-y-3">
        <p className="section-title text-base">
          {isHost ? 'Quando você está livre?' : 'Sugerir outro horário'}
        </p>
        <input
          type="date"
          value={draft.date}
          onChange={(e) => {
            setDraft({ ...draft, date: e.target.value });
            setDuplicateError(false);
          }}
          className="field"
        />
        <div className="flex gap-3">
          <label className="flex-1 text-xs text-mist">
            De
            <input
              type="time"
              value={draft.from}
              onChange={(e) => {
                setDraft({ ...draft, from: e.target.value });
                setDuplicateError(false);
              }}
              className="field mt-1"
            />
          </label>
          <label className="flex-1 text-xs text-mist">
            Até
            <input
              type="time"
              value={draft.to}
              onChange={(e) => {
                setDraft({ ...draft, to: e.target.value });
                setDuplicateError(false);
              }}
              className="field mt-1"
            />
          </label>
        </div>
        {duplicateError && (
          <p className="text-xs text-rose">
            Esse dia e horário já está na sua lista.
          </p>
        )}
        <button onClick={addSlot} className="btn-primary w-full">
          <Plus size={16} /> Adicionar horário
        </button>
      </div>

      {/* My own list */}
      {me.slots.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-mist">
            {isHost ? 'Seus horários' : 'Seus horários / sugestões'}
          </p>
          {me.slots.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 shadow-card"
            >
              <span className="text-sm text-ink">
                {fmtDate(s.date)} · {s.from}–{s.to}
              </span>
              <button
                onClick={() => removeSlot(s.id)}
                className="text-mist hover:text-wine"
                aria-label="Remover"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
