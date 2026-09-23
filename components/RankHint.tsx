import { Plus } from 'lucide-react';

// Places/restaurants/bars only match by rank (see lib/matching.ts), so an
// added-but-unranked item silently never matches. Shown until the user's
// top 3 is complete.
export default function RankHint() {
  return (
    <p className="flex items-center gap-1.5 rounded-2xl bg-blush/20 px-3 py-2 text-xs text-wine">
      <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full border border-dashed border-rose text-rose">
        <Plus size={10} />
      </span>
      Monte seu top 3 tocando no + — sem número, não conta pro match.
    </p>
  );
}
