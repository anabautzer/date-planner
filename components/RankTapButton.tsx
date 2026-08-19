'use client';

import { Plus } from 'lucide-react';
import RankBadge from './RankBadge';

export default function RankTapButton({
  rank,
  atCap,
  onTap,
  label = 'Adicionar ao top 3',
}: {
  rank: number | null;
  atCap: boolean;
  onTap: () => void;
  label?: string;
}) {
  if (rank) {
    return (
      <button onClick={onTap} className="active:scale-90" aria-label="Remover do top 3">
        <RankBadge rank={rank} />
      </button>
    );
  }
  return (
    <button
      onClick={onTap}
      disabled={atCap}
      className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 border-dashed transition ${
        atCap
          ? 'border-sand text-mist/40'
          : 'border-rose text-rose active:scale-90'
      }`}
      aria-label={label}
    >
      <Plus size={14} />
    </button>
  );
}
