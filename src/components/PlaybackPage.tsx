import React, { useState, useEffect, useRef } from 'react';
import { Play, Eye, Calendar, ExternalLink, Share2, Heart, MessageSquare, Plus, Check, Sparkles, ChevronDown, ChevronUp, Copy, ThumbsUp, Film, User, Star, Trash2 } from 'lucide-react';
import { Obra, ReactVideo, UserState, Comentario } from '../types.ts';
import { motion, AnimatePresence } from 'motion/react';

interface PlaybackPageProps {
  obraId: string;
  initialReactId: string | null;
  reacts: ReactVideo[];
  obras: Obra[];
  user: UserState;
  canaisSeguidos: string[];
  onToggleSeguir: (canalNome: string) => void;
  onGoToObra: (obraId: string) => void;
  onGoToCanal: (canalId: string) => void;
  onUpdateProgress?: (reactId: string, obraId: string, progress: number) => void;
  onOpenAuth?: () => void;
}

// Local Reusable Component for Horizontal React Carousels
function PremiumVideoShelf({ 
  title, 
  videos, 
  onSelect,
  formatViews,
  getFriendlyDate
}: { 
  title: string; 
  videos: ReactVideo[]; 
  onSelect: (id: string) => void;
  formatViews: (v: number) => string;
  getFriendlyDate: (d: string) => string;
}) {
  if (videos.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t border-zinc-900">
      <div className="flex items-center justify-between">
        <h3 className="text-md md:text-lg font-black text-white tracking-tight flex items-center gap-2">
          <span className="w-1 h-5 bg-teal-500 rounded-full" />
          {title}
        </h3>
        <span className="text-xs text-zinc-500 font-mono tracking-wider">{videos.length} {videos.length === 1 ? 'VÍDEO' : 'VÍDEOS'}</span>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory">
        {videos.map(video => (
          <motion.div
            key={video.id}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => onSelect(video.id)}
            className="flex-shrink-0 w-[240px] md:w-[290px] bg-zinc-900/10 backdrop-blur-md border border-zinc-850 hover:border-teal-500/30 rounded-xl overflow-hidden cursor-pointer group flex flex-col snap-start"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
              <img
                src={video.thumbnailUrl}
                alt={video.titulo}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-md text-[10px] font-bold px-1.5 py-0.5 rounded text-zinc-200 font-mono border border-zinc-800/40 shadow-lg">
                {video.duracao}
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/40 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                  <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                </div>
              </div>
            </div>

            {/* Video Meta Info */}
            <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
              <div>
                <h4 className="text-xs md:text-sm font-bold text-zinc-100 line-clamp-2 leading-snug group-hover:text-teal-400 transition-colors mb-1">
                  {video.titulo}
                </h4>
                <p className="text-[11px] text-zinc-400 font-medium tracking-wide">{video.canalNome}</p>
              </div>
              
              <div className="pt-2 border-t border-zinc-900/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>{formatViews(video.visualizacoes)} visualizações</span>
                <span className="text-zinc-500/40 tracking-widest font-black">CINE</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function PlaybackPage({ 
  obraId, 
  initialReactId, 
  reacts, 
  obras,
  user,
  canaisSeguidos,
  onToggleSeguir,
  onGoToObra,
  onGoToCanal,
  onUpdateProgress,
  onOpenAuth
}: PlaybackPageProps) {
  const [activeReactId, setActiveReactId] = useState<string | null>(initialReactId);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  // Instantly scroll to top when mounting or changing active video
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeReactId]);

  useEffect(() => {
    setActiveReactId(initialReactId);
  }, [initialReactId]);

  useEffect(() => {
    setAvatarError(false);
  }, [activeReactId]);

  const activeReact = reacts.find(r => r.id === activeReactId);

  const channelObra = activeReact ? obras.find(o => 
    o?.tipo === 'canal' && 
    (o?.id === activeReact.canalId || 
     o?.titulo?.toLowerCase() === `canal ${activeReact.canalNome.toLowerCase()}` ||
     o?.titulo?.toLowerCase() === activeReact.canalNome.toLowerCase() ||
     o?.titulo?.replace('Canal ', '').toLowerCase() === activeReact.canalNome.toLowerCase())
  ) : undefined;

  // Keep references stable for callbacks and objects inside background effect
  const onUpdateProgressRef = useRef(onUpdateProgress);
  useEffect(() => {
    onUpdateProgressRef.current = onUpdateProgress;
  }, [onUpdateProgress]);

  const activeReactRef = useRef(activeReact);
  useEffect(() => {
    activeReactRef.current = activeReact;
  }, [activeReact]);

  // Background watcher effect triggered strictly when activeReactId primitive changes
  useEffect(() => {
    const currentReactId = activeReactId;
    const currentReact = activeReactRef.current;
    if (!currentReactId || !currentReact) return;

    // Determine starting progress (default 10)
    let currentProgress = 10;
    const stored = localStorage.getItem('cine_react_continue_watching');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const found = parsed.find((item: any) => item.reactId === currentReactId);
          if (found) {
            currentProgress = found.progress;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Trigger initial progress save immediately
    if (onUpdateProgressRef.current) {
      onUpdateProgressRef.current(currentReactId, currentReact.obraId, currentProgress);
    }

    // Interval to simulate progressive watching (incrementing by 1% every 4 seconds)
    const interval = setInterval(() => {
      currentProgress = Math.min(98, currentProgress + 1);
      if (onUpdateProgressRef.current) {
        onUpdateProgressRef.current(currentReactId, currentReact.obraId, currentProgress);
      }
    }, 4000);

    return () => {
      clearInterval(interval);
    };
  }, [activeReactId]);

  // Handle Likes/Favorites Local persistence
  const [isFavorited, setIsFavorited] = useState(() => {
    const favorites = localStorage.getItem('cine_react_favorites');
    if (favorites) {
      try {
        const parsed = JSON.parse(favorites);
        return Array.isArray(parsed) && parsed.includes(initialReactId || '');
      } catch {
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    if (activeReactId) {
      const favorites = localStorage.getItem('cine_react_favorites');
      if (favorites) {
        try {
          const parsed = JSON.parse(favorites);
          setIsFavorited(Array.isArray(parsed) && parsed.includes(activeReactId));
        } catch {
          setIsFavorited(false);
        }
      } else {
        setIsFavorited(false);
      }
    }
  }, [activeReactId]);

  // Comments & Reviews State
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [comentariosLoading, setComentariosLoading] = useState(false);
  const [novoComentarioTexto, setNovoComentarioTexto] = useState('');
  const [comentarioNota, setComentarioNota] = useState(5);
  const [comentarioEnviando, setComentarioEnviando] = useState(false);
  const [comentarioErro, setComentarioErro] = useState('');
  const [comentarioSucesso, setComentarioSucesso] = useState(false);

  const fetchComentarios = async () => {
    if (!activeReact?.obraId) return;
    setComentariosLoading(true);
    try {
      const res = await fetch(`/api/comentarios?obraId=${activeReact.obraId}`);
      if (res.ok) {
        const data = await res.json();
        setComentarios(data);
      }
    } catch (e) {
      console.error("Erro ao buscar comentarios:", e);
    } finally {
      setComentariosLoading(false);
    }
  };

  useEffect(() => {
    fetchComentarios();
    setNovoComentarioTexto('');
    setComentarioNota(5);
    setComentarioErro('');
    setComentarioSucesso(false);
  }, [activeReact?.obraId]);

  const handleAddComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.isLoggedIn) {
      setComentarioErro('Você precisa estar logado para comentar.');
      return;
    }
    if (!novoComentarioTexto.trim()) {
      setComentarioErro('Escreva seu comentário primeiro.');
      return;
    }
    if (!activeReact?.obraId) return;

    setComentarioEnviando(true);
    setComentarioErro('');
    setComentarioSucesso(false);

    try {
      const res = await fetch('/api/comentarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          obraId: activeReact.obraId,
          usuarioNome: user.nome,
          usuarioEmail: user.email,
          texto: novoComentarioTexto,
          nota: comentarioNota
        })
      });

      if (res.ok) {
        setNovoComentarioTexto('');
        setComentarioNota(5);
        setComentarioSucesso(true);
        await fetchComentarios();
      } else {
        const data = await res.json();
        setComentarioErro(data.error || 'Erro ao enviar comentário.');
      }
    } catch (err) {
      setComentarioErro('Erro ao se conectar ao servidor.');
    } finally {
      setComentarioEnviando(false);
    }
  };

  const handleDeleteComentario = async (id: string) => {
    try {
      const res = await fetch(`/api/comentarios/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchComentarios();
      }
    } catch (e) {
      console.error("Erro ao deletar comentario:", e);
    }
  };

  const handleToggleFavorite = () => {
    if (!activeReactId) return;
    setIsFavorited(prev => {
      const next = !prev;
      const favorites = localStorage.getItem('cine_react_favorites');
      let arr = [];
      if (favorites) {
        try { arr = JSON.parse(favorites); } catch {}
      }
      if (!Array.isArray(arr)) arr = [];
      if (next) {
        if (!arr.includes(activeReactId)) arr.push(activeReactId);
      } else {
        arr = arr.filter((id: string) => id !== activeReactId);
      }
      localStorage.setItem('cine_react_favorites', JSON.stringify(arr));
      return next;
    });
  };

  // Share URL Clipboard Actions
  const handleShareVideo = () => {
    if (!activeReactId) return;
    const shareUrl = `${window.location.origin}/?reactId=${activeReactId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2400);
    }).catch(() => {
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2400);
    });
  };

  const activeObra = obras.find(o => o.id === (activeReact?.obraId || obraId));

  // Fisher-Yates shuffle function helper
  const shuffleList = <T,>(arr: T[]): T[] => {
    const list = [...arr];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };

  // Category specific matching for carousels
  // 1. Same Obra (excluding current react) - shuffled to be non-repetitive
  const reactsDestaObra = React.useMemo(() => {
    const filtered = reacts.filter(r => r.obraId === activeObra?.id && r.id !== activeReactId);
    return shuffleList(filtered);
  }, [reacts, activeObra?.id, activeReactId]);

  // 2. Same channel (excluding current react) - shuffled to be non-repetitive
  const reactsDesteCriador = React.useMemo(() => {
    const filtered = reacts.filter(r => r.canalNome === activeReact?.canalNome && r.id !== activeReactId);
    return shuffleList(filtered);
  }, [reacts, activeReact?.canalNome, activeReactId]);

  // 3. Similar category / media type (excluding current react & same Obra to maximize discovery) - shuffled to be non-repetitive
  const reactsSemelhantes = React.useMemo(() => {
    const similarObras = obras.filter(o => o.tipo === activeObra?.tipo && o.id !== activeObra?.id);
    const similarObrasIds = new Set(similarObras.map(o => o.id));
    const filtered = reacts.filter(r => similarObrasIds.has(r.obraId) && r.id !== activeReactId);
    return shuffleList(filtered);
  }, [reacts, obras, activeObra?.tipo, activeObra?.id, activeReactId]);

  // Sidebar recommendation feed list (excluding current video) - shuffled pool to be non-repetitive
  const sidebarRecommendations = React.useMemo(() => {
    const pool = reacts.filter(r => r.id !== activeReactId)
      .sort((a, b) => b.visualizacoes - a.visualizacoes)
      .slice(0, 24);
    return shuffleList(pool).slice(0, 12);
  }, [reacts, activeReactId]);

  if (!activeReact) {
    return (
      <div className="pt-24 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Sparkles className="w-12 h-12 text-teal-500 mb-3 animate-pulse" />
        <div className="text-white font-bold text-lg">Vídeo de React não encontrado</div>
        <p className="text-zinc-500 text-xs mt-1">O link pode estar quebrado ou o conteúdo foi removido.</p>
      </div>
    );
  }

  const isFollowing = canaisSeguidos.includes(activeReact.canalNome);

  // Friendly Date Format Helper
  const getFriendlyDate = (dateStr: string) => {
    try {
      const pubDate = new Date(dateStr);
      if (isNaN(pubDate.getTime())) return dateStr;
      
      const now = new Date();
      const diffTime = now.getTime() - pubDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return "Em breve";
      if (diffDays === 0) return "Hoje";
      if (diffDays === 1) return "Ontem";
      if (diffDays < 7) return `há ${diffDays} dias`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
      }
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
      }
      const years = Math.floor(diffDays / 365);
      return `há ${years} ${years === 1 ? 'ano' : 'anos'}`;
    } catch {
      return dateStr;
    }
  };

  const getFormattedFullDate = (dateStr: string) => {
    try {
      const pubDate = new Date(dateStr);
      if (isNaN(pubDate.getTime())) return dateStr;
      
      return pubDate.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1).replace('.', ',') + 'M';
    }
    if (views >= 1000) {
      return (views / 1000).toFixed(0) + ' mil';
    }
    return views.toString();
  };

  // Avatar Gradient styling based on channel name
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-teal-600 to-teal-800 shadow-[0_0_12px_rgba(20,184,166,0.2)]',
      'from-rose-600 to-rose-800 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="pt-24 pb-20 px-4 md:px-8 max-w-[1700px] mx-auto min-h-screen bg-[#0d0d10]"
    >
      {/* GRID LAYOUT: 12 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* LEFT COLUMN: Main Stream (Player, Info, Dynamic Shelves) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          
          {/* PLAYER WRAPPER */}
          <div className="relative w-full bg-black rounded-2xl overflow-hidden aspect-video shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-zinc-800/60 group/player">
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${activeReact.id}?autoplay=1&modestbranding=1&rel=0&showinfo=0`}
              title={activeReact.titulo}
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>

          {/* DYNAMIC METADATA & TITLE CARD */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              {activeObra && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm shadow-teal-500/5">
                  <Film className="w-3 h-3" />
                  {activeObra.tipo}
                </span>
              )}
              <h1 className="text-xl md:text-3xl font-black text-white leading-tight tracking-tight">
                {activeReact.titulo}
              </h1>
            </div>

            {/* CHANNEL ROW & MODERN ACTIONS BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-zinc-900 pb-5">
              
              {/* Creator details and avatar */}
              <div className="flex items-center gap-3.5">
                {(() => {
                  const hasRealAvatar = channelObra?.poster && 
                    !channelObra.poster.includes('unsplash.com') && 
                    !channelObra.poster.includes('photo-1616469829581');
                  
                  return (
                    <div 
                      className="w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center cursor-pointer border border-zinc-700/50 relative group overflow-hidden"
                      onClick={() => {
                        const cId = channelObra?.id || activeReact.canalId;
                        if (cId) onGoToCanal(cId);
                      }}
                    >
                      {hasRealAvatar && !avatarError ? (
                        <img 
                          src={channelObra.poster} 
                          alt={activeReact.canalNome} 
                          className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <User className="w-5.5 h-5.5 text-zinc-400 group-hover:scale-105 transition-transform duration-300" />
                      )}
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  );
                })()}
                
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-1.5">
                    <h3 
                      className="font-black text-white text-sm md:text-base cursor-pointer hover:text-teal-400 transition-colors leading-none"
                      onClick={() => {
                        const cId = channelObra?.id || activeReact.canalId;
                        if (cId) onGoToCanal(cId);
                      }}
                    >
                      {activeReact.canalNome}
                    </h3>
                    <span className="w-3.5 h-3.5 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20" title="Criador verificado">
                      <Check className="w-2 h-2 stroke-[3]" />
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono mt-1 tracking-wide">
                    {formatViews(activeReact.visualizacoes * 1.5).replace(',0', '')} inscritos
                  </p>
                </div>
                
                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onToggleSeguir(activeReact.canalNome)}
                  className={`ml-3 px-5 py-2 rounded-full text-xs font-black tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                    isFollowing 
                      ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-white border border-zinc-800' 
                      : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20 hover:shadow-teal-600/30'
                  }`}
                >
                  {isFollowing ? 'Inscrito' : 'Seguir'}
                </motion.button>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-start sm:justify-end">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleToggleFavorite}
                  className={`flex items-center gap-2 px-4.5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all border cursor-pointer ${
                    isFavorited
                      ? 'bg-teal-600/15 border-teal-500/30 text-teal-400 shadow-md shadow-teal-600/5'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-850 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 transition-transform duration-300 ${isFavorited ? 'fill-teal-500 text-teal-500 scale-110' : 'text-zinc-400'}`} />
                  {isFavorited ? 'Favoritado' : 'Favoritar'}
                </motion.button>

                <div className="relative">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleShareVideo}
                    className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-850 hover:text-white px-4.5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-zinc-400" />
                    Compartilhar
                  </motion.button>

                  {/* Toast notification overlay */}
                  <AnimatePresence>
                    {shareFeedback && (
                      <motion.div 
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-zinc-950 text-white border border-teal-500/30 text-[11px] py-1.5 px-3.5 rounded-lg whitespace-nowrap shadow-xl flex items-center gap-1.5 font-bold tracking-wide z-50"
                      >
                        <Check className="w-3.5 h-3.5 text-teal-400" />
                        Link copiado!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <a 
                  href={`https://www.youtube.com/watch?v=${activeReact.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-teal-600/10 hover:bg-teal-600/20 text-teal-400 px-4.5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all border border-teal-500/25 cursor-pointer shadow-md shadow-teal-600/5 hover:text-teal-300"
                >
                  <ExternalLink className="w-4 h-4" />
                  YouTube
                </a>
              </div>
            </div>

            {/* INFORMATION PANEL */}
            <div className="bg-zinc-900/25 backdrop-blur-md border border-zinc-850 p-4 md:p-6 rounded-2xl hover:bg-zinc-900/30 transition-all duration-300">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1 h-3.5 bg-teal-500 rounded-full" />
                Informações sobre o vídeo
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                <div>
                  <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider block mb-0.5">Visualizações</span>
                  <span className="text-zinc-200 font-bold font-mono text-xs">{formatViews(activeReact.visualizacoes)} views</span>
                </div>

                <div>
                  <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider block mb-0.5">Data de publicação</span>
                  <span className="text-zinc-200 font-bold text-xs" title={getFormattedFullDate(activeReact.publicadoEm)}>
                    {getFriendlyDate(activeReact.publicadoEm)}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider block mb-0.5">Duração</span>
                  <span className="text-zinc-200 font-bold font-mono text-xs">{activeReact.duracao}</span>
                </div>

                <div>
                  <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider block mb-0.5">Canal / Criador</span>
                  <span 
                    onClick={() => {
                      const cId = channelObra?.id || activeReact.canalId;
                      if (cId) onGoToCanal(cId);
                    }} 
                    className="text-teal-400 font-bold text-xs hover:underline cursor-pointer"
                  >
                    {activeReact.canalNome}
                  </span>
                </div>

                {activeObra && (
                  <>
                    <div>
                      <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider block mb-0.5">Categoria</span>
                      <span className="text-zinc-200 font-bold text-xs capitalize">
                        {activeObra.tipo === 'serie' ? 'Série' : activeObra.tipo === 'jogo' ? 'Jogo' : activeObra.tipo}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider block mb-0.5">Playlist ou Coleção</span>
                      <span 
                        onClick={() => onGoToObra(activeObra.id)} 
                        className="text-teal-400 font-bold text-xs hover:underline cursor-pointer line-clamp-1"
                      >
                        {activeObra.titulo}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* AVALIAÇÕES E COMENTÁRIOS */}
            <div className="bg-zinc-900/20 border border-zinc-850 p-4 md:p-6 rounded-2xl hover:bg-zinc-900/25 transition-all duration-300 mt-6 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-850/60 pb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-teal-400" />
                  Avaliações e Comentários ({comentarios.length})
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">COMUNIDADE</span>
              </div>

              {/* FORM DE COMENTÁRIO */}
              {user.isLoggedIn ? (
                <form onSubmit={handleAddComentario} className="space-y-4 bg-zinc-900/35 p-4 rounded-xl border border-zinc-850/50">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <img src={user.avatar} alt={user.nome} className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-800" />
                      <div>
                        {user.isDonor ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs bg-gradient-to-r from-teal-400 via-pink-400 to-rose-400 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                              {user.nome}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-rose-500 to-teal-600 text-[7px] uppercase font-bold text-white tracking-widest flex items-center gap-0.5"><Sparkles className="w-1.5 h-1.5 text-rose-200 fill-current" /> APOIADOR</span>
                          </div>
                        ) : (
                          <span className="font-bold text-xs text-zinc-300">{user.nome}</span>
                        )}
                        <span className="text-[9px] text-zinc-500 block">Deixe sua opinião e nota</span>
                      </div>
                    </div>

                    {/* SELETOR DE NOTA EM ESTRELAS */}
                    <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-850">
                      <span className="text-[10px] text-zinc-400 font-mono mr-1.5">Nota:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setComentarioNota(star)}
                          className="text-zinc-500 hover:scale-110 transition-transform"
                        >
                          <Star 
                            className={`w-4 h-4 ${star <= comentarioNota ? 'fill-amber-400 text-amber-400' : 'text-zinc-700 hover:text-zinc-500'}`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <textarea
                      value={novoComentarioTexto}
                      onChange={(e) => setNovoComentarioTexto(e.target.value)}
                      placeholder="Compartilhe o que achou desse react... (Seu feedback ajuda o criador e a comunidade)"
                      rows={3}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    />

                    {user.isDonor && (
                      <p className="text-[10px] text-rose-400 flex items-center gap-1 font-sans">
                        <Sparkles className="w-3 h-3 animate-pulse text-rose-300" />
                        Como Apoiador VIP, seu nome será exibido com destaque brilhante e tag exclusiva!
                      </p>
                    )}

                    {comentarioErro && <p className="text-red-400 text-[10px] font-semibold">{comentarioErro}</p>}
                    {comentarioSucesso && <p className="text-emerald-400 text-[10px] font-semibold">Avaliação enviada com sucesso!</p>}

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={comentarioEnviando}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {comentarioEnviando ? 'Enviando...' : 'Publicar Avaliação'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-850/60 text-center space-y-3">
                  <p className="text-xs text-zinc-400">Você precisa estar conectado para avaliar este conteúdo.</p>
                  <button 
                    type="button"
                    onClick={() => onOpenAuth?.()}
                    className="px-4 py-1.5 bg-teal-600/10 hover:bg-teal-600/20 text-teal-400 font-bold text-xs rounded-full border border-teal-500/25 transition-colors cursor-pointer inline-block"
                  >
                    Entrar ou Cadastrar
                  </button>
                </div>
              )}

              {/* LISTA DE COMENTÁRIOS */}
              <div className="space-y-4">
                {comentariosLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-12 bg-zinc-900 rounded-lg"></div>
                    <div className="h-12 bg-zinc-900 rounded-lg"></div>
                  </div>
                ) : comentarios.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 italic text-xs">
                    Nenhum comentário ainda. Seja o primeiro a avaliar!
                  </div>
                ) : (
                  <div className="space-y-3.5 lg:max-h-96 lg:overflow-y-auto pr-1">
                    {comentarios.map((c) => (
                      <div key={c.id} className="p-3.5 bg-zinc-950/60 border border-zinc-850/50 rounded-xl space-y-2 flex gap-3 relative group">
                        <div className="flex-shrink-0">
                          {c.avatar ? (
                            <img src={c.avatar} className="w-8 h-8 rounded-full object-cover ring-1 ring-zinc-800" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                              <User className="w-4 h-4 text-zinc-500" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {c.isDonor ? (
                                <span className="font-extrabold text-xs bg-gradient-to-r from-teal-400 via-pink-400 to-rose-400 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(244,63,94,0.4)] flex items-center gap-1.5">
                                  {c.usuarioNome}
                                  <span className="px-1 py-0.5 rounded bg-gradient-to-r from-rose-500 to-teal-600 text-[6px] uppercase font-bold text-white tracking-widest flex items-center gap-0.5"><Sparkles className="w-1.5 h-1.5 text-rose-200 fill-current" /> APOIADOR</span>
                                </span>
                              ) : (
                                <span className="font-bold text-xs text-zinc-300">{c.usuarioNome}</span>
                              )}
                              
                              <span className="text-[9px] text-zinc-500">
                                {new Date(c.criadoEm).toLocaleDateString('pt-BR')}
                              </span>
                            </div>

                            {/* ESTRELAS DO COMENTÁRIO */}
                            <div className="flex items-center gap-0.5 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-850">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`w-3 h-3 ${star <= (c.nota || 5) ? 'fill-amber-400 text-amber-400' : 'text-zinc-800'}`} 
                                />
                              ))}
                            </div>
                          </div>

                          <p className="text-xs text-zinc-400 leading-relaxed mt-1">{c.texto}</p>
                        </div>

                        {/* EXCLUIR COMENTÁRIO SE FOR AUTOR OU ADMIN */}
                        {(user.isAdmin || user.email === c.usuarioEmail) && (
                          <button
                            onClick={() => handleDeleteComentario(c.id)}
                            className="absolute top-3.5 right-3.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-900 rounded-md"
                            title="Remover Comentário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* DYNAMIC REACT CAROUSELS / DEDICATED SECTIONS */}
          <div className="space-y-8 pt-4">
            {/* Section 1: Mais Reacts deste conteúdo */}
            <PremiumVideoShelf 
              title={`Mais Reacts de "${activeObra?.titulo || 'este conteúdo'}"`}
              videos={reactsDestaObra}
              onSelect={(id) => setActiveReactId(id)}
              formatViews={formatViews}
              getFriendlyDate={getFriendlyDate}
            />

            {/* Section 2: Mais vídeos deste criador */}
            <PremiumVideoShelf 
              title={`Mais Vídeos de ${activeReact.canalNome}`}
              videos={reactsDesteCriador}
              onSelect={(id) => setActiveReactId(id)}
              formatViews={formatViews}
              getFriendlyDate={getFriendlyDate}
            />

            {/* Section 3: Reacts semelhantes (based on same category type) */}
            <PremiumVideoShelf 
              title={`Reacts de outros ${activeObra?.tipo === 'filme' ? 'Filmes' : activeObra?.tipo === 'serie' ? 'Séries' : activeObra?.tipo === 'jogo' ? 'Jogos' : 'Animes'}`}
              videos={reactsSemelhantes}
              onSelect={(id) => setActiveReactId(id)}
              formatViews={formatViews}
              getFriendlyDate={getFriendlyDate}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: RECOMMENDATIONS SIDEBAR */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-5">
          <div className="border-b border-zinc-900 pb-3">
            <h3 className="font-black text-white text-md uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
              Recomendações
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1 tracking-wide">Vídeos semelhantes baseados no seu gosto</p>
          </div>
          
          <div className="flex flex-col gap-3.5 lg:max-h-[120vh] lg:overflow-y-auto pr-1 lg:scrollbar-thin scrollbar-track-zinc-950 scrollbar-thumb-zinc-800 hover:scrollbar-thumb-teal-500/20">
            {sidebarRecommendations.map(react => (
              <motion.div 
                key={react.id} 
                whileHover={{ scale: 1.01, x: 2 }}
                transition={{ duration: 0.2 }}
                onClick={() => setActiveReactId(react.id)}
                className="flex gap-3.5 cursor-pointer group hover:bg-zinc-900/30 p-2.5 -ml-2 rounded-xl transition-all duration-300 border border-transparent hover:border-zinc-850/60"
              >
                {/* Visual Thumbnail Frame */}
                <div className="relative w-28 h-18 sm:w-36 sm:h-22 flex-shrink-0 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-850 shadow-md">
                  <img 
                    src={react.thumbnailUrl} 
                    alt={react.titulo} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/85 backdrop-blur-md text-[9px] font-mono font-bold px-1 py-0.5 rounded text-zinc-200 border border-zinc-800/40">
                    {react.duracao}
                  </span>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-5 h-5 fill-white text-white" />
                  </div>
                </div>

                {/* Meta details */}
                <div className="flex flex-col flex-1 overflow-hidden justify-between py-0.5">
                  <h4 className="text-xs font-bold text-zinc-200 line-clamp-2 leading-snug group-hover:text-teal-400 transition-colors">
                    {react.titulo}
                  </h4>
                  <div className="space-y-0.5 mt-1">
                    <p className="text-[11px] text-zinc-400 font-semibold truncate hover:text-teal-300" title={react.canalNome}>
                      {react.canalNome}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                      <span>{formatViews(react.visualizacoes)} views</span>
                      <span>•</span>
                      <span>{getFriendlyDate(react.publicadoEm)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {sidebarRecommendations.length === 0 && (
              <div className="text-zinc-500 text-xs italic p-6 bg-zinc-900/10 rounded-2xl text-center border border-zinc-900">
                Nenhuma outra recomendação disponível no momento.
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
