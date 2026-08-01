import React, { memo } from 'react';
import type { Obra, ReactVideo } from '../../types.ts';

interface PlaybackPageHeaderProps {
  obra?: Obra;
  react: ReactVideo;
}

function obraTipoLabel(tipo?: Obra['tipo']) {
  switch (tipo) {
    case 'serie':
      return 'Série';
    case 'jogo':
      return 'Jogo';
    case 'anime':
      return 'Anime';
    case 'canal':
      return 'Canal';
    default:
      return 'Filme';
  }
}

function PlaybackPageHeader({ obra, react }: PlaybackPageHeaderProps) {
  const tipoLabel = obra ? obraTipoLabel(obra.tipo) : null;

  return (
    <header className="relative pb-1">
      <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500 font-semibold">
        Reprodução{tipoLabel ? ` · ${tipoLabel}` : ''}
      </p>
      <h1 className="font-display text-[1.35rem] sm:text-[1.6rem] md:text-[1.85rem] font-bold leading-snug tracking-tight text-white mt-1">
        {react.titulo}
      </h1>
      {obra && obra.tipo !== 'canal' && obra.titulo && (
        <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed max-w-2xl">
          {obra.titulo}
        </p>
      )}
      <div
        className="mt-4 h-px bg-gradient-to-r from-cine-accent/25 via-neutral-800/80 to-transparent"
        aria-hidden
      />
    </header>
  );
}

export default memo(PlaybackPageHeader);
