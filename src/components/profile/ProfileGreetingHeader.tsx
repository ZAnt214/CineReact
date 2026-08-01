import React, { memo } from 'react';
import { X } from 'lucide-react';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export interface ProfileGreetingHeaderProps {
  firstName: string;
  onClose: () => void;
}

function ProfileGreetingHeader({ firstName, onClose }: ProfileGreetingHeaderProps) {
  const greet = greeting();

  return (
    <header className="cine-container relative pt-5 pb-4 md:pt-6 md:pb-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500 font-semibold">
            {greet}
          </p>
          <h1 className="font-display text-[1.5rem] sm:text-[1.75rem] md:text-[2rem] font-bold leading-snug tracking-tight text-white mt-1">
            Olá,{' '}
            <span className="text-cine-accent-light">{firstName}</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
            Sua sessão na CineReact
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 -mr-2 -mt-1 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
          aria-label="Fechar perfil"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-4 h-px bg-gradient-to-r from-cine-accent/25 via-neutral-800/80 to-transparent" aria-hidden />
    </header>
  );
}

export default memo(ProfileGreetingHeader);
