import React, { useState } from 'react';
import { Play, Clock, ArrowLeft, Shield, Loader2 } from 'lucide-react';
import { Obra, ReactVideo } from '../types.ts';
import { motion } from 'motion/react';
import OptimizedImage from './OptimizedImage.tsx';
import CineReactLogo from './CineReactLogo.tsx';
import { useMinutagemMarkers } from '../hooks/useMinutagem.ts';
import { formatMinutagem, contentTypeLabel, contentTypeBadgeClass } from '../minutagem/utils.ts';

interface ObraPageProps {
  obra: Obra;
  reacts: ReactVideo[];
  onPlayVideo: (reactId: string, obraId: string) => void;
  onBack: () => void;
  onOpenMinutagem?: () => void;
}

export default function ObraPage({ obra, reacts, onPlayVideo, onBack, onOpenMinutagem }: ObraPageProps) {
  const [filter, setFilter] = useState<'relevantes' | 'recentes' | 'antigos'>('relevantes');
  const showMinutagem = ['filme', 'serie', 'anime'].includes(obra.tipo);
  const { markers, loading: markersLoading } = useMinutagemMarkers(showMinutagem ? obra.id : undefined);

  const filteredReacts = [...reacts].sort((a, b) => {
    if (filter === 'relevantes') {
      return b.visualizacoes - a.visualizacoes;
    } else if (filter === 'recentes') {
      return new Date(b.publicadoEm).getTime() - new Date(a.publicadoEm).getTime();
    } else {
      return new Date(a.publicadoEm).getTime() - new Date(b.publicadoEm).getTime();
    }
  });


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
      <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden mb-12 shadow-2xl border border-neutral-800">
        <div className="absolute inset-0 bg-neutral-900">
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

      {showMinutagem && (
        <div className="mb-10 rounded-2xl border border-neutral-800 bg-neutral-950/50 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h2 className="font-bold text-white">Minutagem para streamers</h2>
            </div>
            {onOpenMinutagem && (
              <button
                type="button"
                onClick={onOpenMinutagem}
                className="text-xs font-bold text-cyan-400 hover:underline"
              >
                Abrir ferramenta
              </button>
            )}
          </div>
          {markersLoading ? (
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando avisos...
            </div>
          ) : markers.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Ainda sem minutagem catalogada.{' '}
              {onOpenMinutagem && (
                <button type="button" onClick={onOpenMinutagem} className="text-cyan-400 font-bold hover:underline">
                  Pedir análise ou contribuir
                </button>
              )}
            </p>
          ) : (
            <ul className="space-y-2">
              {markers.slice(0, 5).map((m) => (
                <li key={m.id} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-cyan-300 font-bold shrink-0">
                    {formatMinutagem(m.minutos, m.segundos)}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${contentTypeBadgeClass(m.tipoConteudo)}`}>
                    {contentTypeLabel(m.tipoConteudo)}
                  </span>
                  <span className="text-zinc-300 truncate">{m.label}</span>
                </li>
              ))}
              {markers.length > 5 && onOpenMinutagem && (
                <button type="button" onClick={onOpenMinutagem} className="text-xs text-zinc-500 hover:text-white">
                  + {markers.length - 5} mais...
                </button>
              )}
            </ul>
          )}
        </div>
      )}

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-neutral-800 pb-4">
        <button 
          onClick={() => setFilter('relevantes')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${filter === 'relevantes' ? 'bg-cine-accent-light text-black shadow-lg shadow-cine-accent-light/20' : 'bg-neutral-900 text-zinc-400 hover:bg-neutral-800 hover:text-white border border-neutral-800'}`}
        >
          Mais Relevantes
        </button>
        <button 
          onClick={() => setFilter('recentes')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${filter === 'recentes' ? 'bg-cine-accent-light text-black shadow-lg shadow-cine-accent-light/20' : 'bg-neutral-900 text-zinc-400 hover:bg-neutral-800 hover:text-white border border-neutral-800'}`}
        >
          Mais Recentes
        </button>
        <button 
          onClick={() => setFilter('antigos')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${filter === 'antigos' ? 'bg-cine-accent-light text-black shadow-lg shadow-cine-accent-light/20' : 'bg-neutral-900 text-zinc-400 hover:bg-neutral-800 hover:text-white border border-neutral-800'}`}
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
            className="bg-neutral-900/30 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border border-zinc-855 hover:border-cine-accent/40 transition-colors cursor-pointer group/card flex flex-col select-none"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-neutral-950">
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
              
                <div className="mt-auto pt-3 border-t border-neutral-800/50 space-y-1.5">
                <div className="text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-300 truncate block">
                    {react.canalNome}
                  </span>
                </div>
                <div className="flex items-center opacity-60">
                  <CineReactLogo size="xs" />
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
