'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Heart } from 'lucide-react';

// A subtle full-screen "Match!" flourish. Mount it near the root and
// flip `show` when a fresh mutual pick happens.
export default function MatchBurst({
  show,
  label = 'Match!',
}: {
  show: boolean;
  label?: string;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.4, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="flex flex-col items-center gap-3 rounded-3xl bg-white/90 px-10 py-8 shadow-soft backdrop-blur"
          >
            <div className="relative">
              <Heart size={56} className="fill-rose text-rose" />
              {/* little sparks */}
              {[...Array(6)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-blush"
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{
                    x: Math.cos((i / 6) * Math.PI * 2) * 46,
                    y: Math.sin((i / 6) * Math.PI * 2) * 46,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              ))}
            </div>
            <span className="text-lg font-bold text-wine">{label}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
