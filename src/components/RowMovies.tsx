import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Eye, Calendar, Clock, Plus, Sparkles } from 'lucide-react';
import { ReactVideo, Obra } from '../types.ts';
import { motion, useInView } from 'motion/react';

interface RowMoviesProps {
  key?: React.Key;
  title: string;
  reacts: ReactVideo[];
  obras: Obra[];
  onPlayVideo: (reactId: string, obraId: string) => void;
  progressMap?: Record<string, number>;
  isEditorial?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  }
};

export default function RowMovies({ title, reacts, obras, onPlayVideo, progressMap, isEditorial }: RowMoviesProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(20);

  // useInView from motion/react is highly optimized and integrates beautifully
  const hasEntered = useInView(containerRef, {
    once: true,
    margin: "0px 0px 200px 0px"
  });

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 20);
    // Give state a moment to update and render new items, then scroll a bit to reveal them
    setTimeout(() => {
      handleScroll('right');
    }, 100);
  };

  if (reacts.length === 0) return null;

  // Helper to format views
  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1).replace('.', ',') + 'M de views';
    }
    if (views >= 1000) {
      return (views / 1000).toFixed(0) + ' mil views';
    }
    return views + ' views';
  };

  // Helper to format date
  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  if (!hasEntered) {
    return (
      <div ref={containerRef} className="space-y-2 relative px-4 md:px-8 min-h-[300px]">
        {/* ROW TITLE */}
        <h2 className="text-lg md:text-xl font-bold text-zinc-600 inline-flex items-center gap-1.5 uppercase tracking-wider font-sans animate-pulse">
          {title}
        </h2>
        {/* HORIZONTAL CONTAINER SKELETON */}
        <div className="relative">
          <div className="flex items-center gap-4 overflow-x-hidden py-4 px-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-64 md:w-80 bg-zinc-900/10 rounded-lg overflow-hidden border border-zinc-850/40 animate-pulse"
              >
                <div className="h-36 md:h-44 w-full bg-zinc-900/30 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-zinc-800/20" />
                </div>
                <div className="p-3.5 space-y-3">
                  <div className="space-y-2">
                    <div className="h-3.5 bg-zinc-800/40 rounded w-11/12" />
                    <div className="h-3.5 bg-zinc-800/30 rounded w-2/3" />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="h-3 bg-zinc-800/20 rounded w-1/3" />
                    <div className="h-2.5 bg-zinc-800/20 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const visibleReacts = reacts.slice(0, visibleCount);

  return (
    <div ref={containerRef} className="space-y-2 relative group px-4 md:px-8">
      {/* ROW TITLE */}
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="text-lg md:text-xl font-bold text-white hover:text-teal-400 transition-colors cursor-pointer inline-flex items-center gap-1.5 uppercase tracking-wider font-sans">
          {title}
        </h2>
        {isEditorial && (
          <span className="px-2.5 py-1 text-[10px] font-black uppercase bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-full shadow-md tracking-wider flex items-center gap-1.5 animate-pulse select-none">
            <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
            Escolhidos pelos editores do CineReact
          </span>
        )}
      </div>

      {/* HORIZONTAL CONTAINER */}
      <div className="relative">
        
        {/* LEFT NAV ARROW */}
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-[85%] w-10 md:w-12 bg-black/70 hover:bg-black/90 text-white rounded-r flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-r border-zinc-800"
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        {/* FILM ROW */}
        <motion.div
          ref={rowRef}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex items-center gap-4 overflow-x-auto overflow-y-hidden py-4 px-1 scrollbar-thin scroll-smooth"
        >
          {visibleReacts.map((react) => {
            const associatedObra = obras.find(o => o.id === react.obraId);
            return (
              <motion.div
                key={react.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                onClick={() => onPlayVideo(react.id, react.obraId)}
                className={`flex-shrink-0 w-64 md:w-80 bg-zinc-900/30 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg transition-all cursor-pointer group/card ${
                  isEditorial 
                    ? 'border-2 border-rose-500 hover:border-pink-400 shadow-[0_0_15px_rgba(244,63,94,0.15)] hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] ring-1 ring-rose-500/30' 
                    : 'border border-zinc-850 hover:border-teal-500/40 hover:shadow-teal-500/10 shadow-black/50'
                }`}
              >
                {/* THUMBNAIL WITH DURATION BADGE */}
                <div className="relative h-36 md:h-44 w-full overflow-hidden bg-zinc-950">
                  <img
                    src={react.thumbnailUrl}
                    alt={react.titulo}
                    className="w-full h-full object-cover group-hover/card:scale-102 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                      isEditorial 
                        ? 'bg-rose-500/95 shadow-rose-500/40 text-white' 
                        : 'bg-teal-600/90 shadow-teal-600/30 text-white'
                    }`}>
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    </div>
                  </div>
                  {/* Duration Badge */}
                  <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-xs text-[10px] font-mono px-1.5 py-0.5 rounded text-white font-semibold flex items-center gap-1 border border-zinc-700/50">
                    <Clock className="w-3 h-3 text-teal-400" /> {react.duracao}
                  </span>
                  {/* Obra Tag Badge */}
                  {associatedObra && (
                    <span className="absolute top-2 left-2 bg-teal-600 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded shadow tracking-wide">
                      {associatedObra.titulo}
                    </span>
                  )}
                  {/* Recommended Ribbon Badge */}
                  {isEditorial && (
                    <span className="absolute top-2 right-2 bg-gradient-to-r from-rose-500 via-pink-400 to-rose-600 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded shadow-lg tracking-wider flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 fill-white text-white" />
                      Destaque
                    </span>
                  )}
                  {/* Progress Bar */}
                  {progressMap && progressMap[react.id] !== undefined && (
                    <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-zinc-950/60 backdrop-blur-xs">
                      <div 
                        className="h-full bg-teal-500 rounded-r-xs shadow-[0_0_8px_rgba(20,184,166,0.6)] transition-all duration-300" 
                        style={{ width: `${progressMap[react.id]}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* CARD BODY */}
                <div className="p-3.5 space-y-2">
                  <h3 className="text-xs md:text-sm font-bold text-white line-clamp-2 leading-snug group-hover/card:text-teal-400 transition-colors">
                    {react.titulo}
                  </h3>
                  
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    {/* Channel name with red badge */}
                    <span className="font-semibold text-zinc-300 truncate max-w-[150px] flex items-center gap-1">
                      {react.canalNome}
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block animate-pulse" />
                    </span>
                    
                    {/* View Count */}
                    <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 shrink-0">
                      <Eye className="w-3.5 h-3.5" /> {formatViews(react.visualizacoes)}
                    </span>
                  </div>

                  {/* CineReact Branding Footer */}
                  <div className="flex items-center text-[10px] text-zinc-500/40 pt-1 border-t border-zinc-800/50 font-mono tracking-wider">
                    <span>CineReact</span>
                  </div>
                </div>

              </motion.div>
            );
          })}

          {visibleCount < reacts.length && (
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              onClick={handleLoadMore}
              className="flex-shrink-0 w-32 md:w-40 h-36 md:h-44 bg-zinc-900/60 rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer border border-zinc-800/80 hover:border-teal-600/40 hover:bg-zinc-800/80 transition-colors shadow-lg group/more"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 group-hover/more:bg-teal-600 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold text-zinc-400 group-hover/more:text-white transition-colors uppercase tracking-wider text-center px-2">
                Carregar<br/>Mais
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* RIGHT NAV ARROW */}
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-[85%] w-10 md:w-12 bg-black/70 hover:bg-black/90 text-white rounded-l flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-l border-zinc-800"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
        </button>

      </div>
    </div>
  );
}
