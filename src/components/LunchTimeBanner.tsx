import React from 'react';
import { motion } from 'motion/react';
import { UtensilsCrossed, Sparkles, ArrowRight, Zap } from 'lucide-react';

interface LunchTimeBannerProps {
  onClick: () => void;
  videoCount: number;
}

export default function LunchTimeBanner({ onClick, videoCount }: LunchTimeBannerProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className="group relative w-full overflow-hidden rounded-3xl text-left cursor-pointer"
    >
      {/* Animated glow border */}
      <motion.div
        className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 opacity-60"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative rounded-3xl overflow-hidden bg-zinc-950 border border-amber-500/20">
        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent -skew-x-12 pointer-events-none"
          animate={{ x: ['-200%', '200%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
        />

        {/* Background orbs */}
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <motion.div
          className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Top accent */}
        <motion.div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        <div className="relative z-10 flex items-center gap-4 sm:gap-6 p-5 sm:p-7">
          {/* Icon */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative shrink-0"
          >
            <div className="absolute inset-0 rounded-2xl bg-amber-400/40 blur-lg scale-125" />
            <div className="relative flex h-16 w-16 sm:h-[72px] sm:w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 shadow-xl shadow-amber-500/40 ring-2 ring-amber-300/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="h-8 w-8 sm:h-9 sm:w-9 text-black" />
            </div>
          </motion.div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <motion.p
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 mb-1.5"
            >
              <Zap className="w-3 h-3" />
              Categoria Especial
            </motion.p>
            <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 tracking-tight leading-none">
              Hora do Almoço
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed line-clamp-2">
              {videoCount > 0
                ? `${videoCount.toLocaleString('pt-BR')} reacts no catálogo — clique e deixe o CineReact sortear o perfeito para sua refeição.`
                : 'Em breve: sorteio automático de reacts para o seu almoço.'}
            </p>
          </div>

          {/* CTA desktop */}
          <motion.div
            className="hidden sm:flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-5 py-3 text-black font-black text-sm shadow-xl shadow-amber-500/30 group-hover:brightness-110 transition-all shrink-0"
            whileHover={{ x: 2 }}
          >
            <Sparkles className="h-4 w-4" />
            Sortear Agora
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </motion.div>
        </div>

        {/* Mobile CTA strip */}
        <div className="sm:hidden border-t border-amber-500/10 px-5 py-3 flex items-center justify-center gap-2 bg-amber-500/5">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-black text-amber-300 uppercase tracking-wider">Toque para sortear</span>
          <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
        </div>
      </div>
    </motion.button>
  );
}
