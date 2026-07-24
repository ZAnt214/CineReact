import React from 'react';
import { motion } from 'motion/react';
import { UtensilsCrossed, Sparkles, ArrowRight } from 'lucide-react';

interface LunchTimeBannerProps {
  onClick: () => void;
  videoCount: number;
}

export default function LunchTimeBanner({ onClick, videoCount }: LunchTimeBannerProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.008 }}
      whileTap={{ scale: 0.992 }}
      className="group relative w-full overflow-hidden rounded-2xl text-left cursor-pointer bg-gradient-to-r from-amber-500/10 via-zinc-900/80 to-zinc-900 hover:from-amber-500/15 transition-colors"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.12),transparent_60%)] pointer-events-none" />

      <div className="relative flex items-center gap-4 sm:gap-5 p-5 sm:p-6">
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
          <UtensilsCrossed className="h-6 w-6 sm:h-7 sm:w-7 text-amber-400" />
        </div>

        <motion.div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/70 mb-0.5">
            Categoria Especial
          </p>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Hora do Almoço
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-zinc-500 line-clamp-1">
            {videoCount > 0
              ? 'Deixe o CineReact escolher um react aleatório para sua refeição'
              : 'Sorteio automático em breve'}
          </p>
        </motion.div>

        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs sm:text-sm shrink-0 group-hover:gap-2.5 transition-all">
          <Sparkles className="h-4 w-4 hidden sm:block" />
          <span className="hidden sm:inline">Sortear</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </motion.button>
  );
}
