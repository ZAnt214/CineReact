import React from 'react';
import { motion } from 'motion/react';
import { UtensilsCrossed, ArrowRight } from 'lucide-react';

interface LunchTimeBannerProps {
  onClick: () => void;
  videoCount: number;
}

export default function LunchTimeBanner({ onClick, videoCount }: LunchTimeBannerProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      className="group relative w-full overflow-hidden rounded-2xl text-left cursor-pointer bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-500/25 hover:border-amber-500/40 transition-colors shadow-lg"
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500/60" />

      <div className="relative flex items-center gap-4 p-5 sm:p-6">
        <motion.div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/25 group-hover:bg-amber-500/20 transition-colors">
          <UtensilsCrossed className="h-6 w-6 text-amber-400" />
        </motion.div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 mb-0.5">
            Hora do Almoço
          </p>
          <h2 className="text-base sm:text-lg font-extrabold text-white">
            Sorteie um react para o seu almoço
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
            {videoCount > 0
              ? 'O CineReact escolhe um vídeo aleatório do catálogo para você assistir.'
              : 'Em breve por aqui.'}
          </p>
        </div>

        <ArrowRight className="h-5 w-5 text-amber-400 shrink-0 group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.button>
  );
}
