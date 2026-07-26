import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Eye, Clock, Sparkles } from 'lucide-react';
import { ReactVideo, Obra } from '../types.ts';
import OptimizedImage from './OptimizedImage.tsx';

interface RowMoviesProps {
  key?: React.Key;
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

export default function RowMovies({ 
  title, 
  reacts, 
  obras, 
  onPlayVideo, 
  progressMap, 
  isEditorial,
  onTitleClick,
  onChannelClick
}: RowMoviesProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isDraggedRef = useRef(false);
  const [enableDragScroll, setEnableDragScroll] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setEnableDragScroll(mediaQuery.matches);

    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!rowRef.current) return;
    // Don't drag if clicking buttons
    if ((e.target as HTMLElement).closest('button')) return;
    // Touch/pen: rely on native overflow-x scroll (pointer capture blocks swipe)
    if (e.pointerType !== 'mouse') return;

    isMouseDownRef.current = true;
    startXRef.current = e.clientX;
    scrollLeftRef.current = rowRef.current.scrollLeft;
    isDraggedRef.current = false;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || !rowRef.current) return;
    
    const deltaX = e.clientX - startXRef.current;
    if (Math.abs(deltaX) > 6) {
      isDraggedRef.current = true;
    }

    if (isDraggedRef.current) {
      e.preventDefault();
      rowRef.current.scrollLeft = scrollLeftRef.current - deltaX;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch (_) {}
    }
  };

  const handleCardClick = (reactId: string, obraId: string) => {
    if (isDraggedRef.current) {
      isDraggedRef.current = false;
      return;
    }
    onPlayVideo(reactId, obraId);
  };

  // Check if title matches a channel in obras
  const matchingChannel = obras.find(o => 
    o.tipo === 'canal' && (
      o.titulo.toLowerCase() === title.toLowerCase() ||
      o.titulo.toLowerCase().replace('canal ', '') === title.toLowerCase() ||
      title.toLowerCase().includes(o.titulo.toLowerCase().replace('canal ', ''))
    )
  );

  const handleHeaderTitleClick = () => {
    if (onTitleClick) {
      onTitleClick();
    } else if (matchingChannel && onChannelClick) {
      onChannelClick(matchingChannel.id);
    }
  };

  const isClickableTitle = Boolean(onTitleClick || (matchingChannel && onChannelClick));

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.85 
        : scrollLeft + clientWidth * 0.85;
      
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (reacts.length === 0) return null;

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1).replace('.', ',') + 'M views';
    }
    if (views >= 1000) {
      return (views / 1000).toFixed(0) + ' mil views';
    }
    return views + ' views';
  };

  return (
    <div className="catalog-row space-y-3.5 relative w-full min-w-0 group/row">
      {/* ROW TITLE & ACTIONS */}
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
        </div>
        {isEditorial && (
          <p className="text-xs sm:text-sm font-extrabold font-syne leading-snug bg-gradient-to-r from-cine-cream via-cine-cream to-cine-accent bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            Estes reacts foram escolhidos a dedo pela equipe CineReact.
          </p>
        )}
      </div>

      {/* HORIZONTAL CAROUSEL CONTAINER */}
      <div className="relative max-w-full min-w-0">
        {/* LEFT NAV ARROW */}
        {reacts.length > 2 && (
          <button
            onClick={() => handleScroll('left')}
            className="catalog-carousel-arrow absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-10 sm:w-12 bg-black/85 hover:bg-black/95 text-white rounded-r-xl flex items-center justify-center opacity-0 pointer-events-none group-hover/row:opacity-100 group-hover/row:pointer-events-auto transition-opacity border-r border-y border-zinc-700/60 shadow-2xl cursor-pointer"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}

        {/* HORIZONTAL FLEX CAROUSEL */}
        <div
          ref={rowRef}
          {...(enableDragScroll ? {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerCancel: handlePointerUp,
            onDragStart: (e: React.DragEvent) => e.preventDefault(),
          } : {})}
          className="catalog-carousel flex items-stretch gap-3.5 sm:gap-4 md:gap-5 xl:gap-6 overflow-x-auto py-2.5 cine-container scrollbar-thin scrollbar-thumb-zinc-700/60 scrollbar-track-transparent min-w-0 max-w-full select-none md:cursor-grab md:active:cursor-grabbing snap-x snap-mandatory"
        >
          {reacts.map((react) => {
            const associatedObra = obras.find(o => o.id === react.obraId);

            return (
              <div
                key={react.id}
                onClick={() => handleCardClick(react.id, react.obraId)}
                className={`catalog-card snap-start w-[220px] sm:w-[280px] md:w-[300px] lg:w-[320px] xl:w-[340px] 2xl:w-[360px] shrink-0 bg-zinc-900/95 md:bg-zinc-900/60 md:backdrop-blur-md rounded-2xl overflow-hidden shadow-xl md:hover:shadow-2xl md:hover:-translate-y-0.5 md:transition-all cursor-pointer group/card flex flex-col h-full select-none ${
                  isEditorial 
                    ? 'border-2 border-cine-accent/80 shadow-[0_0_20px_rgba(233,168,130,0.18)] ring-1 ring-cine-accent/30' 
                    : 'border border-zinc-800/80 hover:border-cine-accent/60 hover:shadow-cine-accent/10'
                }`}
              >
                {/* THUMBNAIL (Fixed 16:9 Aspect Ratio) */}
                <div className="relative aspect-video w-full overflow-hidden bg-zinc-950 shrink-0">
                  <OptimizedImage
                    src={react.thumbnailUrl}
                    alt={react.titulo}
                    className="w-full h-full object-cover md:group-hover/card:scale-105 md:transition-transform md:duration-300"
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-2xl transform group-hover/card:scale-110 transition-transform ${
                      isEditorial ? 'bg-cine-accent text-black' : 'bg-gradient-to-r from-cine-accent-light to-cine-accent text-black'
                    }`}>
                      <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5 text-black" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  <span className="absolute bottom-2.5 right-2.5 h-6.5 px-2.5 inline-flex items-center gap-1 bg-black/85 backdrop-blur-md text-[10px] sm:text-[11px] font-mono font-bold text-zinc-200 rounded-lg border border-zinc-700/60 shadow-md leading-none">
                    <Clock className="w-3 h-3 text-cine-accent-light shrink-0" />
                    <span>{react.duracao}</span>
                  </span>

                  {/* CineReact Recomenda Editorial Tag */}
                  {isEditorial && (
                    <span className="absolute top-2.5 left-2.5 z-10 h-6.5 px-2.5 inline-flex items-center gap-1 bg-gradient-to-r from-cine-cream via-cine-cream to-cine-accent text-zinc-950 font-bold text-[10px] sm:text-[11px] uppercase rounded-lg shadow-[0_0_12px_rgba(233,168,130,0.45)] border border-cine-cream/90 font-syne tracking-wider leading-none">
                      <Sparkles className="w-3.5 h-3.5 fill-zinc-950 text-zinc-950 shrink-0" />
                      <span>Recomenda</span>
                    </span>
                  )}

                  {/* Progress Bar */}
                  {progressMap && progressMap[react.id] !== undefined && (
                    <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-zinc-950/60">
                      <div 
                        className="h-full bg-cine-accent-light rounded-r-xs shadow-[0_0_10px_rgba(251,191,36,0.9)]" 
                        style={{ width: `${progressMap[react.id]}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* CARD BODY */}
                <div className="p-3.5 sm:p-4 md:p-5 flex-1 flex flex-col justify-between gap-3 bg-gradient-to-b from-zinc-900/50 to-zinc-900/80">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white line-clamp-2 leading-snug group-hover/card:text-cine-accent-light transition-colors min-h-[2.5rem] sm:min-h-[2.75rem]">
                    {react.titulo}
                  </h3>
                  
                  <div className="flex items-center justify-between gap-2.5 pt-2.5 border-t border-zinc-800/60 min-w-0">
                    <span 
                      onClick={(e) => {
                        if (onChannelClick) {
                          e.stopPropagation();
                          onChannelClick(react.canalNome);
                        }
                      }}
                      className={`font-bold text-cine-accent-light font-syne truncate min-w-0 flex-1 text-xs sm:text-sm leading-tight ${
                        onChannelClick ? 'hover:underline hover:text-cine-cream cursor-pointer' : ''
                      }`}
                      title={`Ver canal ${react.canalNome}`}
                    >
                      {react.canalNome}
                    </span>
                    <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/70 text-zinc-300 rounded-full border border-zinc-700/50 text-[11px] font-syne font-medium tracking-wide shadow-xs">
                      <Eye className="w-3.5 h-3.5 text-cine-accent-light shrink-0" />
                      <span>{formatViews(react.visualizacoes)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* ENDING SPACER FOR RIGHT PADDING IN SCROLL CONTAINERS */}
          <div className="shrink-0 w-2 sm:w-4 lg:w-6" aria-hidden="true" />
        </div>

        {/* RIGHT NAV ARROW */}
        {reacts.length > 2 && (
          <button
            onClick={() => handleScroll('right')}
            className="catalog-carousel-arrow absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-10 sm:w-12 bg-black/85 hover:bg-black/95 text-white rounded-l-xl flex items-center justify-center opacity-0 pointer-events-none group-hover/row:opacity-100 group-hover/row:pointer-events-auto transition-opacity border-l border-y border-zinc-700/60 shadow-2xl cursor-pointer"
            aria-label="Próximo"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}
      </div>
    </div>
  );
}

