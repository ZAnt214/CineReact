import { ArrowRight, Sparkles, X } from 'lucide-react';
import { motion } from 'motion/react';

interface CreatorPartnerBannerProps {
  onClick: () => void;
  onClose: () => void;
}

export default function CreatorPartnerBanner({ onClick, onClose }: CreatorPartnerBannerProps) {
  return (
    <motion.aside
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="fixed right-3 left-3 z-[100] mx-auto w-auto max-w-4xl overflow-hidden rounded-2xl border border-amber-400/25 bg-[#0b0b0d] shadow-[0_18px_55px_rgba(0,0,0,0.65)]"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      aria-label="Programa de Criadores Parceiros"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" aria-hidden="true" />

      <div className="flex items-center gap-2.5 p-2.5 sm:gap-4 sm:p-3">
        <button
          type="button"
          onClick={onClick}
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-white/[0.03]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 sm:h-11 sm:w-11">
            <Sparkles className="h-5 w-5 text-amber-400" aria-hidden="true" />
          </span>

          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-[11px] font-black uppercase tracking-[0.12em] text-amber-400 sm:text-sm">
                <span className="sm:hidden">Para criadores</span>
                <span className="hidden sm:inline">Programa de Criadores</span>
              </span>
              <span className="hidden rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 sm:inline">
                Parceria
              </span>
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-zinc-400 sm:text-xs">
              <span className="sm:hidden">Seu canal, mais alcance.</span>
              <span className="hidden sm:inline">Mais descoberta para seus reacts, com seu canal no centro.</span>
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onClick}
          className="group flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-400 px-3.5 text-xs font-black text-black transition-colors hover:bg-yellow-300 sm:px-5"
        >
          <span className="hidden sm:inline">Conhecer programa</span>
          <span className="sm:hidden">Conhecer</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-white"
          title="Fechar"
          aria-label="Fechar programa de criadores"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </motion.aside>
  );
}
