'use client';

import { useEffect, useState } from 'react';
import { Heart, Cloud, Check, CloudOff, RotateCcw } from 'lucide-react';
import { usePlanner } from '@/lib/PlannerContext';

export default function Header() {
  const {
    isGuest,
    isHost,
    plan,
    other,
    matches,
    planId,
    syncStatus,
    draftRestored,
  } = usePlanner();

  const [showRestored, setShowRestored] = useState(false);
  useEffect(() => {
    if (!draftRestored) return;
    setShowRestored(true);
    const t = setTimeout(() => setShowRestored(false), 5000);
    return () => clearTimeout(t);
  }, [draftRestored]);

  return (
    <header className="px-5 pt-8 pb-4">
      <div className="flex items-center gap-2 text-wine">
        <Heart size={18} className="fill-rose text-rose" />
        <span className="text-sm font-semibold tracking-wide">Date Planner</span>
      </div>

      <h1 className="mt-3 text-2xl font-bold leading-tight text-ink">
        {isGuest ? (
          <>
            {plan.hostName ? `${plan.hostName} ` : 'Alguém especial '}
            te convidou 💌
          </>
        ) : (
          <>Vamos planejar um encontro?</>
        )}
      </h1>

      <p className="mt-1 text-sm text-mist">
        {isGuest
          ? 'Escolha o que combina com você — a gente marca os matches automaticamente.'
          : 'Monte suas preferências e gere um link pra enviar.'}
      </p>

      {isGuest && other?.note && (
        <div className="mt-3 rounded-2xl bg-blush/20 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-mist">
            Recado {plan.hostName ? `de ${plan.hostName}` : ''}
          </p>
          <p className="mt-1 text-sm italic text-ink">“{other.note}”</p>
        </div>
      )}

      {isHost && showRestored && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-wine">
          <RotateCcw size={13} /> Recuperamos seu rascunho — continue de onde
          parou.
        </div>
      )}

      {planId && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-mist">
          {syncStatus === 'saving' && (
            <>
              <Cloud size={13} className="animate-pulse" /> Salvando…
            </>
          )}
          {syncStatus === 'saved' && (
            <>
              <Check size={13} className="text-wine" />
              {isGuest ? 'Respostas salvas' : 'Alterações salvas'}
            </>
          )}
          {syncStatus === 'error' && (
            <>
              <CloudOff size={13} className="text-rose" /> Não deu pra salvar
              agora — suas escolhas continuam aqui na tela
            </>
          )}
        </div>
      )}

      {isGuest && matches.hasAny && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-wine">
            <span>Sintonia até agora</span>
            <span className="font-semibold">{matches.score}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blush to-wine transition-all duration-500"
              style={{ width: `${matches.score}%` }}
            />
          </div>
        </div>
      )}
    </header>
  );
}
