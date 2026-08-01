import React, { memo, useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Obra, ReactVideo } from '../../types.ts';

interface PlaybackVideoTitleProps {
  obra?: Obra;
  react: ReactVideo;
}

const LONG_TITLE_THRESHOLD = 56;

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

function PlaybackVideoTitle({ obra, react }: PlaybackVideoTitleProps) {
  const [expanded, setExpanded] = useState(false);
  const tipoLabel = obra ? obraTipoLabel(obra.tipo) : null;
  const isLong = react.titulo.length > LONG_TITLE_THRESHOLD;

  useEffect(() => {
    setExpanded(false);
  }, [react.id]);

  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500 font-semibold">
        Reprodução{tipoLabel ? ` · ${tipoLabel}` : ''}
      </p>

      <div>
        <h1
          className={`font-display text-lg sm:text-xl md:text-[1.35rem] font-bold leading-snug tracking-tight text-white ${
            !expanded && isLong ? 'line-clamp-2' : ''
          }`}
        >
          {react.titulo}
        </h1>

        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1.5 text-[11px] text-cine-accent-light hover:text-cine-cream font-medium inline-flex items-center gap-0.5 transition-colors"
          >
            {expanded ? (
              <>
                Ver menos
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Ver título completo
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {obra && obra.tipo !== 'canal' && obra.titulo && (
        <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{obra.titulo}</p>
      )}
    </div>
  );
}

export default memo(PlaybackVideoTitle);
