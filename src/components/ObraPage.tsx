import React, { useState } from 'react';
import { Play, Eye, Clock, ArrowLeft } from 'lucide-react';
import { Obra, ReactVideo } from '../types.ts';
import { motion } from 'motion/react';
import OptimizedImage from './OptimizedImage.tsx';

interface ObraPageProps {
  obra: Obra;
  reacts: ReactVideo[];
  onPlayVideo: (reactId: string, obraId: string) => void;
  onBack: () => void;
}

export default function ObraPage({ obra, reacts, onPlayVideo, onBack }: ObraPageProps) {
  const [filter, setFilter] = useState<'relevantes' | 'recentes' | 'antigos'>('relevantes');

  const filteredReacts = [...reacts].sort((a, b) => {
    if (filter === 'relevantes') {
      return b.visualizacoes - a.visualizacoes;
    } else if (filter === 'recentes') {
      return new Date(b.publicadoEm).getTime() - new Date(a.publicadoEm).getTime();
    } else {
      return new Date(a.publicadoEm).getTime() - new Date(b.publicadoEm).getTime();
    }
  });

  const formatViews = (views: number) => {
    if (views >= 1000000) return (views / 1000000).toFixed(1).replace('.', ',') + 'M';
    if (views >= 1000) return (views / 1000).toFixed(0) + ' mil';
    return views.toString();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="cine-container pt-24 pb-20 min-h-screen w-full"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors font-bold uppercase tracking-wider text-sm"
      >
        <ArrowLeft className="w-5 h-5" /> Voltar
      </button>

      {/* OBRA HEADER */}
      <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden mb-12 shadow-2xl border border-zinc-800">
        <div className="absolute inset-0 bg-zinc-900">
          <OptimizedImage 
            src={obra.banner} 
            alt={obra.titulo} 
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-8 w-full">
          <div className="flex flex-col gap-2">
            <span className="text-cine-accent-light font-black tracking-widest text-xs uppercase bg-cine-accent/10 px-3 py-1 rounded-full w-max border border-cine-accent/20">
              {obra.tipo}
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
              {obra.titulo}
            </h1>
            <p className="text-zinc-400 font-mono text-sm">
              {reacts.length} reacts encontrados
            </p>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-zinc-800 pb-4">
        <button 
          onClick={() => setFilter('relevantes')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${filter === 'relevantes' ? 'bg-cine-accent-light text-black shadow-lg shadow-cine-accent-light/20' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'}`}
        >
          Mais Relevantes
        </button>
        <button 
          onClick={() => setFilter('recentes')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${filter === 'recentes' ? 'bg-cine-accent-light text-black shadow-lg shadow-cine-accent-light/20' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'}`}
        >
          Mais Recentes
        </button>
        <button 
          onClick={() => setFilter('antigos')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${filter === 'antigos' ? 'bg-cine-accent-light text-black shadow-lg shadow-cine-accent-light/20' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'}`}
        >
          Mais Antigos
        </button>
      </div>

      {/* REACTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredReacts.map(react => (
          <motion.div
            key={react.id}
            whileHover={{ scale: 1.03, y: -5 }}
            transition={{ duration: 0.2 }}
            onClick={() => onPlayVideo(react.id, react.obraId)}
            style={{ touchAction: 'pan-y pinch-zoom' }}
            className="bg-zinc-900/30 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border border-zinc-855 hover:border-cine-accent/40 transition-colors cursor-pointer group/card flex flex-col select-none"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
              <OptimizedImage
                src={react.thumbnailUrl}
                alt={react.titulo}
                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-cine-accent/90 flex items-center justify-center shadow-lg shadow-cine-accent/30">
                  <Play className="w-6 h-6 fill-black text-black ml-0.5" />
                </div>
              </div>
              <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-xs text-[10px] font-mono px-1.5 py-0.5 rounded text-white font-semibold flex items-center gap-1 border border-zinc-700/50">
                <Clock className="w-3 h-3 text-cine-accent-light" /> {react.duracao}
              </span>
            </div>
            
            <div className="p-4 flex flex-col flex-1">
              <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover/card:text-cine-accent-light transition-colors mb-2">
                {react.titulo}
              </h3>
              
              <div className="mt-auto pt-3 border-t border-zinc-800/50 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-300 truncate max-w-[150px] flex items-center gap-1">
                    {react.canalNome}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-mono shrink-0">
                    <Eye className="w-3.5 h-3.5 text-zinc-500" /> {formatViews(react.visualizacoes)}
                  </span>
                </div>
                <div className="flex items-center text-[10px] text-zinc-500/40 font-mono tracking-wider">
                  <span>CineReact</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredReacts.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500">
            Nenhum react encontrado para esta obra.
          </div>
        )}
      </div>
    </motion.div>
  );
}
