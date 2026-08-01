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
      <div className="cine-container relative pt-4 pb-3 md:pt-5 md:pb-4">
        <div className="relative overflow-hidden rounded-2xl border border-neutral-800/70 bg-neutral-900/45">
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            aria-hidden
            style={{
              background:
                'linear-gradient(105deg, rgba(0,212,255,0.1) 0%, transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)',
            }}
          />
          <div className="pointer-events-none absolute left-0 inset-y-0 w-1 bg-gradient-to-b from-cine-accent via-cine-accent/50 to-transparent" aria-hidden />

          <div className="relative flex items-center gap-3 px-4 py-3.5 md:px-5 md:py-4">
            <div className="hidden sm:flex flex-col justify-center gap-1 shrink-0 pr-1 opacity-50" aria-hidden>
              <span className="w-1 h-1 rounded-full bg-cine-accent-light" />
              <span className="w-1 h-1 rounded-full bg-cine-accent-light/70" />
              <span className="w-1 h-1 rounded-full bg-cine-accent-light/40" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-cine-accent/10 border border-cine-accent/20 text-[9px] font-bold uppercase tracking-[0.22em] text-cine-accent-light">
                  {greet}
                </span>
                <span className="text-[10px] text-zinc-500 hidden sm:inline">sessão CineReact</span>
              </div>

              <h1 className="font-display text-[1.35rem] sm:text-2xl font-bold leading-tight tracking-tight text-white mt-1.5">
                Olá,{' '}
                <span className="bg-gradient-to-r from-white to-cine-accent-light bg-clip-text text-transparent">
                  {firstName}
                </span>
              </h1>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-zinc-500 hover:text-white hover:border-neutral-600 hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
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
