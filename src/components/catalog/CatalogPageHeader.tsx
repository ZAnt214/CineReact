import React, { memo } from 'react';

function CatalogPageHeader() {
  return (
    <header className="cine-container relative pt-2 pb-2 md:pb-4">
      <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500 font-semibold">
        Catálogo
      </p>
      <h1 className="font-display text-[1.5rem] sm:text-[1.75rem] md:text-[2rem] font-bold leading-snug tracking-tight text-white mt-1">
        Explore os{' '}
        <span className="text-cine-accent-light">reacts</span>
      </h1>
      <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed max-w-lg">
        Filmes, séries, jogos e canais em um só lugar.
      </p>
      <div className="mt-4 h-px bg-gradient-to-r from-cine-accent/25 via-neutral-800/80 to-transparent" aria-hidden />
    </header>
  );
}

export default memo(CatalogPageHeader);
