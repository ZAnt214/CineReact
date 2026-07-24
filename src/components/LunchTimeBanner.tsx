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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group relative w-full overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-zinc-950 to-zinc-950 p-5 sm:p-6 text-left cursor-pointer shadow-[0_20px_60px_rgba(245,158,11,0.1)] transition-all hover:border-amber-400/50"
    >
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
      <motion.div className="absolute -bottom-12 -left-10 h-44 w-44 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />

      <motion.div className="relative z-10 flex items-center gap-4 sm:gap-6">
        <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
          <UtensilsCrossed className="h-7 w-7 sm:h-8 sm:w-8 text-black" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 mb-1">
            Categoria Especial
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Hora do Almoço
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 leading-relaxed">
            {videoCount > 0
              ? 'Clique e deixe o CineReact escolher um react aleatório para acompanhar sua refeição.'
              : 'Em breve: sorteio automático de reacts para o seu almoço.'}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2.5 text-black font-black text-sm shadow-lg shadow-amber-500/25 group-hover:brightness-110 transition-all shrink-0">
          <Sparkles className="h-4 w-4" />
          Sortear Agora
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </motion.div>
    </motion.button>
  );
}
