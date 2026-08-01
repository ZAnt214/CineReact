import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  X,
  Send,
  Loader2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { CineClip, CineClipComment } from '../types/cineclips.ts';
import type { UserState } from '../types.ts';
import {
  clipAction,
  fetchClipComments,
  postClipComment,
  useCineClipsFeed,
} from '../../hooks/useCineClips.ts';
import { buildClipShareUrl } from '../../cineclips/utils.ts';

interface CineClipsPageProps {
  user: UserState;
  onBack: () => void;
  onOpenHashtag?: (tag: string) => void;
  onFollowCreator?: (creatorName: string) => void;
  initialClipId?: string;
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
}

function formatCount(value: number): string {
  if (!value) return '0';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (value >= 10_000) return `${Math.round(value / 1000)}K`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}K`;
  return String(value);
}

function CineClipsBetaNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onDismiss}
        aria-label="Fechar aviso"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        className="relative w-full max-w-sm rounded-2xl border border-cyan-400/30 bg-zinc-900/95 p-6 text-center shadow-2xl"
      >
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-extrabold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Beta
        </span>
        <h2 className="text-lg font-black text-white mb-2">CineClips em desenvolvimento</h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-5">
          Esta é uma função <span className="text-cyan-300 font-semibold">beta</span> que ainda está em
          desenvolvimento. Novos vídeos e funcionalidades chegarão em breve.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-2.5 rounded-full bg-cyan-400 text-black text-sm font-extrabold"
        >
          Entendi, continuar
        </button>
      </motion.div>
    </div>
  );
}

function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const scrollY = window.scrollY;
    const { overflow, position, width, top } = document.body.style;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${scrollY}px`;

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.position = position;
      document.body.style.width = width;
      document.body.style.top = top;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}

/** Componente de Notificação Flutuante Toast */
function ToastNotification({
  message,
  type = 'success',
}: {
  message: string;
  type?: 'success' | 'info' | 'error';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-zinc-900/90 border border-white/15 text-white shadow-2xl backdrop-blur-xl text-xs font-semibold"
    >
      {type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
      {type === 'info' && <Sparkles className="w-4 h-4 text-cyan-400" />}
      {type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
      <span>{message}</span>
    </motion.div>
  );
}

/** Player de Vídeo do Clip */
function ClipPlayer({
  clip,
  isActive,
  muted,
  onDoubleTapHeart,
}: {
  clip: CineClip;
  isActive: boolean;
  muted: boolean;
  onDoubleTapHeart: (x: number, y: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);
  const lastTapTimeRef = useRef<number>(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videoId = clip.youtubeId || clip.id;
  const isHosted = !!clip.videoUrl;

  useEffect(() => {
    setVideoFailed(false);
  }, [clip.id, clip.videoUrl]);

  useEffect(() => {
    if (!isActive) return;
    clipAction(clip.id, 'view').catch(() => undefined);
  }, [isActive, clip.id]);

  useEffect(() => {
    const el = videoRef.current;
    if (!isHosted || !el || videoFailed) return;
    el.muted = muted;
    if (isActive && isPlaying) {
      el.play().catch(() => setVideoFailed(true));
    } else {
      el.pause();
    }
  }, [isActive, isHosted, clip.videoUrl, videoFailed, muted, isPlaying]);

  const togglePlayPause = () => {
    if (!isHosted || videoFailed || !videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => undefined);
      setIsPlaying(true);
    }
    setShowPlayOverlay(true);
    setTimeout(() => setShowPlayOverlay(false), 800);
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (now - lastTapTimeRef.current < DOUBLE_TAP_DELAY) {
      // Double tap ativado!
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      onDoubleTapHeart(x, y);
      lastTapTimeRef.current = 0;
    } else {
      // Single tap
      lastTapTimeRef.current = now;
      tapTimeoutRef.current = setTimeout(() => {
        togglePlayPause();
      }, DOUBLE_TAP_DELAY);
    }
  };

  const showHostedVideo = isHosted && !videoFailed;

  return (
    <div
      onClick={handleContainerClick}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden cursor-pointer select-none"
    >
      {isActive ? (
        showHostedVideo ? (
          <video
            ref={videoRef}
            src={clip.videoUrl}
            poster={clip.thumbnailUrl}
            className="w-full h-full object-contain pointer-events-none"
            playsInline
            loop
            muted={muted}
            controls={false}
            onError={() => setVideoFailed(true)}
          />
        ) : isHosted ? (
          <img
            src={clip.thumbnailUrl}
            alt={clip.titulo}
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${
              muted ? 1 : 0
            }&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${videoId}`}
            title={clip.titulo}
            className="w-full h-full pointer-events-none object-cover scale-105"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        )
      ) : (
        <img
          src={clip.thumbnailUrl}
          alt={clip.titulo}
          className="w-full h-full object-cover opacity-40 filter blur-[1px]"
        />
      )}

      {/* Play/Pause Overlay Animation */}
      <AnimatePresence>
        {showPlayOverlay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute z-20 w-16 h-16 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-2xl pointer-events-none"
          >
            {isPlaying ? (
              <Play className="w-8 h-8 fill-white ml-1" />
            ) : (
              <Pause className="w-8 h-8 fill-white" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Botão de ação — skill identidade (orb rail, modo limpo) */
function ActionBtn({
  icon: Icon,
  label,
  onClick,
  variant,
  active,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant: 'like' | 'comment' | 'share';
  active?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      whileTap={{ scale: 0.9 }}
      className={`cineclips-action cineclips-action--${variant}${active ? ' is-active' : ''}`}
      aria-label={label || (variant === 'share' ? 'Enviar' : variant)}
    >
      <span className="cineclips-action-orb">
        <Icon
          className="cineclips-action-svg"
          strokeWidth={2}
          fill={active && variant === 'like' ? 'currentColor' : 'none'}
        />
      </span>
      {label !== '' && <span className="cineclips-action-label">{label}</span>}
    </motion.button>
  );
}

/** Drawer / Sheet de Comentários Moderno */
function CommentsSheet({
  clipId,
  user,
  onClose,
}: {
  clipId: string;
  user: UserState;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<CineClipComment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const EMOJIS = ['🔥', '❤️', '👏', '🍿', '🎬', '😍', '😂'];

  useEffect(() => {
    fetchClipComments(clipId)
      .then((data) => setComments(data.comments || []))
      .finally(() => setLoading(false));
  }, [clipId]);

  const handleSend = async () => {
    if (!text.trim() || !user.isLoggedIn) return;
    setSending(true);
    try {
      const data = await postClipComment(clipId, user.email, user.nome, text.trim());
      setComments((prev) => [data.comment, ...prev]);
      setText('');
    } finally {
      setSending(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="relative z-10 w-full sm:max-w-md max-h-[80vh] sm:rounded-2xl rounded-t-2xl bg-zinc-950/95 border border-white/10 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl"
      >
        {/* Top Drag Handle */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Comentários ({comments.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-xs">Carregando respostas...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 gap-2">
              <MessageCircle className="w-8 h-8 stroke-1 text-zinc-600" />
              <p className="text-xs font-medium">Seja o primeiro a comentar neste clip!</p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3 text-left">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0 shadow-md">
                  {c.usuarioNome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 bg-white/5 border border-white/5 rounded-xl p-3">
                  <p className="text-xs font-bold text-cyan-300">{c.usuarioNome}</p>
                  <p className="text-xs text-zinc-200 mt-1 leading-relaxed break-words">
                    {c.texto}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Emoji Bar & Input */}
        {user.isLoggedIn ? (
          <div className="p-3 border-t border-white/10 bg-black/40 space-y-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => addEmoji(e)}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xs transition-colors"
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escreva um comentário carinhoso..."
                className="flex-1 bg-white/10 border border-white/15 rounded-full px-4 py-2 text-xs text-white placeholder-zinc-400 outline-none focus:border-cyan-400/80 transition-colors"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !text.trim()}
                className="w-9 h-9 rounded-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-black flex items-center justify-center transition-all shadow-lg font-bold"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 ml-0.5" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-white/10 bg-black/40 text-center">
            <p className="text-xs text-zinc-400">Faça login para participar da conversa</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function CineClipsPage({
  user,
  onBack,
  onFollowCreator,
  initialClipId,
}: CineClipsPageProps) {
  const { clips, loading, error, loadMore, nextCursor } = useCineClipsFeed(user.email);
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [commentsClipId, setCommentsClipId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' | 'error' } | null>(
    null
  );
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [showBetaNotice, setShowBetaNotice] = useState(true);

  const feedRef = useRef<HTMLDivElement>(null);
  const slideHeightRef = useRef(0);
  const activeIndexRef = useRef(0);
  const watchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const scrollingRef = useRef(false);

  useBodyScrollLock(true);
  activeIndexRef.current = activeIndex;

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const scrollToIndex = useCallback((index: number, smooth = false) => {
    const feed = feedRef.current;
    if (!feed) return;
    const h = slideHeightRef.current || feed.clientHeight;
    scrollingRef.current = true;
    feed.scrollTo({ top: index * h, behavior: smooth ? 'smooth' : 'auto' });
    setActiveIndex(index);
    window.setTimeout(() => {
      scrollingRef.current = false;
    }, smooth ? 350 : 50);
  }, []);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    const updateHeight = () => {
      slideHeightRef.current = feed.clientHeight;
    };
    updateHeight();

    const ro = new ResizeObserver(updateHeight);
    ro.observe(feed);
    window.addEventListener('resize', updateHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  useEffect(() => {
    if (!initialClipId || clips.length === 0) return;
    const idx = clips.findIndex((c) => c.id === initialClipId);
    if (idx >= 0) scrollToIndex(idx);
  }, [initialClipId, clips, scrollToIndex]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed || clips.length === 0) return;

    const onScroll = () => {
      if (scrollingRef.current) return;
      const h = slideHeightRef.current || feed.clientHeight;
      if (!h) return;
      const idx = Math.round(feed.scrollTop / h);
      const clamped = Math.max(0, Math.min(idx, clips.length - 1));
      if (clamped !== activeIndexRef.current) {
        activeIndexRef.current = clamped;
        setActiveIndex(clamped);
      }
      if (clamped >= clips.length - 3 && nextCursor) loadMore();
    };

    feed.addEventListener('scroll', onScroll, { passive: true });
    return () => feed.removeEventListener('scroll', onScroll);
  }, [clips.length, nextCursor, loadMore]);

  useEffect(() => {
    const clip = clips[activeIndex];
    if (!clip || !user.isLoggedIn) return;

    if (watchTimers.current[clip.id]) clearTimeout(watchTimers.current[clip.id]);
    watchTimers.current[clip.id] = setTimeout(() => {
      clipAction(clip.id, 'watch', {
        email: user.email,
        watchSeconds: clip.duracaoSegundos || 30,
        completed: true,
      }).catch(() => undefined);
    }, Math.min((clip.duracaoSegundos || 30) * 1000 * 0.8, 25000));

    return () => {
      if (watchTimers.current[clip.id]) clearTimeout(watchTimers.current[clip.id]);
    };
  }, [activeIndex, clips, user.email, user.isLoggedIn]);

  const handleLike = async (clip: CineClip) => {
    if (!user.isLoggedIn) {
      showToast('Faça login para curtir clips', 'info');
      return;
    }
    const isLiked = likedIds.has(clip.id);
    try {
      await clipAction(clip.id, isLiked ? 'unlike' : 'like', { email: user.email });
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (isLiked) next.delete(clip.id);
        else next.add(clip.id);
        return next;
      });
      if (!isLiked) {
        showToast('Adicionado aos favoritos de curtidas', 'success');
      }
    } catch {
      /* ignore */
    }
  };

  const handleDoubleTapHeart = (clip: CineClip, x: number, y: number) => {
    const id = Date.now() + Math.random();
    setFloatingHearts((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1000);

    if (!likedIds.has(clip.id)) {
      handleLike(clip);
    }
  };

  const handleShare = async (clip: CineClip) => {
    const url = buildClipShareUrl(clip.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: clip.titulo, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Link copiado para a área de transferência!', 'success');
      }
      await clipAction(clip.id, 'share', user.isLoggedIn ? { email: user.email } : {});
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="cineclips-shell fixed inset-0 z-[60] bg-zinc-950 text-white flex items-center justify-center overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && <ToastNotification message={toast.message} type={toast.type} />}
      </AnimatePresence>

      {/* Desktop shell — sem blur ambiente para visual mais limpo */}
      <div className="relative w-full h-full md:max-w-[420px] md:h-[92vh] md:rounded-3xl border-0 md:border md:border-white/10 bg-black shadow-2xl overflow-hidden flex flex-col">
        {/* Floating Top Header */}
        <header className="cineclips-header-minimal">
          <button
            type="button"
            onClick={onBack}
            className="cineclips-header-minimal-btn"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="cineclips-header-minimal-btn"
            aria-label={muted ? 'Ativar som' : 'Silenciar'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </header>

        {/* Feed Content Area */}
        {loading && clips.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-xs font-medium">Carregando clips...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400" />
            <p className="text-xs text-zinc-300">{error}</p>
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold border border-white/15"
            >
              Voltar ao Início
            </button>
          </div>
        ) : clips.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Nenhum clip por aqui</h3>
            <p className="text-xs text-zinc-400 max-w-xs">
              Novos reacts e vídeos virais chegarão em breve!
            </p>
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2.5 rounded-full bg-cyan-400 text-black text-xs font-extrabold shadow-lg shadow-cyan-400/20"
            >
              Explorar Plataforma
            </button>
          </div>
        ) : (
          <div ref={feedRef} className="cineclips-feed w-full h-full flex-1">
            {clips.map((clip, index) => (
              <article key={clip.id} className="cineclips-slide">
                <div className="cineclips-slide-media">
                  <ClipPlayer
                    clip={clip}
                    isActive={index === activeIndex}
                    muted={muted}
                    onDoubleTapHeart={(x, y) => handleDoubleTapHeart(clip, x, y)}
                  />
                </div>

                <div className="cineclips-slide-scrim cineclips-slide-scrim--light" aria-hidden />

                <AnimatePresence>
                  {floatingHearts.map((h) => (
                    <motion.div
                      key={h.id}
                      initial={{ opacity: 1, scale: 0.4, y: 0 }}
                      animate={{ opacity: 0, scale: 1.8, y: -80 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      style={{ left: h.x - 24, top: h.y - 24 }}
                      className="absolute z-40 pointer-events-none"
                    >
                      <Heart className="w-12 h-12 text-rose-500 fill-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]" />
                    </motion.div>
                  ))}
                </AnimatePresence>

                <div className="cineclips-slide-ui cineclips-slide-ui--minimal">
                  <div className="cineclips-meta cineclips-meta-copy cineclips-meta--minimal">
                    <button
                      type="button"
                      onClick={() => onFollowCreator?.(clip.criadorNome)}
                      className="cineclips-creator-handle"
                    >
                      @{clip.criadorNome}
                    </button>
                    <h2 className="cineclips-title cineclips-title--minimal">{clip.titulo}</h2>
                  </div>

                  <div className="cineclips-rail cineclips-rail--minimal">
                    <ActionBtn
                      icon={Heart}
                      label={formatCount(clip.likes)}
                      variant="like"
                      active={likedIds.has(clip.id)}
                      onClick={() => handleLike(clip)}
                    />
                    <ActionBtn
                      icon={MessageCircle}
                      label={formatCount(clip.commentsCount)}
                      variant="comment"
                      onClick={() => setCommentsClipId(clip.id)}
                    />
                    <ActionBtn
                      icon={Share2}
                      label=""
                      variant="share"
                      onClick={() => handleShare(clip)}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

      </div>

      {/* Slide-Up Comments Drawer */}
      <AnimatePresence>
        {commentsClipId && (
          <CommentsSheet
            clipId={commentsClipId}
            user={user}
            onClose={() => setCommentsClipId(null)}
          />
        )}
      </AnimatePresence>

      {/* Beta Notice */}
      <AnimatePresence>
        {showBetaNotice && <CineClipsBetaNotice onDismiss={() => setShowBetaNotice(false)} />}
      </AnimatePresence>
    </div>
  );
}
