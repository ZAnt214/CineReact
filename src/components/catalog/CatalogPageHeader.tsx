import React, { memo } from 'react';
import { Zap, ChevronRight } from 'lucide-react';

interface CatalogPageHeaderProps {
  onOpenClips?: () => void;
}

function CatalogPageHeader({ onOpenClips }: CatalogPageHeaderProps) {
  return (
    <header className="cine-container relative pt-2 pb-2 md:pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500 font-semibold">
            Catálogo
          </p>

          <h1 className="catalog-sign-title mt-1 select-none">
            <span className="block text-[2.1rem] sm:text-[2.65rem] md:text-[3rem] text-white leading-[1.05]">
              Explore os
            </span>
            <span className="catalog-sign-accent block text-[2.35rem] sm:text-[2.9rem] md:text-[3.35rem] leading-[1] -mt-0.5 sm:-mt-1">
              reacts
            </span>
          </h1>

          <p className="text-sm text-zinc-500 mt-2 leading-relaxed max-w-md font-sans">
            Filmes, séries, jogos e canais em um só lugar.
          </p>
        </div>

        {onOpenClips && (
          <button
            type="button"
            onClick={onOpenClips}
            className="catalog-clips-shortcut group flex items-center gap-3 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shrink-0 self-start sm:self-auto cursor-pointer"
            aria-label="Abrir CineClips"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cine-accent/15 border border-cine-accent/25 text-cine-accent-light group-hover:bg-cine-accent/25 transition-colors">
              <Zap className="w-5 h-5" strokeWidth={2.25} />
            </span>
            <span className="flex flex-col items-start text-left min-w-0">
              <span className="text-sm font-bold text-white leading-tight">CineClips</span>
              <span className="text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors">
                Vídeos curtos verticais
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-cine-accent-light group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block" />
          </button>
        )}
      </div>

      <div
        className="mt-4 sm:mt-5 h-px bg-gradient-to-r from-cine-accent/30 via-neutral-800/80 to-transparent"
        aria-hidden
      />
    </header>
  );
}

export default memo(CatalogPageHeader);
