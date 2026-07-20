import React, { useState, useEffect } from 'react';
import { Play, Eye, Clock, ArrowLeft, Search, Sparkles, Heart, Tv, ExternalLink, Compass, Users } from 'lucide-react';
import { Obra, ReactVideo } from '../types.ts';
import { motion } from 'motion/react';

interface ChannelPageProps {
  canal: Obra;
  reacts: ReactVideo[];
  obras: Obra[];
  canaisSeguidos: string[];
  onToggleSeguir: (canalNome: string) => void;
  onPlayVideo: (reactId: string, obraId: string) => void;
  onBack: () => void;
}

export default function ChannelPage({ 
  canal, 
  reacts, 
  obras, 
  canaisSeguidos,
  onToggleSeguir,
  onPlayVideo, 
  onBack 
}: ChannelPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [bannerError, setBannerError] = useState(false);
  const [seguidores, setSeguidores] = useState<{ username: string; email: string; avatar?: string; isDonor?: boolean }[]>([]);
  const [loadingSeguidores, setLoadingSeguidores] = useState(true);

  const canalNome = canal.titulo.replace('Canal ', '');
  const isFollowing = canaisSeguidos.includes(canalNome);

  const fetchSeguidores = async () => {
    try {
      const res = await fetch(`/api/canais/${encodeURIComponent(canalNome)}/seguidores`);
      if (res.ok) {
        const data = await res.json();
        setSeguidores(data);
      }
    } catch (err) {
      console.error("Erro ao carregar seguidores:", err);
    } finally {
      setLoadingSeguidores(false);
    }
  };

  useEffect(() => {
    fetchSeguidores();
  }, [canalNome, canaisSeguidos]);

  const filteredReacts = reacts.filter(react => {
    if (searchTerm && !react.titulo.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  }).sort((a, b) => new Date(b.publicadoEm).getTime() - new Date(a.publicadoEm).getTime());

  const formatViews = (views: number) => {
    if (views >= 1000000) return (views / 1000000).toFixed(1).replace('.', ',') + 'M';
    if (views >= 1000) return (views / 1000).toFixed(0) + ' mil';
    return views.toString();
  };

  // Check if the current banner is the generic unsplash image or broken
  const isGenericBanner = !canal.banner || canal.banner.includes('photo-1611162617474-5b21e879e113') || bannerError;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 pb-20 px-4 md:px-8 max-w-[1600px] mx-auto min-h-screen"
    >
      {/* HEADER CONTROLS */}
      <button 
        onClick={onBack}
        className="group flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-all font-bold uppercase tracking-widest text-xs"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar ao Início
      </button>

      {/* PREMIUM CHANNEL VITRINE HEADER */}
      <div className="relative w-full rounded-3xl overflow-hidden mb-10 border border-zinc-800/40 bg-zinc-900/10 backdrop-blur-md p-6 md:p-10 shadow-xl">
        
        {/* Ambient glow behind profile */}
        <div className="absolute top-0 left-10 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* PROFILE METADATA ROW */}
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-end relative z-10">
          
          {/* Channel Avatar */}
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-2 border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl flex-shrink-0 relative group">
            <img 
              src={canal.poster} 
              alt={canal.titulo} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />
          </div>
          
          {/* Text and Actions */}
          <div className="flex-1 flex flex-col lg:flex-row lg:items-end justify-between gap-6 w-full text-center md:text-left">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  Criador Verificado
                </span>
                {canal.trailerUrl && (
                  <a 
                    href={canal.trailerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-zinc-300 text-xs flex items-center gap-1.5 transition-colors font-semibold bg-zinc-900/40 border border-zinc-800/40 px-2.5 py-0.5 rounded-full"
                  >
                    YouTube <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {/* Followers Pill */}
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 bg-zinc-900/60 border border-zinc-850 px-2.5 py-0.5 rounded-full font-mono">
                  <Users className="w-3 h-3 text-teal-400" />
                  <span>
                    {loadingSeguidores ? '...' : seguidores.length} {seguidores.length === 1 ? 'SEGUIDOR' : 'SEGUIDORES'}
                  </span>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                {canalNome}
              </h1>
              
              <p className="text-zinc-400 text-sm md:text-base max-w-3xl leading-relaxed">
                {canal.sinopse || `Seja muito bem-vindo ao espaço oficial de ${canalNome}. Acompanhe todos os reacts e análises aqui.`}
              </p>

              <p className="text-xs text-zinc-500 max-w-3xl leading-relaxed border-t border-zinc-800/40 pt-3 mt-2">
                <span className="font-semibold text-zinc-400">Nota:</span> O CineReact é uma plataforma de organização e descoberta de conteúdo. Este canal não é oficial nem parceiro, apenas está presente para facilitar o encontro entre criadores e fãs.
              </p>

              {/* Stacked Facepile of Followers */}
              {!loadingSeguidores && seguidores.length > 0 && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4 border-t border-zinc-800/20">
                  <div className="flex -space-x-2 overflow-hidden">
                    {seguidores.slice(0, 5).map((seg, i) => {
                      const initials = seg.username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <div 
                          key={i} 
                          title={seg.username}
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-zinc-950 bg-gradient-to-br from-teal-600 to-teal-900 text-white flex items-center justify-center text-[9px] font-bold font-mono select-none"
                        >
                          {seg.avatar ? (
                            <img src={seg.avatar} alt={seg.username} className="h-full w-full object-cover rounded-full" referrerPolicy="no-referrer" />
                          ) : (
                            initials
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-xs text-zinc-500">
                    Seguido por{' '}
                    <strong className="text-zinc-300 font-semibold">{seguidores[0].username}</strong>
                    {seguidores.length > 1 && (
                      <>
                        {' '}e mais <strong className="text-zinc-300 font-semibold">{seguidores.length - 1}</strong> {seguidores.length - 1 === 1 ? 'usuário' : 'usuários'}
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => onToggleSeguir(canalNome)}
              className={`px-8 py-3.5 rounded-full text-xs font-black transition-all uppercase tracking-widest flex-shrink-0 shadow-lg w-full sm:w-auto ${
                isFollowing 
                  ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800 shadow-black' 
                  : 'bg-white text-black hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] shadow-white/5'
              }`}
            >
              {isFollowing ? 'Seguindo Criador' : 'Seguir Criador'}
            </button>
          </div>
        </div>

      </div>



      {/* VITRINE SECTION TITLE & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 border-b border-zinc-900 pb-6">
        <div className="space-y-1 self-start">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-teal-400" />
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Vitrine do Canal</h2>
          </div>
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Todos os reacts organizados e disponíveis</p>
        </div>

        <div className="relative w-full sm:w-80 md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Pesquisar nos reacts deste canal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900/40 hover:bg-zinc-900/60 focus:bg-zinc-950 border border-zinc-800/80 rounded-full py-2.5 pl-11 pr-5 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* VITRINE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredReacts.map(react => {
          const associatedObra = obras.find(o => o.id === react.obraId);
          return (
            <motion.div
              key={react.id}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => onPlayVideo(react.id, react.obraId)}
              className="bg-zinc-950 border border-zinc-900 hover:border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg transition-all cursor-pointer group flex flex-col h-full"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                <img
                  src={react.thumbnailUrl}
                  alt={react.titulo}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-102"
                  referrerPolicy="no-referrer"
                />
                
                {associatedObra && (
                  <span className="absolute top-3 left-3 bg-teal-600/90 text-white font-black text-[9px] uppercase px-2.5 py-0.5 rounded shadow-lg tracking-wider backdrop-blur-xs">
                    {associatedObra.titulo}
                  </span>
                )}

                {/* Glassmorphic Play Button Cover on Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <div className="w-11 h-11 rounded-full bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/40 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                    <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                  </div>
                </div>

                <span className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-[10px] font-mono px-2 py-0.5 rounded-md text-white font-semibold flex items-center gap-1 border border-white/10 shadow">
                  <Clock className="w-3 h-3 text-teal-400" /> {react.duracao}
                </span>
              </div>
              
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-sm font-bold text-zinc-100 line-clamp-2 leading-relaxed group-hover:text-teal-400 transition-colors mb-4">
                  {react.titulo}
                </h3>
                
                <div className="mt-auto pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-zinc-600" /> {formatViews(react.visualizacoes)}
                  </span>
                  <span>
                    {react.publicadoEm ? react.publicadoEm.split('-').reverse().join('/') : 'Recente'}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredReacts.length === 0 && (
          <div className="col-span-full py-16 text-center text-zinc-500 bg-zinc-900/10 rounded-2xl border border-zinc-900">
            <Tv className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-zinc-400">Nenhum react encontrado</p>
            <p className="text-xs text-zinc-600 mt-1">Tente pesquisar por outro termo ou limpe a busca.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
