const LABELS: Record<number, string> = { 1: '①', 2: '②', 3: '③' };

export default function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-rose text-sm font-bold text-white"
      aria-label={`${rank}ª preferência`}
    >
      {LABELS[rank] ?? rank}
    </span>
  );
}
