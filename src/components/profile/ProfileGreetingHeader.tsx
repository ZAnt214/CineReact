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
    <header className="relative">
      <div className="relative overflow-hidden border-b border-neutral-800/50 bg-neutral-950/95 backdrop-blur-xl">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 90% 140% at -5% -20%, rgba(0,212,255,0.16) 0%, transparent 52%), radial-gradient(ellipse 70% 90% at 105% 110%, rgba(0,153,255,0.1) 0%, transparent 48%)',
          }}
        />
        <div
          className="pointer-events-none absolute top-0 left-6 md:left-10 w-px h-full bg-gradient-to-b from-cine-accent/40 via-cine-accent/10 to-transparent"
          aria-hidden
        />
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cine-accent/40 to-transparent" aria-hidden />

        <div className="cine-container relative py-6 md:py-8 pl-8 md:pl-12">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-zinc-500 font-semibold mb-3">
                <span className="w-6 h-px bg-cine-accent/50" aria-hidden />
                {greet}
              </p>
              <h1 className="font-display text-[2.75rem] sm:text-[3.25rem] md:text-[3.75rem] font-extrabold leading-[0.9] tracking-tight">
                <span className="bg-gradient-to-br from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                  {firstName}
                </span>
                <span className="text-cine-accent-light drop-shadow-[0_0_24px_rgba(0,212,255,0.45)]">.</span>
              </h1>
              <p className="text-sm md:text-[15px] text-zinc-500 mt-3.5 max-w-sm leading-relaxed">
                Sua sessão na{' '}
                <span className="text-zinc-400 font-medium">CineReact</span>
                {' '}começa aqui.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-neutral-900/90 border border-neutral-800/90 text-zinc-400 hover:text-white hover:border-neutral-600 hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 mt-1"
              aria-label="Fechar perfil"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default memo(ProfileGreetingHeader);
