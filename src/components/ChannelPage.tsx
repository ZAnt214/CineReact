import React, { useState, useEffect } from 'react';
import { Play, Clock, ArrowLeft, Search, Heart, Tv, ExternalLink, Users, BadgeCheck } from 'lucide-react';
import { Obra, ReactVideo, PublicUserProfile } from '../types.ts';
import { motion } from 'motion/react';
import OptimizedImage from './OptimizedImage.tsx';
import PublicCreatorProfile from './profile/PublicCreatorProfile.tsx';

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
  const [channelReacts, setChannelReacts] = useState<ReactVideo[]>(reacts);
  const [loadingReacts, setLoadingReacts] = useState(reacts.length === 0);
  const [seguidores, setSeguidores] = useState<{ username: string; email: string; avatar?: string; isDonor?: boolean }[]>([]);
  const [loadingSeguidores, setLoadingSeguidores] = useState(true);
  const [officialProfile, setOfficialProfile] = useState<PublicUserProfile | null>(null);
  const [loadingOfficialProfile, setLoadingOfficialProfile] = useState(true);

  const canalNome = canal.titulo.replace(/^Canal\s+/i, '').trim();
  const isFollowing = canaisSeguidos.includes(canalNome);

  useEffect(() => {
    if (reacts.length > 0) {
      setChannelReacts(reacts);
      setLoadingReacts(false);
    }
  }, [reacts]);

  useEffect(() => {
    let cancelled = false;
    if (reacts.length > 0) {
      return () => { cancelled = true; };
    }

    setLoadingReacts(true);

    fetch(`/api/obras/${encodeURIComponent(canal.id)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled && Array.isArray(data?.reacts)) {
          setChannelReacts(data.reacts);
        }
      })
      .catch(err => console.error('Erro ao carregar vídeos do canal:', err))
      .finally(() => {
        if (!cancelled) setLoadingReacts(false);
      });

    return () => { cancelled = true; };
  }, [canal.id, reacts.length]);

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

  useEffect(() => {
    let cancelled = false;
    setLoadingOfficialProfile(true);
    fetch(`/api/canais/${encodeURIComponent(canal.id)}/perfil-oficial`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setOfficialProfile(data?.profile ?? null);
      })
      .catch((err) => console.error('Erro ao carregar perfil oficial do criador:', err))
      .finally(() => {
        if (!cancelled) setLoadingOfficialProfile(false);
      });
    return () => { cancelled = true; };
  }, [canal.id]);

  const filteredReacts = channelReacts
    .filter(react => {
      if (searchTerm && !react.titulo.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.publicadoEm).getTime() - new Date(a.publicadoEm).getTime());

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="cine-container pt-24 pb-20 min-h-screen w-full"
    >
      {/* HEADER NAVIGATION CONTROLS */}
      <button 
        onClick={onBack}
        className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/80 hover:bg-cine-accent/20 text-zinc-300 hover:text-cine-accent-light border border-neutral-800 hover:border-cine-accent/40 text-xs font-black uppercase tracking-wider transition-all duration-200 mb-8 cursor-pointer shadow-lg backdrop-blur-md"
      >
        <ArrowLeft className="w-4 h-4 text-cine-accent-light group-hover:-translate-x-1 transition-transform" />
        <span>Voltar ao Início</span>
      </button>
      {/* CHANNEL HERO BANNER */}
      <div className="relative w-full rounded-3xl overflow-hidden mb-10 border border-neutral-800/80 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6 sm:p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        
        {/* Ambient lighting */}
        <div className="absolute -top-12 -left-12 w-80 h-80 bg-cine-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-96 h-96 bg-cine-accent/5 rounded-full blur-3xl pointer-events-none" />

        {/* PROFILE MAIN ROW */}
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-center relative z-10">
          
          {/* Avatar with Ring */}
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 rounded-full border-2 border-cine-accent/40 group-hover:border-cine-accent/70 transition duration-500" />
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-neutral-950 bg-neutral-900 overflow-hidden shadow-2xl">
              <OptimizedImage 
                src={canal.poster} 
                alt={canal.titulo} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
          
          {/* Text Info */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              {canal.trailerUrl && (
                <div className="flex items-center justify-center md:justify-start mb-3">
                  <a 
                    href={canal.trailerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-zinc-300 hover:text-white border border-zinc-700/80 text-xs font-bold transition-all shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cine-accent-light" />
                    <span>YouTube Oficial</span>
                  </a>
                </div>
              )}

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                {canalNome}
              </h1>
              
              <p className="text-zinc-300 text-sm md:text-base leading-relaxed max-w-3xl mt-2 font-medium">
                {officialProfile?.descricao || canal.sinopse || `Seja muito bem-vindo ao espaço de ${canalNome}. Acompanhe todos os reacts e vídeos aqui.`}
              </p>

              {!loadingOfficialProfile && officialProfile && (
                <div className="mt-6 max-w-2xl">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400/70 mb-2 flex items-center gap-1.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-cyan-300" />
                    Perfil oficial na CineReact
                  </p>
                  <PublicCreatorProfile profile={officialProfile} size="sm" align="start" />
                </div>
              )}

              {!loadingOfficialProfile && !officialProfile && (
                <p className="mt-4 text-xs text-zinc-500 max-w-2xl leading-relaxed">
                  Canal não verificado na CineReact.{' '}
                  <a
                    href={`mailto:atendimentocinereact@gmail.com?subject=${encodeURIComponent(`[CineReact] Verificação - ${canalNome}`)}`}
                    className="text-cine-accent-light/90 hover:text-cine-cream underline underline-offset-2"
                  >
                    Solicitar verificação
                  </a>
                </p>
              )}
            </div>

            {/* ACTION BUTTON & FOLLOWERS FACEPILE */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <button 
                onClick={() => onToggleSeguir(canalNome)}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
                  isFollowing 
                    ? 'bg-neutral-900 hover:bg-red-500/20 text-zinc-200 hover:text-red-400 border border-zinc-700 hover:border-red-500/50' 
                    : 'bg-cine-accent text-white hover:bg-cine-accent-dark hover:scale-105 active:scale-95 shadow-cine-accent/20'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFollowing ? 'fill-red-500 text-red-500' : 'fill-black text-black'}`} />
                <span>{isFollowing ? 'Seguindo Criador' : 'Acompanhar Criador'}</span>
              </button>

              {/* Followers Facepile */}
              {!loadingSeguidores && seguidores.length > 0 && (
                <div className="flex items-center gap-2.5 bg-neutral-900/60 border border-neutral-800/80 px-3.5 py-2 rounded-2xl backdrop-blur-md">
                  <div className="flex -space-x-2 overflow-hidden">
                    {seguidores.slice(0, 4).map((seg, i) => {
                      const initials = seg.username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <div 
                          key={i} 
                          title={seg.username}
                          className="inline-block h-7 w-7 rounded-full ring-2 ring-neutral-950 bg-cine-accent text-white flex items-center justify-center text-[10px] font-black font-mono select-none"
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
                  <span className="text-xs text-zinc-400 font-medium">
                    Junto com <strong className="text-cine-cream font-bold">{seguidores[0].username}</strong>
                    {seguidores.length > 1 && ` e +${seguidores.length - 1}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* SINGLE CLEAN CATEGORY SECTION HEADER & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-neutral-950/80 border border-neutral-800/80 p-5 rounded-3xl backdrop-blur-xl shadow-xl">
        
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cine-accent/10 border border-cine-accent/20 text-cine-accent-light shadow-md">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Todos os Reacts
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cine-accent/10 border border-cine-accent/20 text-cine-accent-light font-mono text-xs font-black">
                {filteredReacts.length}
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Catálogo de vídeos do canal
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Pesquisar nos vídeos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 focus:border-cine-accent-light rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none transition-all shadow-inner"
          />
        </div>

      </div>

      {/* VITRINE CARDS GRID */}
      {loadingReacts ? (
        <motion.div className="py-16 text-center text-zinc-500 text-sm">
          Carregando vídeos do canal...
        </motion.div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 xl:gap-6">
        {filteredReacts.map((react, idx) => {
          const associatedObra = obras.find(o => o.id === react.obraId);
          return (
            <motion.div
              key={react.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.2) }}
              whileHover={{ y: -6 }}
              onClick={() => onPlayVideo(react.id, react.obraId)}
              className="bg-neutral-950 border border-neutral-800/80 hover:border-cine-accent/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group flex flex-col h-full relative"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
                <OptimizedImage
                  src={react.thumbnailUrl}
                  alt={react.titulo}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <div className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                    <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                  </div>
                </div>

                {/* Duration Badge */}
                <span className="absolute bottom-2.5 right-2.5 h-6.5 px-2.5 inline-flex items-center gap-1 bg-black/85 backdrop-blur-md text-[10px] sm:text-[11px] font-mono font-bold text-zinc-200 rounded-lg border border-zinc-700/60 shadow-md leading-none">
                  <Clock className="w-3 h-3 text-cine-accent-light shrink-0" />
                  <span>{react.duracao}</span>
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-sm font-bold text-zinc-100 line-clamp-2 leading-snug group-hover:text-cine-cream transition-colors mb-3">
                  {react.titulo}
                </h3>
                
                <div className="mt-auto pt-3 border-t border-neutral-900 flex items-center justify-end text-[11px] text-zinc-500 font-mono font-semibold">
                  <span>
                    {react.publicadoEm ? react.publicadoEm.split('-').reverse().join('/') : 'Recente'}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Empty State */}
        {filteredReacts.length === 0 && (
          <div className="col-span-full py-16 text-center bg-neutral-900/30 rounded-2xl border border-neutral-800 p-8">
            <Tv className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-zinc-300">Nenhum react encontrado</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Não encontramos nenhum vídeo com o termo pesquisado neste canal.
            </p>
          </div>
        )}
      </div>
      )}
    </motion.div>
  );
}

