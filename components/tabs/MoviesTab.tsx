'use client';

import Image from 'next/image';
import { Clapperboard, Star, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlanner } from '@/lib/PlannerContext';
import { useNowPlaying } from '@/lib/useNowPlaying';
import { toggleRank, rankOf, MAX_RANK } from '@/lib/ranking';
import { CLOSENESS_LABEL_SHORT } from '@/lib/matching';
import RankTapButton from '@/components/RankTapButton';

export default function MoviesTab() {
  const { isHost, me, matches, updateMe } = usePlanner();
  const { movies, source } = useNowPlaying();

  const perfectMap = new Map(matches.movies.map((m) => [m.id, m.closeness]));
  const atCap = me.movies.length >= MAX_RANK;

  const toggle = (id: number) => {
    updateMe({ movies: toggleRank(me.movies, id) });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-wine">
        <Clapperboard size={18} />
        <h2 className="section-title">Cinema — em cartaz</h2>
      </div>
      <p className="text-sm text-mist">
        {isHost
          ? 'Toque em ordem nos até 3 filmes que você mais quer ver — o primeiro toque é sua 1ª escolha.'
          : 'Toque em ordem nos seus 3 favoritos. Se baterem com os do anfitrião, é match — quanto mais perto a posição, melhor.'}
      </p>

      <div className="grid grid-cols-1 gap-4">
        {movies.map((m) => {
          const rank = rankOf(me.movies, m.id);
          const closeness = perfectMap.get(m.id);
          return (
            <motion.div
              key={m.id}
              whileTap={{ scale: 0.98 }}
              className={`card flex gap-4 ${closeness ? 'ring-2 ring-rose' : ''}`}
            >
              <div className="relative flex h-24 w-20 flex-none items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sand to-blush/50 text-4xl">
                {m.posterUrl ? (
                  <Image
                    src={m.posterUrl}
                    alt={m.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  m.poster
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight text-ink">
                    {m.title}
                  </h3>
                  <span className="flex items-center gap-1 text-xs text-wine">
                    <Star size={12} className="fill-wine" /> {m.rating}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-mist">
                  {m.overview}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-sand px-2 py-0.5 text-[10px] text-ink"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <RankTapButton
                    rank={rank}
                    atCap={atCap && !rank}
                    onTap={() => toggle(m.id)}
                  />
                  {closeness && (
                    <span className="whitespace-nowrap rounded-full bg-rose px-3 py-1 text-[10px] font-bold text-white">
                      {CLOSENESS_LABEL_SHORT[closeness]}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[11px] text-mist">
        {source === 'loading' && (
          <>
            <Loader2 size={12} className="animate-spin" /> Buscando filmes em
            cartaz…
          </>
        )}
        {source === 'live' && 'Em cartaz agora, via TMDB.'}
        {source === 'fallback' &&
          'Catálogo de exemplo — configure TMDB_API_TOKEN em .env.local para filmes reais.'}
      </p>
    </div>
  );
}
