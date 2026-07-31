import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Flag,
  Flame,
  X,
  Send,
  Loader2,
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Check,
  Music,
  CheckCircle2,
  AlertCircle,
  Hash,
  ChevronUp,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { CineClip, CineClipComment } from '../types/cineclips.ts';
import type { UserState } from '../types.ts';
import {
  clipAction,
  downloadClipVideo,
  fetchClipComments,
  postClipComment,
  reportClip,
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

function SwipeHint({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="absolute bottom-14 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-md text-[11px] font-semibold text-white/90 pointer-events-none"
    >
      <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
        <ChevronUp className="w-4 h-4" />
      </motion.span>
      Deslize para ver mais
    </motion.div>
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

      {/* Bottom Gradient Scrim for Legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent 42% to-black/72 pointer-events-none" />
    </div>
  );
}

/** Avatar + seguir no topo do rail (TikTok-native) */
function RailCreatorAvatar({
  name,
  isFollowing,
  onAvatarClick,
  onFollowClick,
}: {
  name: string;
  isFollowing: boolean;
  onAvatarClick: () => void;
  onFollowClick: () => void;
}) {
  return (
    <div className="cineclips-rail-creator">
      <button
        type="button"
        className="cineclips-rail-avatar"
        onClick={(e) => {
          e.stopPropagation();
          onAvatarClick();
        }}
        aria-label={`Perfil de @${name}`}
      >
        <span>{name.charAt(0).toUpperCase()}</span>
      </button>
      {!isFollowing && (
        <motion.button
          type="button"
          className="cineclips-rail-follow"
          onClick={(e) => {
            e.stopPropagation();
            onFollowClick();
          }}
          whileTap={{ scale: 0.88 }}
          aria-label="Seguir criador"
        >
          <Plus className="w-3 h-3" strokeWidth={3} />
        </motion.button>
      )}
    </div>
  );
}

/** Botão de ação — skill identidade (orb rail) */
function ActionBtn({
  icon: Icon,
  label,
  onClick,
  variant,
  active,
  spinning,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant: 'like' | 'comment' | 'favorite' | 'share' | 'download' | 'report';
  active?: boolean;
  spinning?: boolean;
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
      aria-label={label || variant}
    >
      <span className="cineclips-action-orb">
        <Icon
          className={`cineclips-action-svg ${spinning ? 'animate-spin' : ''}`}
          strokeWidth={variant === 'report' ? 1.75 : 2.25}
          fill={active && (variant === 'like' || variant === 'favorite') ? 'currentColor' : 'none'}
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

/** Modal de Denúncia Customizado */
function ReportModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [selectedReason, setSelectedReason] = useState('spam');

  const REASONS = [
    { id: 'spam', label: 'Spam ou conteúdo enganoso' },
    { id: 'inappropriate', label: 'Conteúdo impróprio ou ofensivo' },
    { id: 'copyright', label: 'Violação de direitos autorais' },
    { id: 'other', label: 'Outro motivo' },
  ];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/15 p-5 text-white shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold">Denunciar este Clip</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-400">
          Selecione o motivo da denúncia para análise da nossa moderação:
        </p>

        <div className="space-y-2">
          {REASONS.map((r) => (
            <label
              key={r.id}
              onClick={() => setSelectedReason(r.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                selectedReason === r.id
                  ? 'bg-rose-500/15 border-rose-500/50 text-white font-semibold'
                  : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10'
              }`}
            >
              <input
                type="radio"
                name="reportReason"
                checked={selectedReason === r.id}
                onChange={() => setSelectedReason(r.id)}
                className="accent-rose-500"
              />
              <span>{r.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-full border border-white/10 text-xs text-zinc-300 hover:bg-white/10 font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSubmit(selectedReason)}
            className="flex-1 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-xs text-white font-bold shadow-lg shadow-rose-500/20"
          >
            Enviar Denúncia
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function CineClipsPage({
  user,
  onBack,
  onOpenHashtag,
  onFollowCreator,
  initialClipId,
}: CineClipsPageProps) {
  const { clips, trending, loading, error, loadMore, nextCursor } = useCineClipsFeed(
    user.email
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedTab, setFeedTab] = useState<'forYou' | 'trending'>('forYou');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [followedCreators, setFollowedCreators] = useState<Set<string>>(new Set());
  const [commentsClipId, setCommentsClipId] = useState<string | null>(null);
  const [reportingClip, setReportingClip] = useState<CineClip | null>(null);
  const [downloadingClipId, setDownloadingClipId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' | 'error' } | null>(
    null
  );
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [expandedDesc, setExpandedDesc] = useState<Record<string, boolean>>({});
  const [showBetaNotice, setShowBetaNotice] = useState(true);
  const [showSwipeHint, setShowSwipeHint] = useState(true);

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
    if (index > 0) setShowSwipeHint(false);
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
        if (clamped > 0) setShowSwipeHint(false);
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

  useEffect(() => {
    if (clips.length <= 1) setShowSwipeHint(false);
  }, [clips.length]);

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

  const handleFavorite = async (clip: CineClip) => {
    if (!user.isLoggedIn) {
      showToast('Faça login para salvar clips', 'info');
      return;
    }
    const isFav = favIds.has(clip.id);
    try {
      await clipAction(clip.id, isFav ? 'unfavorite' : 'favorite', { email: user.email });
      setFavIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(clip.id);
        else next.add(clip.id);
        return next;
      });
      showToast(isFav ? 'Removido dos salvos' : 'Clip salvo com sucesso!', 'success');
    } catch {
      /* ignore */
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

  const handleDownload = async (clip: CineClip) => {
    setDownloadingClipId(clip.id);
    showToast('Iniciando download do vídeo...', 'info');
    try {
      await downloadClipVideo(clip.id);
      showToast('Download concluído!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Não foi possível baixar o vídeo.', 'error');
    } finally {
      setDownloadingClipId(null);
    }
  };

  const handleReportSubmit = async (reason: string) => {
    if (!reportingClip || !user.isLoggedIn) return;
    try {
      await reportClip(reportingClip.id, user.email, user.nome, reason);
      showToast('Denúncia recebida. Obrigado por colaborar!', 'success');
    } catch {
      showToast('Erro ao enviar denúncia.', 'error');
    } finally {
      setReportingClip(null);
    }
  };

  const toggleFollow = (creatorName: string) => {
    setFollowedCreators((prev) => {
      const next = new Set(prev);
      const isFollowing = next.has(creatorName);
      if (isFollowing) {
        next.delete(creatorName);
        showToast(`Deixou de seguir @${creatorName}`, 'info');
      } else {
        next.add(creatorName);
        showToast(`Você agora está seguindo @${creatorName}!`, 'success');
      }
      return next;
    });
    onFollowCreator?.(creatorName);
  };

  const activeClip = clips[activeIndex];

  return (
    <div className="cineclips-shell fixed inset-0 z-[60] bg-zinc-950 text-white flex items-center justify-center overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && <ToastNotification message={toast.message} type={toast.type} />}
      </AnimatePresence>

      {/* Desktop Ambient Blurred Poster Background */}
      {activeClip?.thumbnailUrl && (
        <div
          className="hidden md:block absolute inset-0 bg-cover bg-center opacity-30 filter blur-3xl scale-110 pointer-events-none transition-all duration-700"
          style={{ backgroundImage: `url(${activeClip.thumbnailUrl})` }}
        />
      )}

      {/* Main 9:16 Vertical Shell Container */}
      <div className="relative w-full h-full md:max-w-[420px] md:h-[92vh] md:rounded-3xl border-0 md:border md:border-white/15 bg-black shadow-2xl overflow-hidden flex flex-col">
        {/* Floating Top Header */}
        <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-md">
          {/* Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-black/40 border border-white/15 flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Center Feed Tabs */}
          <div className="flex items-center gap-1 bg-black/50 border border-white/15 rounded-full p-1 backdrop-blur-xl">
            <span className="px-2 text-[9px] font-extrabold uppercase tracking-wider text-cyan-300/90 hidden sm:inline">
              Beta
            </span>
            <button
              type="button"
              onClick={() => {
                setFeedTab('forYou');
                scrollToIndex(0, true);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                feedTab === 'forYou'
                  ? 'bg-cyan-400 text-black shadow-md'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              Para Você
            </button>
            <button
              type="button"
              onClick={() => {
                setFeedTab('trending');
                if (trending.length > 0) {
                  const idx = clips.findIndex((c) => c.id === trending[0].id);
                  if (idx >= 0) scrollToIndex(idx, true);
                }
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                feedTab === 'trending'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3 fill-current" />
              Em Alta
            </button>
          </div>

          {/* Audio Sound Toggle */}
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              muted
                ? 'bg-rose-500/20 border border-rose-500/50 text-rose-400'
                : 'bg-black/40 border border-white/15 text-white hover:bg-white/20'
            }`}
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
            {clips.map((clip, index) => {
              const isFollowing = followedCreators.has(clip.criadorNome);
              const isExpanded = expandedDesc[clip.id];

              return (
                <article
                  key={clip.id}
                  className="relative w-full h-full flex-shrink-0 snap-start snap-always overflow-hidden"
                >
                  {/* Clip Player Frame */}
                  <ClipPlayer
                    clip={clip}
                    isActive={index === activeIndex}
                    muted={muted}
                    onDoubleTapHeart={(x, y) => handleDoubleTapHeart(clip, x, y)}
                  />

                  {/* Floating Double-Tap Hearts */}
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

                  {/* UI Controls Overlay Layer */}
                  <div className="absolute inset-0 z-20 pointer-events-none flex items-end justify-between p-4 pb-6 gap-3">
                    {/* Left Info Column — sem caixa/blur, legível pelo gradiente do vídeo */}
                    <div className="flex-1 min-w-0 pointer-events-auto space-y-2.5 text-left cineclips-meta-copy">
                      {/* Hot Tag */}
                      {clip.isTrending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/25 border border-rose-500/50 text-[10px] font-extrabold text-rose-400 uppercase tracking-wider">
                          <Flame className="w-3 h-3 fill-current" />
                          Em Alta
                        </span>
                      )}

                      {/* Creator Row */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 p-0.5 shadow-md flex-shrink-0">
                          <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-extrabold text-cyan-300">
                            {clip.criadorNome.charAt(0).toUpperCase()}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onFollowCreator?.(clip.criadorNome)}
                          className="font-bold text-sm text-white hover:text-cyan-300 transition-colors cursor-pointer truncate"
                        >
                          @{clip.criadorNome}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleFollow(clip.criadorNome)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                            isFollowing
                              ? 'bg-white/10 border-white/20 text-zinc-300'
                              : 'bg-cyan-400 border-cyan-400 text-black hover:bg-cyan-300'
                          }`}
                        >
                          {isFollowing ? (
                            <>
                              <Check className="w-3 h-3" />
                              Seguindo
                            </>
                          ) : (
                            '+ Seguir'
                          )}
                        </button>
                      </div>

                      {/* Title & Caption */}
                      <div>
                        <h2 className="text-sm font-bold text-white leading-snug line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                          {clip.titulo}
                        </h2>

                        {clip.descricao && (
                          <div className="mt-1">
                            <p
                              className={`text-xs text-zinc-200 leading-relaxed transition-all ${
                                isExpanded ? '' : 'line-clamp-2'
                              }`}
                            >
                              {clip.descricao}
                            </p>
                            {clip.descricao.length > 70 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedDesc((prev) => ({
                                    ...prev,
                                    [clip.id]: !prev[clip.id],
                                  }))
                                }
                                className="text-[11px] font-bold text-cyan-400 hover:underline mt-0.5"
                              >
                                {isExpanded ? 'mostrar menos' : 'mais'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Hashtag Badges */}
                      {clip.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {clip.hashtags.slice(0, 3).map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => onOpenHashtag?.(tag)}
                              className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-cyan-400/20 border border-white/15 text-[11px] font-semibold text-cyan-300 transition-all cursor-pointer flex items-center gap-0.5"
                            >
                              <Hash className="w-2.5 h-2.5 opacity-70" />
                              {tag.replace(/^#/, '')}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Audio / Track Bar */}
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-300/90 font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                        <Music className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
                        <span className="truncate">Som original - @{clip.criadorNome}</span>
                      </div>
                    </div>

                    {/* Right Floating Rail Buttons */}
                    <div className="cineclips-rail pointer-events-auto">
                      <RailCreatorAvatar
                        name={clip.criadorNome}
                        isFollowing={isFollowing}
                        onAvatarClick={() => onFollowCreator?.(clip.criadorNome)}
                        onFollowClick={() => toggleFollow(clip.criadorNome)}
                      />
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
                        icon={Bookmark}
                        label={formatCount(clip.favorites)}
                        variant="favorite"
                        active={favIds.has(clip.id)}
                        onClick={() => handleFavorite(clip)}
                      />
                      <ActionBtn
                        icon={Share2}
                        label="Enviar"
                        variant="share"
                        onClick={() => handleShare(clip)}
                      />
                      {clip.videoUrl && (
                        <ActionBtn
                          icon={downloadingClipId === clip.id ? Loader2 : Download}
                          label="Baixar"
                          variant="download"
                          onClick={() => handleDownload(clip)}
                          spinning={downloadingClipId === clip.id}
                        />
                      )}
                      <ActionBtn
                        icon={Flag}
                        label=""
                        variant="report"
                        onClick={() => {
                          if (!user.isLoggedIn) {
                            showToast('Faça login para denunciar', 'info');
                            return;
                          }
                          setReportingClip(clip);
                        }}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <SwipeHint visible={showSwipeHint && clips.length > 1 && !showBetaNotice} />

        {/* Bottom Progress Bar Indicator */}
        {clips.length > 1 && (
          <div className="absolute bottom-1 left-0 right-0 z-30 flex justify-center gap-1 px-4 pointer-events-none">
            {clips.slice(0, Math.min(clips.length, 10)).map((clip, i) => (
              <span
                key={clip.id}
                className={`h-0.5 rounded-full transition-all duration-300 ${
                  i === activeIndex ? 'w-5 bg-cyan-400' : 'w-2 bg-white/30'
                }`}
              />
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

      {/* Report Modal */}
      <AnimatePresence>
        {reportingClip && (
          <ReportModal
            onClose={() => setReportingClip(null)}
            onSubmit={handleReportSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
