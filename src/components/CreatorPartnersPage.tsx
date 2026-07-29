import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import CreatorPartnersContent from './CreatorPartnersContent.tsx';

interface CreatorPartnersPageProps {
  onBack: () => void;
}

export default function CreatorPartnersPage({ onBack }: CreatorPartnersPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full flex-1 min-h-screen bg-neutral-950 text-zinc-300"
    >
      <motion.div className="cine-container pt-24 pb-16">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cine-accent/10 border border-cine-accent/25 text-cine-accent-light text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Programa de Parceiros
        </div>

        <CreatorPartnersContent onClose={onBack} showCloseActions={false} />
      </motion.div>
    </motion.div>
  );
}
