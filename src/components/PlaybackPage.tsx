import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import {
  Play,
  Eye,
  ExternalLink,
  Share2,
  Heart,
  ThumbsUp,
  Film,
  User,
  Tv,
  Clock,
  Layers,
  Check,
} from 'lucide-react';
import { Obra, ReactVideo, UserState } from '../types.ts';
import type { ProfileLoadout } from '../types/gamification.ts';
import PlaybackSkeleton from './PlaybackSkeleton.tsx';
import OptimizedImage from './OptimizedImage.tsx';
import CineReactLogo from './CineReactLogo.tsx';
import PlaybackPageHeader from './playback/PlaybackPageHeader.tsx';
import PlaybackVideoShelf from './playback/PlaybackVideoShelf.tsx';
import { PLAYBACK_SHELF_LIMIT, PLAYBACK_SIDEBAR_LIMIT } from '../constants/playback.ts';
import { isChannelVerifiedOnClient } from '../utils/channelVerification.ts';

const CommentSectionLazy = lazy(() => import('./CommentSection.tsx'));

function CommentSkeleton() {
  return (
    <div className="pt-4 border-t border-neutral-900/80 space-y-3 animate-pulse">
      <div className="h-4 w-36 bg-neutral-800 rounded" />
      <div className="h-11 w-full bg-neutral-900/60 rounded-lg" />
      <div className="h-14 bg-neutral-900/40 rounded-lg" />
      <div className="h-14 bg-neutral-900/40 rounded-lg" />
    </div>
  );
}

function ShelfSkeleton() {
  return (
    <div className="pt-6 border-t border-neutral-900/80 space-y-3 animate-pulse">
      <div className="h-4 w-48 bg-neutral-800 rounded" />
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0 w-[200px] sm:w-[240px]">
            <div className="aspect-video bg-neutral-900 rounded-lg" />
            <div className="h-3 bg-neutral-800 rounded mt-2 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="w-32 sm:w-36 aspect-video bg-neutral-900 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 bg-neutral-800 rounded w-5/6" />
            <div className="h-3 bg-neutral-800 rounded w-1/2" />
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

function topReactsByViews(
  list: ReactVideo[],
  excludeId: string | null,
  limit: number
): ReactVideo[] {
  return list
    .filter((r) => r.id !== excludeId)
    .sort((a, b) => b.visualizacoes - a.visualizacoes)
    .slice(0, limit);
}

function formatViews(views: number) {
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (views >= 1_000) {
    return `${Math.round(views / 1_000)} mil`;
  }
  return views.toString();
}

function getFriendlyDate(dateStr?: string) {
  if (!dateStr) return 'Recente';
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
    const diffDays = Math.round((today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
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
    return dateStr || 'Recente';
  }
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
  userLoadout,
}: PlaybackPageProps) {
  const [activeReactId, setActiveReactId] = useState<string | null>(initialReactId);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [loadDeferredSections, setLoadDeferredSections] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIframeLoading(true);
    setLoadDeferredSections(false);

    const deferredTimer = window.setTimeout(() => setLoadDeferredSections(true), 120);
    const safetyTimer = window.setTimeout(() => setIframeLoading(false), 10_000);

    return () => {
      clearTimeout(deferredTimer);
      clearTimeout(safetyTimer);
    };
  }, [activeReactId]);

  useEffect(() => {
    setActiveReactId(initialReactId);
  }, [initialReactId]);

  useEffect(() => {
    setAvatarError(false);
  }, [activeReactId]);

  const activeReact = reacts.find((r) => r.id === activeReactId);

  const channelObra = activeReact
    ? obras.find(
        (o) =>
          o?.tipo === 'canal' &&
          (o?.id === activeReact.canalId ||
            o?.titulo?.toLowerCase() === `canal ${activeReact.canalNome.toLowerCase()}` ||
            o?.titulo?.toLowerCase() === activeReact.canalNome.toLowerCase() ||
            o?.titulo?.replace('Canal ', '').toLowerCase() === activeReact.canalNome.toLowerCase())
      )
    : undefined;

  const isChannelVerified = isChannelVerifiedOnClient(channelObra);

  const onUpdateProgressRef = useRef(onUpdateProgress);
  useEffect(() => {
    onUpdateProgressRef.current = onUpdateProgress;
  }, [onUpdateProgress]);

  const activeReactRef = useRef(activeReact);
  useEffect(() => {
    activeReactRef.current = activeReact;
  }, [activeReact]);

  useEffect(() => {
    const currentReactId = activeReactId;
    const currentReact = activeReactRef.current;
    if (!currentReactId || !currentReact) return;

    let currentProgress = 10;
    const stored = localStorage.getItem('cine_react_continue_watching');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const found = parsed.find((item: { reactId: string }) => item.reactId === currentReactId);
          if (found) currentProgress = found.progress;
        }
      } catch (e) {
        console.error(e);
      }
    }

    onUpdateProgressRef.current?.(currentReactId, currentReact.obraId, currentProgress);

    const interval = setInterval(() => {
      currentProgress = Math.min(98, currentProgress + 1);
      onUpdateProgressRef.current?.(currentReactId, currentReact.obraId, currentProgress);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeReactId]);

  const [isFavorited, setIsFavorited] = useState(() => {
    try {
      const favorites = localStorage.getItem('cine_react_favorites');
      const parsed = favorites ? JSON.parse(favorites) : [];
      return Array.isArray(parsed) && parsed.includes(initialReactId || '');
    } catch {
      return false;
    }
  });

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
    if (!activeReactId) return;

    try {
      const favorites = localStorage.getItem('cine_react_favorites');
      const parsed = favorites ? JSON.parse(favorites) : [];
      setIsFavorited(Array.isArray(parsed) && parsed.includes(activeReactId));
    } catch {
      setIsFavorited(false);
    }

    try {
      const stored = localStorage.getItem('cine_react_liked_video_ids');
      const ids = stored ? JSON.parse(stored) : [];
      setVideoLiked(Array.isArray(ids) && ids.includes(activeReactId));
    } catch {
      setVideoLiked(false);
    }
  }, [activeReactId]);

  useEffect(() => {
    if (activeReact) setVideoLikesCount(activeReact.likes ?? 0);
  }, [activeReact]);

  const handleToggleVideoLike = useCallback(async () => {
    if (!activeReactId) return;
    const nextState = !videoLiked;
    const action = nextState ? 'like' : 'unlike';

    setVideoLiked(nextState);
    setVideoLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

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

    try {
      const res = await fetch(`/api/reacts/${activeReactId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.likes === 'number') setVideoLikesCount(data.likes);
      }
    } catch (e) {
      console.error('Erro ao curtir vídeo:', e);
    }
  }, [activeReactId, videoLiked]);

  const handleToggleFavorite = useCallback(() => {
    if (!activeReactId) return;
    setIsFavorited((prev) => {
      const next = !prev;
      try {
        const favorites = localStorage.getItem('cine_react_favorites');
        let arr = favorites ? JSON.parse(favorites) : [];
        if (!Array.isArray(arr)) arr = [];
        if (next) {
          if (!arr.includes(activeReactId)) arr.push(activeReactId);
        } else {
          arr = arr.filter((id: string) => id !== activeReactId);
        }
        localStorage.setItem('cine_react_favorites', JSON.stringify(arr));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [activeReactId]);

  const handleShareVideo = useCallback(() => {
    if (!activeReactId) return;
    const shareUrl = `${window.location.origin}/?reactId=${activeReactId}`;
    navigator.clipboard.writeText(shareUrl).finally(() => {
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2400);
    });
  }, [activeReactId]);

  const handleSelectReact = useCallback((id: string) => {
    setActiveReactId(id);
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIframeLoading(false);
  }, []);

  const activeObra = obras.find((o) => o.id === (activeReact?.obraId || obraId));

  const reactsDestaObra = useMemo(
    () =>
      topReactsByViews(
        reacts.filter((r) => r.obraId === activeObra?.id),
        activeReactId,
        PLAYBACK_SHELF_LIMIT
      ),
    [reacts, activeObra?.id, activeReactId]
  );

  const reactsDesteCriador = useMemo(
    () =>
      topReactsByViews(
        reacts.filter((r) => r.canalNome === activeReact?.canalNome),
        activeReactId,
        PLAYBACK_SHELF_LIMIT
      ),
    [reacts, activeReact?.canalNome, activeReactId]
  );

  const reactsSemelhantes = useMemo(() => {
    const similarObras = obras.filter((o) => o.tipo === activeObra?.tipo && o.id !== activeObra?.id);
    const similarObrasIds = new Set(similarObras.map((o) => o.id));
    return topReactsByViews(
      reacts.filter((r) => similarObrasIds.has(r.obraId)),
      activeReactId,
      PLAYBACK_SHELF_LIMIT
    );
  }, [reacts, obras, activeObra?.tipo, activeObra?.id, activeReactId]);

  const sidebarRecommendations = useMemo(
    () => topReactsByViews(reacts, activeReactId, PLAYBACK_SIDEBAR_LIMIT),
    [reacts, activeReactId]
  );

  const goToChannel = useCallback(() => {
    const cId = channelObra?.id || activeReact?.canalId;
    if (cId) onGoToCanal(cId);
  }, [channelObra?.id, activeReact?.canalId, onGoToCanal]);

  if (!activeReact) {
    if (reacts.length === 0) return <PlaybackSkeleton />;
    return (
      <div className="cine-container pt-24 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Film className="w-10 h-10 text-cine-accent mb-3" />
        <div className="text-white font-semibold text-lg">Vídeo de React não encontrado</div>
        <p className="text-zinc-500 text-sm mt-1">O link pode estar quebrado ou o conteúdo foi removido.</p>
      </div>
    );
  }

  const isFollowing = canaisSeguidos.includes(activeReact.canalNome);
  const embedOrigin =
    typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
  const embedSrc = `https://www.youtube.com/embed/${activeReact.id}?autoplay=1&controls=1&playsinline=1&modestbranding=1&rel=0&enablejsapi=1${embedOrigin}`;

  const hasRealAvatar =
    channelObra?.poster &&
    !channelObra.poster.includes('unsplash.com') &&
    !channelObra.poster.includes('photo-1616469829581');

  const similarTitle =
    activeObra?.tipo === 'filme'
      ? 'Filmes'
      : activeObra?.tipo === 'serie'
        ? 'Séries'
        : activeObra?.tipo === 'jogo'
          ? 'Jogos'
          : 'Animes';

  return (
    <div className="cine-container pt-24 pb-20 min-h-screen bg-cine-bg w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        <div
          className={`${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-8 xl:col-span-9'} space-y-5`}
        >
          <PlaybackPageHeader obra={activeObra} react={activeReact} />

          <div className="relative group/player rounded-xl border border-neutral-800/80 overflow-hidden">
            <div className="relative w-full bg-black aspect-video">
              <iframe
                key={activeReact.id}
                width="100%"
                height="100%"
                src={embedSrc}
                title={activeReact.titulo}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={handleIframeLoad}
                className="w-full h-full relative z-0 touch-manipulation"
              />

              {iframeLoading && (
                <div
                  className="absolute inset-0 z-20 bg-neutral-950 flex flex-col items-center justify-center pointer-events-none"
                  aria-hidden
                >
                  <div className="w-10 h-10 rounded-full border-2 border-neutral-800 border-t-cine-accent animate-spin" />
                  <p className="mt-3 text-xs text-zinc-500 font-medium">Carregando player…</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsTheaterMode((v) => !v)}
                className="hidden sm:flex absolute top-3 right-3 z-10 px-2.5 py-1.5 rounded-lg bg-black/75 hover:bg-black text-zinc-300 hover:text-white border border-neutral-700 text-xs font-medium transition-colors items-center gap-1.5 cursor-pointer opacity-0 group-hover/player:opacity-100"
                title={isTheaterMode ? 'Sair do modo teatro' : 'Modo teatro'}
              >
                <Tv className="w-3.5 h-3.5" />
                {isTheaterMode ? 'Normal' : 'Teatro'}
              </button>

              <div className="absolute bottom-3 left-3 z-10 pointer-events-none opacity-60 group-hover/player:opacity-90 transition-opacity select-none">
                <CineReactLogo size="xs" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {activeObra && activeObra.tipo !== 'canal' && activeObra.titulo && (
              <button
                type="button"
                onClick={() => onGoToObra(activeObra.id)}
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500 hover:text-cine-accent-light transition-colors"
              >
                <Film className="w-3 h-3" />
                Ver obra · {activeObra.titulo}
              </button>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1 border-b border-neutral-900/80 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={goToChannel}
                  className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700/60 overflow-hidden shrink-0"
                >
                  {hasRealAvatar && !avatarError ? (
                    <img
                      src={channelObra!.poster}
                      alt={activeReact.canalNome}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <User className="w-5 h-5 text-zinc-400" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={goToChannel}
                      className="font-semibold text-white text-sm truncate hover:text-cine-accent-light transition-colors"
                    >
                      {activeReact.canalNome}
                    </button>
                    {isChannelVerified && (
                      <span
                        className="w-3.5 h-3.5 rounded-full bg-cine-accent/10 text-cine-accent-light flex items-center justify-center border border-cine-accent/20 shrink-0"
                        title="Criador verificado"
                      >
                        <Check className="w-2 h-2 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {formatViews(activeReact.visualizacoes)} visualizações
                    {activeReact.publicadoEm ? ` · ${getFriendlyDate(activeReact.publicadoEm)}` : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleSeguir(activeReact.canalNome)}
                  className={`ml-1 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                    isFollowing
                      ? 'bg-neutral-900 text-zinc-400 hover:text-white border border-neutral-800'
                      : 'bg-cine-accent text-white hover:bg-cine-accent-dark'
                  }`}
                >
                  {isFollowing ? 'Inscrito' : 'Seguir'}
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleToggleVideoLike}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    videoLiked
                      ? 'bg-cine-accent/15 border-cine-accent/30 text-cine-cream'
                      : 'bg-neutral-900/50 border-neutral-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <ThumbsUp
                    className={`w-3.5 h-3.5 ${videoLiked ? 'fill-cine-accent-light text-cine-accent-light' : ''}`}
                  />
                  {formatViews(videoLikesCount)}
                </button>

                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    isFavorited
                      ? 'bg-cine-accent/15 border-cine-accent/30 text-cine-cream'
                      : 'bg-neutral-900/50 border-neutral-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${isFavorited ? 'fill-cine-accent-light text-cine-accent-light' : ''}`}
                  />
                  {isFavorited ? 'Salvo' : 'Salvar'}
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={handleShareVideo}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border bg-neutral-900/50 border-neutral-800 text-zinc-300 hover:text-white transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Compartilhar
                  </button>
                  {shareFeedback && (
                    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-neutral-950 text-white border border-cine-accent/30 text-[10px] py-1 px-2.5 rounded whitespace-nowrap flex items-center gap-1 z-50">
                      <Check className="w-3 h-3 text-cine-accent-light" />
                      Link copiado
                    </span>
                  )}
                </div>

                <a
                  href={`https://www.youtube.com/watch?v=${activeReact.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-cine-accent/25 bg-cine-accent/10 text-cine-accent-light hover:bg-cine-accent/20 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  YouTube
                </a>
              </div>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-xs border-b border-neutral-900/80 pb-5">
              <div>
                <dt className="text-zinc-500 flex items-center gap-1 mb-0.5">
                  <ThumbsUp className="w-3 h-3" /> Curtidas
                </dt>
                <dd className="text-zinc-200 font-medium">{formatViews(videoLikesCount)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500 flex items-center gap-1 mb-0.5">
                  <Eye className="w-3 h-3" /> Visualizações
                </dt>
                <dd className="text-zinc-200 font-medium">{formatViews(activeReact.visualizacoes)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500 flex items-center gap-1 mb-0.5">
                  <Clock className="w-3 h-3" /> Duração
                </dt>
                <dd className="text-zinc-200 font-medium">{activeReact.duracao || '—'}</dd>
              </div>
              {activeObra && (
                <>
                  <div>
                    <dt className="text-zinc-500 flex items-center gap-1 mb-0.5">
                      <Film className="w-3 h-3" /> Categoria
                    </dt>
                    <dd className="text-zinc-200 font-medium capitalize">
                      {activeObra.tipo === 'serie'
                        ? 'Série'
                        : activeObra.tipo === 'jogo'
                          ? 'Jogo'
                          : activeObra.tipo === 'canal'
                            ? 'Canal'
                            : activeObra.tipo}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500 flex items-center gap-1 mb-0.5">
                      <Layers className="w-3 h-3" /> Obra
                    </dt>
                    <dd>
                      <button
                        type="button"
                        onClick={() => onGoToObra(activeObra.id)}
                        className="text-cine-accent-light font-medium hover:underline text-left line-clamp-1"
                      >
                        {activeObra.titulo}
                      </button>
                    </dd>
                  </div>
                </>
              )}
            </dl>

            {loadDeferredSections ? (
              <Suspense fallback={<CommentSkeleton />}>
                <CommentSectionLazy
                  obraId={activeReact.obraId}
                  user={user}
                  userLoadout={userLoadout}
                  onOpenAuth={onOpenAuth}
                  getFriendlyDate={getFriendlyDate}
                />
              </Suspense>
            ) : (
              <CommentSkeleton />
            )}
          </div>

          <div className="space-y-2">
            {!loadDeferredSections ? (
              <ShelfSkeleton />
            ) : (
              <>
                <PlaybackVideoShelf
                  title={`Mais reacts de "${activeObra?.titulo || 'este conteúdo'}"`}
                  videos={reactsDestaObra}
                  onSelect={handleSelectReact}
                />
                <PlaybackVideoShelf
                  title={`Mais vídeos de ${activeReact.canalNome}`}
                  videos={reactsDesteCriador}
                  onSelect={handleSelectReact}
                />
                <PlaybackVideoShelf
                  title={`Reacts de outros ${similarTitle}`}
                  videos={reactsSemelhantes}
                  onSelect={handleSelectReact}
                />
              </>
            )}
          </div>
        </div>

        <aside
          className={`${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-4 xl:col-span-3'} space-y-4`}
        >
          <div className="border-b border-neutral-900/80 pb-3">
            <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500 font-semibold">
              Recomendações
            </p>
            <p className="text-sm text-zinc-500 mt-1">Populares na plataforma</p>
          </div>

          <div className="flex flex-col gap-2 lg:max-h-[120vh] lg:overflow-y-auto lg:scrollbar-thin scrollbar-track-neutral-950 scrollbar-thumb-neutral-800">
            {!loadDeferredSections ? (
              <SidebarSkeleton />
            ) : sidebarRecommendations.length === 0 ? (
              <p className="text-zinc-500 text-xs py-4">Nenhuma recomendação disponível.</p>
            ) : (
              sidebarRecommendations.map((react) => (
                <button
                  key={react.id}
                  type="button"
                  onClick={() => handleSelectReact(react.id)}
                  className="flex gap-3 text-left group rounded-lg p-1.5 -mx-1.5 hover:bg-neutral-900/40 transition-colors"
                >
                  <div className="relative w-32 sm:w-36 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800/80">
                    <OptimizedImage
                      src={react.thumbnailUrl}
                      alt={react.titulo}
                      lite
                      className="md:group-hover:scale-[1.03] md:transition-transform md:duration-300"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-mono px-1 py-0.5 rounded text-zinc-200">
                      {react.duracao}
                    </span>
                    <div className="absolute inset-0 bg-black/40 opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <Play className="w-4 h-4 fill-white text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 py-0.5">
                    <span className="text-xs font-medium text-zinc-200 line-clamp-2 leading-snug group-hover:text-cine-accent-light transition-colors">
                      {react.titulo}
                    </span>
                    <span className="text-[11px] text-zinc-500 mt-1 truncate">{react.canalNome}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
