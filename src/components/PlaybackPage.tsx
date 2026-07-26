import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Play, Eye, Calendar, ExternalLink, Share2, Heart, MessageSquare, Plus, Check, Sparkles, ChevronDown, ChevronUp, Copy, ThumbsUp, Film, User, Star, Trash2, Tv, Clock, Layers, Info } from 'lucide-react';
import { Obra, ReactVideo, UserState, Comentario } from '../types.ts';
import type { ProfileLoadout } from '../types/gamification.ts';
import { motion, AnimatePresence } from 'motion/react';
import PlaybackSkeleton from './PlaybackSkeleton.tsx';
import OptimizedImage from './OptimizedImage.tsx';

// Lazy loading for heavy comment section component
const CommentSectionLazy = lazy(() => import('./CommentSection.tsx'));

// Lightweight Skeleton Fallbacks for Lazy Sections
function CommentSkeleton() {
  return (
    <div className="bg-neutral-900/30 backdrop-blur-md rounded-2xl p-6 border border-neutral-900 shadow-xl space-y-4 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-neutral-800" />
        <div className="h-4 w-36 bg-neutral-800 rounded-md" />
      </div>
      <div className="h-12 w-full bg-neutral-950/60 rounded-xl border border-neutral-800/50" />
      <div className="space-y-3 pt-2">
        <div className="h-16 bg-neutral-950/40 rounded-xl" />
        <div className="h-16 bg-neutral-950/40 rounded-xl" />
      </div>
    </div>
  );
}

function ShelfSkeleton() {
  return (
    <div className="space-y-4 pt-4 border-t border-neutral-900 animate-pulse">
      <div className="h-5 w-52 bg-neutral-800 rounded-md" />
      <div className="flex gap-4 overflow-hidden pt-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-shrink-0 w-[240px] md:w-[290px] h-[190px] bg-neutral-900/30 rounded-xl border border-neutral-800/50" />
        ))}
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex gap-3.5 p-2.5 rounded-xl bg-neutral-900/20 border border-neutral-900">
          <div className="w-28 h-18 sm:w-36 sm:h-22 bg-neutral-800 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3.5 bg-neutral-800 rounded w-5/6" />
            <div className="h-3 bg-neutral-800 rounded w-1/2" />
            <div className="h-2.5 bg-neutral-900 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

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
  onUpdateUser?: (updatedUser: UserState) => void;
  userLoadout?: ProfileLoadout | null;
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
    <div className="space-y-4 pt-4 border-t border-neutral-900">
      <div className="flex items-center justify-between">
        <h3 className="text-md md:text-lg font-black text-white tracking-tight flex items-center gap-2">
          <span className="w-1 h-5 bg-cine-accent rounded-full" />
          {title}
        </h3>
        <span className="text-xs text-zinc-500 font-mono tracking-wider">{videos.length} {videos.length === 1 ? 'VÍDEO' : 'VÍDEOS'}</span>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory min-w-0">
        {videos.map(video => (
          <motion.div
            key={video.id}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => onSelect(video.id)}
            className="flex-shrink-0 w-[240px] md:w-[290px] bg-neutral-900/10 backdrop-blur-md border border-neutral-800 hover:border-cine-accent/30 rounded-xl overflow-hidden cursor-pointer group flex flex-col snap-start"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-neutral-950">
              <img
                src={video.thumbnailUrl}
                alt={video.titulo}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-md text-[10px] font-bold px-1.5 py-0.5 rounded text-zinc-200 font-mono border border-neutral-800/40 shadow-lg">
                {video.duracao}
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg shadow-cine-accent/40 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                  <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                </div>
              </div>
            </div>

            {/* Video Meta Info */}
            <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
              <div>
                <h4 className="text-xs md:text-sm font-bold text-zinc-100 line-clamp-2 leading-snug group-hover:text-cine-accent-light transition-colors mb-1">
                  {video.titulo}
                </h4>
                <p className="text-[11px] text-zinc-400 font-medium tracking-wide">{video.canalNome}</p>
              </div>
              
              <div className="pt-2 border-t border-neutral-900/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
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
  onOpenAuth,
  onUpdateUser,
  userLoadout,
}: PlaybackPageProps) {
  const [activeReactId, setActiveReactId] = useState<string | null>(initialReactId);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [loadDeferredSections, setLoadDeferredSections] = useState(false);
  
  // Instantly scroll to top and defer loading secondary components slightly so YouTube player gets 100% priority
  useEffect(() => {
    window.scrollTo(0, 0);
    setIframeLoading(true);
    setLoadDeferredSections(false);

    // Give YouTube player high priority on main thread
    const deferredTimer = setTimeout(() => {
      setLoadDeferredSections(true);
    }, 120);

    const timer = setTimeout(() => {
      setIframeLoading(false);
    }, 4500);

    return () => {
      clearTimeout(deferredTimer);
      clearTimeout(timer);
    };
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

  // Video Like state & persistence across platform
  const [videoLiked, setVideoLiked] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('cine_react_liked_video_ids');
      const ids = stored ? JSON.parse(stored) : [];
      return Array.isArray(ids) && ids.includes(initialReactId || '');
    } catch {
      return false;
    }
  });

  const [videoLikesCount, setVideoLikesCount] = useState<number>(0);

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

      // Check if current video is liked by user
      try {
        const stored = localStorage.getItem('cine_react_liked_video_ids');
        const ids = stored ? JSON.parse(stored) : [];
        setVideoLiked(Array.isArray(ids) && ids.includes(activeReactId));
      } catch {
        setVideoLiked(false);
      }
    }
  }, [activeReactId]);

  useEffect(() => {
    if (activeReact) {
      setVideoLikesCount(activeReact.likes ?? 0);
    }
  }, [activeReact]);

  const handleToggleVideoLike = async () => {
    if (!activeReactId) return;
    const nextState = !videoLiked;
    const action = nextState ? 'like' : 'unlike';

    // Optimistic UI state
    setVideoLiked(nextState);
    setVideoLikesCount(prev => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    // Save to localStorage
    try {
      const stored = localStorage.getItem('cine_react_liked_video_ids');
      let arr = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(arr)) arr = [];
      if (nextState) {
        if (!arr.includes(activeReactId)) arr.push(activeReactId);
      } else {
        arr = arr.filter((id: string) => id !== activeReactId);
      }
      localStorage.setItem('cine_react_liked_video_ids', JSON.stringify(arr));
    } catch (e) {
      console.error(e);
    }

    // Call API
    try {
      const res = await fetch(`/api/reacts/${activeReactId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.likes === 'number') {
          setVideoLikesCount(data.likes);
        }
      }
    } catch (e) {
      console.error("Erro ao curtir vídeo:", e);
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
    if (reacts.length === 0) {
      return <PlaybackSkeleton />;
    }
    return (
      <div className="pt-24 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Sparkles className="w-12 h-12 text-cine-accent mb-3 animate-pulse" />
        <div className="text-white font-bold text-lg">Vídeo de React não encontrado</div>
        <p className="text-zinc-500 text-xs mt-1">O link pode estar quebrado ou o conteúdo foi removido.</p>
      </div>
    );
  }

  const isFollowing = canaisSeguidos.includes(activeReact.canalNome);

  // Friendly Date Format Helpers
  const getFriendlyDate = (dateStr?: string) => {
    if (!dateStr) return "Recente";
    try {
      const clean = dateStr.split('T')[0];
      const parts = clean.split('-');
      let pubDate: Date;
      if (parts.length === 3 && parts[0].length === 4) {
        pubDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        pubDate = new Date(dateStr);
      }
      if (isNaN(pubDate.getTime())) return dateStr;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const targetDay = new Date(pubDate.getFullYear(), pubDate.getMonth(), pubDate.getDate());
      const diffTime = today.getTime() - targetDay.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) return "Hoje";
      if (diffDays === 1) return "Ontem";
      if (diffDays < 7) return `Há ${diffDays} dias`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `Há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
      }
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `Há ${months} ${months === 1 ? 'mês' : 'meses'}`;
      }
      const years = Math.floor(diffDays / 365);
      return `Há ${years} ${years === 1 ? 'ano' : 'anos'}`;
    } catch {
      return dateStr || "Recente";
    }
  };

  const getFormattedFullDate = (dateStr?: string) => {
    if (!dateStr) return "Data recente";
    try {
      const clean = dateStr.split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        const year = parts[0];
        const monthNum = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        const monthNames = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
        const monthName = monthNames[monthNum - 1] || parts[1];
        return `${day} de ${monthName} de ${year}`;
      }
      const pubDate = new Date(dateStr);
      if (!isNaN(pubDate.getTime())) {
        return pubDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr || "Data recente";
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
      'from-cine-accent-light to-cine-accent-dark shadow-[0_0_12px_rgba(255,255,255,0.2)]',
      'from-cine-accent to-cine-accent-dark shadow-[0_0_12px_rgba(255,255,255,0.2)]',
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
      className="cine-container pt-24 pb-20 min-h-screen bg-[#0a0e14] w-full"
    >
      {/* GRID LAYOUT: 12 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* LEFT COLUMN: Main Stream (Player, Info, Dynamic Shelves) */}
        <div className={`${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-8 xl:col-span-9'} space-y-6 transition-all duration-300`}>
          
          {/* HIGH-END CINEMATIC GOLDEN BORDER PLAYER FRAME */}
          <div className="relative group/player rounded-3xl p-[2px] bg-gradient-to-tr from-cine-accent-light/60 via-cine-accent-light/80 to-cine-accent-dark/60 hover:from-cine-cream hover:via-cine-cream hover:to-cine-accent shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_40px_rgba(255,255,255,0.25)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_65px_rgba(255,255,255,0.45)] transition-all duration-500">
            {/* Ambient Backlight Glow behind Player */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cine-accent/25 via-cine-accent-light/20 to-cine-accent-dark/25 blur-xl opacity-75 group-hover/player:opacity-100 transition-opacity pointer-events-none -z-10" />

            <div className="relative w-full bg-black rounded-[22px] overflow-hidden aspect-video">
              <iframe 
                key={activeReact.id}
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${activeReact.id}?autoplay=1&controls=1&playsinline=1&modestbranding=1&rel=0&enablejsapi=1${typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : ''}`}
                title={activeReact.titulo}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
                onLoad={() => setIframeLoading(false)}
                className="w-full h-full relative z-0 touch-manipulation"
              ></iframe>

              {/* ELEGANT ANIMATED LOADING OVERLAY / SKELETON FOR VIDEO PLAYER */}
              <AnimatePresence>
                {iframeLoading && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute inset-0 z-20 bg-neutral-950 flex flex-col items-center justify-center overflow-hidden pointer-events-none"
                  >
                    {/* Background Thumbnail with Blur */}
                    {activeReact.thumbnailUrl && (
                      <div className="absolute inset-0 z-0">
                        <img 
                          src={activeReact.thumbnailUrl} 
                          alt="" 
                          className="w-full h-full object-cover blur-xl opacity-35 scale-110" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-neutral-950/60" />
                      </div>
                    )}

                    {/* Central Loading Badge & Animated Ring */}
                    <div className="relative z-10 flex flex-col items-center gap-4 text-center px-4">
                      <div className="relative flex items-center justify-center">
                        {/* Outer Pulsing Aura */}
                        <div className="absolute w-20 h-20 rounded-full bg-cine-accent/20 animate-ping" />
                        
                        {/* Spinning Amber Border Ring */}
                        <div className="w-16 h-16 rounded-full border-2 border-cine-accent/20 border-t-cine-accent-light border-r-cine-accent-light animate-spin shadow-[0_0_20px_rgba(255,255,255,0.3)]" />
                        
                        {/* Central Icon */}
                        <div className="absolute w-12 h-12 rounded-full bg-neutral-900/90 border border-cine-accent/40 flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 fill-cine-accent-light text-cine-accent-light ml-0.5 animate-pulse" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cine-accent/10 border border-cine-accent/30 text-cine-accent-light text-xs font-black uppercase tracking-widest shadow-md backdrop-blur-md">
                          <Sparkles className="w-3.5 h-3.5 text-cine-accent-light animate-spin" />
                          Carregando React...
                        </div>
                        <p className="text-xs text-zinc-300 font-bold max-w-sm line-clamp-1 drop-shadow-md">
                          {activeReact.titulo}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Loading Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-900/80 overflow-hidden">
                      <div className="h-full bg-white animate-[pulse_1.5s_infinite] w-full" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* THEATER MODE QUICK TOGGLE OVERLAY */}
              <button
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className="hidden sm:flex absolute top-3 right-3 z-10 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-cine-accent-light hover:text-cine-cream border border-cine-accent/40 backdrop-blur-md text-xs font-bold transition-all shadow-lg items-center gap-1.5 cursor-pointer opacity-0 group-hover/player:opacity-100"
                title={isTheaterMode ? 'Sair do Modo Teatro' : 'Modo Teatro'}
              >
                <Tv className="w-4 h-4" />
                <span>{isTheaterMode ? 'Modo Normal' : 'Modo Teatro'}</span>
              </button>

              {/* MINIMALIST NEUTRAL CINEREACT WATERMARK (BOTTOM-LEFT) */}
              <div className="absolute bottom-3 left-3.5 z-10 pointer-events-none text-zinc-400/80 font-mono text-[10px] font-bold tracking-widest uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] opacity-70 group-hover/player:opacity-95 transition-opacity duration-300 select-none">
                cinereact
              </div>
            </div>
          </div>

          {/* DYNAMIC METADATA & TITLE CARD */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {activeObra && (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-cine-accent/10 text-cine-accent-light border border-cine-accent/20 shadow-sm shadow-cine-accent/5">
                      <Sparkles className="w-3 h-3 text-cine-accent-light" />
                      {activeObra.tipo === 'canal' 
                        ? 'Reação em Destaque' 
                        : activeObra.tipo === 'serie' 
                          ? 'Série' 
                          : activeObra.tipo === 'jogo' 
                            ? 'Jogo' 
                            : activeObra.tipo === 'anime' 
                              ? 'Anime' 
                              : 'Filme'}
                    </span>

                    {activeObra.titulo && activeObra.tipo !== 'canal' && (
                      <span 
                        onClick={() => onGoToObra(activeObra.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-zinc-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors cursor-pointer"
                      >
                        <Film className="w-3 h-3 text-zinc-400" />
                        {activeObra.titulo}
                      </span>
                    )}
                  </>
                )}

              </div>

              <h1 className="text-xl md:text-3xl font-black text-white leading-tight tracking-tight">
                {activeReact.titulo}
              </h1>
            </div>

            {/* CHANNEL ROW & MODERN ACTIONS BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-neutral-900 pb-5">
              
              {/* Creator details and avatar */}
              <div className="flex items-center gap-3.5">
                {(() => {
                  const hasRealAvatar = channelObra?.poster && 
                    !channelObra.poster.includes('unsplash.com') && 
                    !channelObra.poster.includes('photo-1616469829581');
                  
                  return (
                    <div 
                      className="w-11 h-11 rounded-full bg-neutral-800 flex items-center justify-center cursor-pointer border border-zinc-700/50 relative group overflow-hidden"
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
                      className="font-black text-white text-sm md:text-base cursor-pointer hover:text-cine-accent-light transition-colors leading-none"
                      onClick={() => {
                        const cId = channelObra?.id || activeReact.canalId;
                        if (cId) onGoToCanal(cId);
                      }}
                    >
                      {activeReact.canalNome}
                    </h3>
                    <span className="w-3.5 h-3.5 rounded-full bg-cine-accent/10 text-cine-accent-light flex items-center justify-center border border-cine-accent/20" title="Criador verificado">
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
                      ? 'bg-neutral-900 text-zinc-400 hover:bg-neutral-800 hover:text-white border border-neutral-800' 
                      : 'bg-[#22d3ee] text-white font-black hover:bg-[#0891b2] shadow-lg shadow-cine-accent/20'
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
                  onClick={handleToggleVideoLike}
                  className={`flex items-center gap-2 px-4.5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all border cursor-pointer ${
                    videoLiked
                      ? 'bg-cine-accent/20 border-cine-accent/40 text-cine-cream shadow-md shadow-cine-accent/10'
                      : 'bg-neutral-900/60 border-neutral-800 text-zinc-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                  title={videoLiked ? "Remover curtida do vídeo" : "Gostei deste vídeo"}
                >
                  <ThumbsUp className={`w-4 h-4 transition-transform duration-300 ${videoLiked ? 'fill-cine-accent-light text-cine-accent-light scale-110' : 'text-zinc-400'}`} />
                  <span>{videoLiked ? 'Gostei' : 'Curtir'} ({formatViews(videoLikesCount)})</span>
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleToggleFavorite}
                  className={`flex items-center gap-2 px-4.5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all border cursor-pointer ${
                    isFavorited
                      ? 'bg-cine-accent/20 border-cine-accent/40 text-cine-cream shadow-md shadow-cine-accent/10'
                      : 'bg-neutral-900/60 border-neutral-800 text-zinc-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 transition-transform duration-300 ${isFavorited ? 'fill-cine-accent-light text-cine-accent-light scale-110' : 'text-zinc-400'}`} />
                  {isFavorited ? 'Favoritado' : 'Favoritar'}
                </motion.button>

                <div className="relative">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleShareVideo}
                    className="flex items-center gap-2 bg-neutral-900/60 border border-neutral-800 hover:bg-neutral-800 hover:text-white px-4.5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer"
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
                        className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-neutral-950 text-white border border-cine-accent/30 text-[11px] py-1.5 px-3.5 rounded-lg whitespace-nowrap shadow-xl flex items-center gap-1.5 font-bold tracking-wide z-50"
                      >
                        <Check className="w-3.5 h-3.5 text-cine-accent-light" />
                        Link copiado!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <a 
                  href={`https://www.youtube.com/watch?v=${activeReact.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-cine-accent/10 hover:bg-cine-accent/20 text-cine-accent-light px-4.5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all border border-cine-accent/25 cursor-pointer shadow-md shadow-cine-accent/5 hover:text-cine-cream"
                >
                  <ExternalLink className="w-4 h-4" />
                  YouTube
                </a>
              </div>
            </div>

            {/* INFORMATION PANEL */}
            <div className="bg-neutral-900/30 backdrop-blur-md p-5 md:p-6 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-4 h-4 text-cine-accent-light" />
                  Informações sobre o vídeo
                </h3>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">DETALHES</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 text-xs">
                <div className="bg-neutral-950/50 p-3.5 rounded-xl space-y-1 hover:bg-neutral-950/70 transition-colors">
                  <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5 text-cine-accent-light" /> Curtidas CineReact
                  </span>
                  <span className="text-white font-bold font-mono text-sm block pt-0.5">{formatViews(videoLikesCount)} curtidas</span>
                </div>

                <div className="bg-neutral-950/50 p-3.5 rounded-xl space-y-1 hover:bg-neutral-950/70 transition-colors">
                  <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-cine-accent-light" /> Visualizações
                  </span>
                  <span className="text-white font-bold font-mono text-sm block pt-0.5">{formatViews(activeReact.visualizacoes)} views</span>
                </div>

                <div className="bg-neutral-950/50 p-3.5 rounded-xl space-y-1 hover:bg-neutral-950/70 transition-colors">
                  <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cine-accent-light" /> Duração
                  </span>
                  <span className="text-white font-bold font-mono text-xs block pt-0.5">{activeReact.duracao || 'N/A'}</span>
                </div>

                <div className="bg-neutral-950/50 p-3.5 rounded-xl space-y-1 hover:bg-neutral-950/70 transition-colors">
                  <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cine-accent-light" /> Criador / Canal
                  </span>
                  <span 
                    onClick={() => {
                      const cId = channelObra?.id || activeReact.canalId;
                      if (cId) onGoToCanal(cId);
                    }} 
                    className="text-cine-accent-light font-bold text-xs hover:underline cursor-pointer truncate block pt-0.5"
                  >
                    {activeReact.canalNome}
                  </span>
                </div>

                {activeObra && (
                  <>
                    <div className="bg-neutral-950/50 p-3.5 rounded-xl space-y-1 hover:bg-neutral-950/70 transition-colors">
                      <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-cine-accent-light" /> Categoria
                      </span>
                      <span className="text-zinc-200 font-bold text-xs capitalize block pt-0.5">
                        {activeObra.tipo === 'serie' ? 'Série' : activeObra.tipo === 'jogo' ? 'Jogo' : activeObra.tipo === 'canal' ? 'Canal de React' : activeObra.tipo}
                      </span>
                    </div>

                    <div className="bg-neutral-950/50 p-3.5 rounded-xl space-y-1 hover:bg-neutral-950/70 transition-colors">
                      <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-cine-accent-light" /> Coleção / Obra
                      </span>
                      <span 
                        onClick={() => onGoToObra(activeObra.id)} 
                        className="text-cine-accent-light font-bold text-xs hover:underline cursor-pointer line-clamp-1 block pt-0.5"
                      >
                        {activeObra.titulo}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* COMENTÁRIOS E CURTIDAS DO CINEREACT - LAZY LOADED */}
            <Suspense fallback={<CommentSkeleton />}>
              <CommentSectionLazy 
                obraId={activeReact?.obraId || ''} 
                user={user}
                userLoadout={userLoadout}
                onOpenAuth={onOpenAuth} 
                getFriendlyDate={getFriendlyDate} 
              />
            </Suspense>

          </div>

          {/* DYNAMIC REACT CAROUSELS / DEDICATED SECTIONS (LAZY DEFERRED) */}
          <div className="space-y-8 pt-4">
            {!loadDeferredSections ? (
              <ShelfSkeleton />
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RECOMMENDATIONS SIDEBAR */}
        <div className={`${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-4 xl:col-span-3'} space-y-5 transition-all duration-300`}>
          <div className="border-b border-neutral-900 pb-3">
            <h3 className="font-black text-white text-md uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cine-accent-light animate-pulse" />
              Recomendações
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1 tracking-wide">Vídeos semelhantes baseados no seu gosto</p>
          </div>
          
          <div className="flex flex-col gap-3.5 lg:max-h-[120vh] lg:overflow-y-auto pr-1 lg:scrollbar-thin scrollbar-track-neutral-950 scrollbar-thumb-neutral-800 hover:scrollbar-thumb-cine-accent/20">
            {!loadDeferredSections ? (
              <SidebarSkeleton />
            ) : (
              sidebarRecommendations.map(react => (
                <motion.div 
                  key={react.id} 
                  whileHover={{ scale: 1.01, x: 2 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setActiveReactId(react.id)}
                  className="flex gap-3.5 cursor-pointer group hover:bg-neutral-900/30 p-2.5 -ml-2 rounded-xl transition-all duration-300 border border-transparent hover:border-neutral-800/60"
                >
                  {/* Visual Thumbnail Frame */}
                  <div className="relative w-28 h-18 sm:w-36 sm:h-22 flex-shrink-0 bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800 shadow-md">
                    <OptimizedImage 
                      src={react.thumbnailUrl} 
                      alt={react.titulo} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/85 backdrop-blur-md text-[9px] font-mono font-bold px-1 py-0.5 rounded text-zinc-200 border border-neutral-800/40">
                      {react.duracao}
                    </span>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-5 h-5 fill-white text-white" />
                    </div>
                  </div>

                  {/* Meta details */}
                  <div className="flex flex-col flex-1 overflow-hidden justify-between py-0.5">
                    <h4 className="text-xs font-bold text-zinc-200 line-clamp-2 leading-snug group-hover:text-cine-accent-light transition-colors">
                      {react.titulo}
                    </h4>
                    <div className="space-y-0.5 mt-1">
                      <p className="text-[11px] text-zinc-400 font-semibold truncate hover:text-cine-cream" title={react.canalNome}>
                        {react.canalNome}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                        <span>{formatViews(react.visualizacoes)} views</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            
            {loadDeferredSections && sidebarRecommendations.length === 0 && (
              <div className="text-zinc-500 text-xs italic p-6 bg-neutral-900/10 rounded-2xl text-center border border-neutral-900">
                Nenhuma outra recomendação disponível no momento.
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
