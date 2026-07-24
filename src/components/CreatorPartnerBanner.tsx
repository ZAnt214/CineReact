import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Youtube, X } from 'lucide-react';

interface CreatorPartnerBannerProps {
  onClick: () => void;
  onClose: () => void;
}

export default function CreatorPartnerBanner({ onClick, onClose }: CreatorPartnerBannerProps) {
  return (
    <AnimatePresence>
      <motion.aside
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed right-3 left-3 z-[100] mx-auto w-auto max-w-4xl overflow-hidden rounded-2xl border border-amber-400/25 bg-zinc-950/95 backdrop-blur-xl shadow-[0_18px_55px_rgba(0,0,0,0.65)]"
        style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        aria-label="Programa de Criadores Parceiros"
      >
        <motion.div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"
          aria-hidden="true"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="flex items-center gap-2.5 p-2.5 sm:gap-4 sm:p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <button
            type="button"
            onClick={onClick}
            className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-white/[0.03] cursor-pointer"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 sm:h-11 sm:w-11 group-hover:border-amber-400/30 group-hover:bg-amber-400/10 transition-colors">
              <Youtube className="h-5 w-5 text-red-400 group-hover:text-amber-400 transition-colors" aria-hidden="true" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-xs font-black uppercase tracking-[0.12em] text-amber-400 sm:text-sm">
                  <span className="sm:hidden">Para Criadores</span>
                  <span className="hidden sm:inline">Programa de Criadores Parceiros</span>
                </span>
              </span>
              <p className="mt-0.5 truncate text-xs text-zinc-400">
                Destaque, selo verificado e ferramentas exclusivas para o seu canal.
              </p>
            </span>

            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-md shadow-amber-500/20 group-hover:scale-105 shrink-0">
              <span>Saiba Mais</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClick}
              className="sm:hidden px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Ver
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-zinc-800 cursor-pointer shrink-0"
              title="Fechar aviso"
              aria-label="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.aside>
    </AnimatePresence>
  );
}
