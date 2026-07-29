import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { ArrowRight, BadgeCheck, Clapperboard, Sparkles, X } from 'lucide-react';

interface CreatorPartnerBannerProps {
  onClick: () => void;
  onClose: () => void;
}

export default function CreatorPartnerBanner({ onClick, onClose }: CreatorPartnerBannerProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.aside
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="creator-partner-banner fixed inset-x-3 z-[120] mx-auto w-[calc(100%-1.5rem)] max-w-4xl overflow-hidden rounded-2xl border border-cine-accent/35 bg-neutral-950 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_40px_rgba(0,212,255,0.12)]"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      aria-label="Programa de Criadores Parceiros"
    >
      <motion.div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cine-accent-light to-transparent"
        aria-hidden="true"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute -top-16 -right-10 w-40 h-40 bg-cine-accent/15 rounded-full blur-3xl pointer-events-none"
        animate={{ opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div className="relative flex items-center gap-2.5 p-2.5 sm:gap-4 sm:p-3.5">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick();
          }}
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-white/[0.04] cursor-pointer"
        >
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cine-accent/35 bg-gradient-to-br from-cine-accent/25 via-cine-accent/10 to-transparent sm:h-12 sm:w-12 group-hover:border-cine-accent-light/50 transition-colors shadow-[0_0_24px_rgba(0,212,255,0.18)]">
            <Clapperboard className="h-5 w-5 text-cine-accent-light transition-colors relative z-10" aria-hidden="true" />
            <BadgeCheck className="absolute -bottom-1 -right-1 h-4 w-4 text-cine-accent bg-neutral-950 rounded-full border border-cine-accent/40" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 flex-wrap">
              <span className="truncate text-xs font-black uppercase tracking-[0.14em] text-cine-accent-light sm:text-sm">
                <span className="sm:hidden">Para Criadores</span>
                <span className="hidden sm:inline">Programa de Criadores Parceiros</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-cine-accent/30 bg-cine-accent/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cine-accent-light">
                <Sparkles className="w-2.5 h-2.5" />
                CineReact
              </span>
            </span>
            <p className="mt-1 truncate text-xs text-zinc-400 sm:text-[13px]">
              Destaque premium, selo verificado e ferramentas exclusivas na plataforma.
            </p>
          </span>

          <span className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cine-accent hover:bg-cine-accent-light text-white font-extrabold text-xs transition-all shadow-lg shadow-cine-accent/25 group-hover:scale-[1.03] shrink-0">
            <span>Saiba Mais</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>

        <motion.div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClick();
            }}
            className="sm:hidden px-3 py-1.5 rounded-xl bg-cine-accent hover:bg-cine-accent-light text-white font-extrabold text-xs transition-all shadow-md shadow-cine-accent/20 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Ver
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-zinc-400 hover:text-white transition-colors border border-neutral-800 cursor-pointer shrink-0"
            title="Fechar aviso"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </motion.div>
    </motion.aside>,
    document.body,
  );
}
