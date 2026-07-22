import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CreatorPartnerBannerProps {
  onClick: () => void;
  onClose: () => void;
}

export default function CreatorPartnerBanner({ onClick, onClose }: CreatorPartnerBannerProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 70, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="fixed bottom-0 left-0 right-0 w-full max-w-full overflow-hidden bg-zinc-950/98 backdrop-blur-2xl border-t border-amber-500/40 shadow-2xl z-[100] pointer-events-auto box-border"
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500/80 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 relative z-10 w-full box-border">
          
          {/* Main Info Area - Text Only */}
          <div 
            onClick={onClick}
            className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-center sm:text-left cursor-pointer group min-w-0 flex-1"
          >
            <span className="text-amber-400 font-extrabold text-xs uppercase tracking-wider shrink-0 group-hover:text-amber-300 transition-colors">
              Seja um Criador Oficial
            </span>

            <span className="hidden sm:inline text-zinc-600 font-bold">•</span>

            <p className="text-xs text-zinc-300 font-medium leading-tight">
              É criador de react no YouTube? Ganhe destaque, assinaturas, presentes e perfil verificado.
            </p>
          </div>

          {/* Right Action Button & Close Button - Button Only */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClick}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Conheça os Benefícios
            </button>

            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-zinc-800 cursor-pointer text-xs font-bold shrink-0"
              title="Fechar banner"
              aria-label="Fechar banner"
            >
              ✕
            </button>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
