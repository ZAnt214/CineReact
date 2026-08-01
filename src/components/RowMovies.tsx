import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Clock } from 'lucide-react';
import { ReactVideo, Obra } from '../types.ts';
import OptimizedImage from './OptimizedImage.tsx';
import { CATALOG_EAGER_THUMBS, CATALOG_ROW_LIMIT } from '../constants/catalog.ts';

interface RowMoviesProps {
  title: string;
  reacts: ReactVideo[];
  obras: Obra[];
  onPlayVideo: (reactId: string, obraId: string) => void;
  progressMap?: Record<string, number>;
  isEditorial?: boolean;
  limit?: number;
  onTitleClick?: () => void;
  onChannelClick?: (channelNameOrId: string) => void;
}

const TAP_MOVE_THRESHOLD_PX = 10;

interface CatalogVideoCardProps {
  react: ReactVideo;
  index: number;
  isEditorial?: boolean;
  progress?: number;
  onPlay: (reactId: string, obraId: string) => void;
  onChannelClick?: (channelNameOrId: string) => void;
  suppressClickRef: React.MutableRefObject<boolean>;
}

const CatalogVideoCard = memo(function CatalogVideoCard({
  react,
  index,
  isEditorial,
  progress,
  onPlay,
  onChannelClick,
  suppressClickRef,
}: CatalogVideoCardProps) {
  const cardClass = isEditorial
    ? 'cine-recomenda-card catalog-card w-[220px] sm:w-[280px] md:w-[300px] lg:w-[320px] xl:w-[340px] 2xl:w-[360px] shrink-0 rounded-2xl overflow-hidden cursor-pointer group/card flex flex-col h-full md:select-none'
    : 'catalog-card-standard catalog-card w-[220px] sm:w-[280px] md:w-[300px] lg:w-[320px] xl:w-[340px] 2xl:w-[360px] shrink-0 rounded-2xl overflow-hidden cursor-pointer group/card flex flex-col h-full md:select-none';

  return (
    <div
      data-carousel-card=""
      data-react-id={react.id}
      data-obra-id={react.obraId}
      onClick={() => {
        if (suppressClickRef.current) return;
        onPlay(react.id, react.obraId);
      }}
      className={cardClass}
    >
      <div className={`relative aspect-video w-full overflow-hidden shrink-0 catalog-card-thumb ${isEditorial ? 'cine-recomenda-thumb' : 'catalog-card-standard-thumb'}`}>
        <OptimizedImage
          src={react.thumbnailUrl}
          alt={react.titulo}
          loading={index < CATALOG_EAGER_THUMBS ? 'eager' : 'lazy'}
          fetchPriority={index < 2 ? 'high' : 'auto'}
          lite
          className="md:group-hover/card:scale-[1.03] md:transition-transform md:duration-300"
        />

        <div className="absolute inset-0 bg-black/40 opacity-0 md:group-hover/card:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-2xl ${
            isEditorial ? 'cine-recomenda-play-btn text-white' : 'bg-cine-accent text-white'
          }`}>
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5 text-white" />
          </div>
        </div>

        <span className={`absolute bottom-2.5 right-2.5 z-20 h-6.5 px-2.5 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-bold rounded-lg leading-none ${
          isEditorial ? 'cine-recomenda-duration' : 'catalog-card-duration shadow-md'
        }`}>
          <Clock className={`w-3 h-3 shrink-0 ${isEditorial ? 'text-cyan-200' : 'text-cine-accent-light'}`} />
          <span>{react.duracao}</span>
        </span>

        {isEditorial && (
          <span className="cine-recomenda-tag">
            <span className="cine-recomenda-tag-label">Recomendado</span>
          </span>
        )}

        {progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-[4px] catalog-card-progress-track">
            <div
              className={`h-full rounded-r-xs ${isEditorial ? 'cine-recomenda-progress' : 'bg-cine-accent-light'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <div className={`p-3.5 sm:p-4 md:p-5 flex-1 flex flex-col justify-between gap-3 ${isEditorial ? 'cine-recomenda-body' : 'catalog-card-standard-body'}`}>
        <h3 className={`text-sm sm:text-base md:text-lg font-bold line-clamp-2 leading-snug min-h-[2.5rem] sm:min-h-[2.75rem] ${
          isEditorial ? 'cine-recomenda-title text-zinc-100' : 'text-white md:group-hover/card:text-cine-accent-light transition-colors'
        }`}>
          {react.titulo}
        </h3>

        <div className={`flex items-center pt-2.5 min-w-0 ${isEditorial ? 'cine-recomenda-footer' : 'border-t border-cine-border/25'}`}>
          <span
            data-channel-name={react.canalNome}
            onClick={(e) => {
              if (suppressClickRef.current || !onChannelClick) return;
              e.stopPropagation();
              onChannelClick(react.canalNome);
            }}
            className={`truncate min-w-0 flex-1 text-xs sm:text-sm leading-tight ${
              isEditorial
                ? `cine-recomenda-creator ${onChannelClick ? 'hover:underline cursor-pointer' : ''}`
                : `font-semibold text-zinc-400 font-sans ${onChannelClick ? 'hover:underline hover:text-zinc-200 cursor-pointer' : ''}`
            }`}
            title={`Ver canal ${react.canalNome}`}
          >
            {react.canalNome}
          </span>
        </div>
      </div>
    </div>
  );
});

function RowMovies({
  title,
  reacts,
  obras,
  onPlayVideo,
  progressMap,
  isEditorial,
  limit = CATALOG_ROW_LIMIT,
  onTitleClick,
  onChannelClick,
}: RowMoviesProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef({ x: 0, y: 0, moved: false });
  const suppressClickRef = useRef(false);

  const visibleReacts = useMemo(() => reacts.slice(0, limit), [reacts, limit]);

  const handlePlay = useCallback((reactId: string, obraId: string) => {
    onPlayVideo(reactId, obraId);
  }, [onPlayVideo]);

  useEffect(() => {
    const el = rowRef.current;
    if (!el || typeof window === 'undefined') return;

    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    if (!isCoarse) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      touchRef.current = { x: t.clientX, y: t.clientY, moved: false };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1 || touchRef.current.moved) return;
      const t = e.touches[0];
      const dx = Math.abs(t.clientX - touchRef.current.x);
      const dy = Math.abs(t.clientY - touchRef.current.y);
      if (dx > TAP_MOVE_THRESHOLD_PX || dy > TAP_MOVE_THRESHOLD_PX) {
        touchRef.current.moved = true;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchRef.current.moved) return;

      const channelEl = (e.target as HTMLElement).closest('[data-channel-name]');
      if (channelEl && onChannelClick) {
        const channelName = channelEl.getAttribute('data-channel-name');
        if (channelName) {
          suppressClickRef.current = true;
          onChannelClick(channelName);
          window.setTimeout(() => { suppressClickRef.current = false; }, 0);
        }
        return;
      }

      const card = (e.target as HTMLElement).closest('[data-carousel-card]');
      if (!card) return;

      const reactId = card.getAttribute('data-react-id');
      const obraId = card.getAttribute('data-obra-id');
      if (!reactId || !obraId) return;

      suppressClickRef.current = true;
      handlePlay(reactId, obraId);
      window.setTimeout(() => { suppressClickRef.current = false; }, 0);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [handlePlay, onChannelClick]);

  const matchingChannel = useMemo(
    () => obras.find((o) =>
      o.tipo === 'canal' && (
        o.titulo.toLowerCase() === title.toLowerCase()
        || o.titulo.toLowerCase().replace('canal ', '') === title.toLowerCase()
        || title.toLowerCase().includes(o.titulo.toLowerCase().replace('canal ', ''))
      )
    ),
    [obras, title]
  );

  const isClickableTitle = Boolean(onTitleClick || (matchingChannel && onChannelClick));

  const handleHeaderTitleClick = () => {
    if (onTitleClick) {
      onTitleClick();
    } else if (matchingChannel && onChannelClick) {
      onChannelClick(matchingChannel.id);
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    const { scrollLeft, clientWidth } = rowRef.current;
    const scrollTo = direction === 'left'
      ? scrollLeft - clientWidth * 0.85
      : scrollLeft + clientWidth * 0.85;
    rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
  };

  if (visibleReacts.length === 0) return null;

  return (
    <section className="catalog-row space-y-3.5 relative w-full min-w-0 group/row" aria-label={title}>
      <div className="flex flex-col gap-1 cine-container mb-1">
        <div className="flex items-center justify-between gap-3">
          <h2
            onClick={isClickableTitle ? handleHeaderTitleClick : undefined}
            className={`text-base sm:text-lg md:text-xl font-extrabold text-white transition-colors uppercase tracking-wider font-sans leading-none flex items-center gap-2 group/rowtitle ${
              isClickableTitle ? 'hover:text-cine-accent-light cursor-pointer' : ''
            }`}
          >
            <span>{title}</span>
            {isClickableTitle && (
              <span className="text-[10px] sm:text-xs font-bold text-cine-accent-light/80 group-hover/rowtitle:text-cine-cream normal-case tracking-normal transition-colors bg-cine-accent/10 border border-cine-accent/30 px-2 py-0.5 rounded-full">
                Ver perfil
              </span>
            )}
          </h2>
          {reacts.length > limit && (
            <span className="text-[10px] text-zinc-600 font-mono shrink-0">
              +{reacts.length - limit}
            </span>
          )}
        </div>
        {isEditorial && (
          <p className="cine-recomenda-desc">
            Escolhidos pela equipe CineReact.
          </p>
        )}
      </div>

      <div className="relative max-w-full min-w-0">
        {visibleReacts.length > 2 && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="catalog-carousel-arrow absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-10 sm:w-12 bg-black/85 hover:bg-black/95 text-white rounded-r-xl flex items-center justify-center opacity-0 pointer-events-none group-hover/row:opacity-100 group-hover/row:pointer-events-auto transition-opacity border-r border-y border-zinc-700/60 shadow-2xl cursor-pointer"
            aria-label={`Anterior — ${title}`}
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}

        <div
          ref={rowRef}
          className="catalog-carousel flex items-stretch gap-3.5 sm:gap-4 md:gap-5 xl:gap-6 overflow-x-auto py-2.5 cine-container scrollbar-thin scrollbar-thumb-zinc-700/60 scrollbar-track-transparent min-w-0 max-w-full"
        >
          {visibleReacts.map((react, index) => (
            <CatalogVideoCard
              key={react.id}
              react={react}
              index={index}
              isEditorial={isEditorial}
              progress={progressMap?.[react.id]}
              onPlay={handlePlay}
              onChannelClick={onChannelClick}
              suppressClickRef={suppressClickRef}
            />
          ))}
          <div className="shrink-0 w-2 sm:w-4 lg:w-6" aria-hidden="true" />
        </div>

        {visibleReacts.length > 2 && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="catalog-carousel-arrow absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-10 sm:w-12 bg-black/85 hover:bg-black/95 text-white rounded-l-xl flex items-center justify-center opacity-0 pointer-events-none group-hover/row:opacity-100 group-hover/row:pointer-events-auto transition-opacity border-l border-y border-zinc-700/60 shadow-2xl cursor-pointer"
            aria-label={`Próximo — ${title}`}
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}
      </div>
    </section>
  );
}

export default memo(RowMovies);
