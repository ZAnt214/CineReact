import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import {
  ArrowLeft,
  Heart,
  X,
  Send,
  Loader2,
  Play,
  Pause,
  Volume2,
  VolumeX,
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
import ProfileAvatar from '../profile/ProfileAvatar.tsx';
import ProfileNameRow from '../profile/ProfileNameRow.tsx';
import { resolveAuthorProfileProps } from '../../utils/authorProfileDisplay.ts';

interface CineClipsPageProps {
  user: UserState;
  onBack: () => void;
  onOpenHashtag?: (tag: string) => void;
  onFollowCreator?: (creatorName: string) => void;
  onSubscribe?: (creatorEmail?: string) => void;
  initialClipId?: string;
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
}

const BETA_DISMISS_KEY = 'cineclips-beta-dismissed';
const SLIDE_WINDOW = 1;

function readBetaDismissed(): boolean {
  try {
    return localStorage.getItem(BETA_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function persistBetaDismissed() {
  try {
    localStorage.setItem(BETA_DISMISS_KEY, '1');
  } catch {
    /* ignore */
  }
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
    <div className="cineclips-welcome-overlay">
      <button
        type="button"
        className="cineclips-welcome-backdrop"
        onClick={onDismiss}
        aria-label="Fechar"
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="cineclips-welcome-card"
      >
        <p className="cineclips-welcome-eyebrow">CineClips</p>
        <h2 className="cineclips-welcome-title">Clips curtos dos reacts</h2>
        <p className="cineclips-welcome-text">
          Vídeos rápidos da comunidade para assistir entre um react e outro. O catálogo
          cresce aos poucos — aproveite o que já está disponível.
        </p>
        <button type="button" onClick={onDismiss} className="cineclips-welcome-btn">
          Começar
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

/** Toast discreto — sem ícones decorativos */
function ToastNotification({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="cineclips-toast-minimal"
    >
      {message}
    </motion.div>
  );
}

/** Player de Vídeo do Clip — só carrega mídia no slide ativo e vizinhos */
const ClipPlayer = memo(function ClipPlayer({
  clip,
  isActive,
  shouldLoad,
  muted,
  onDoubleTapHeart,
  onSubscribe,
}: {
  clip: CineClip;
  isActive: boolean;
  shouldLoad: boolean;
  muted: boolean;
  onDoubleTapHeart: (x: number, y: number) => void;
  onSubscribe?: () => void;
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

  const showHostedVideo = isHosted && !videoFailed && !clip.isLocked;

  if (clip.isLocked && shouldLoad) {
    return (
      <div className="relative w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden p-6 text-center">
        {clip.thumbnailUrl && (
          <img
            src={clip.thumbnailUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
          />
        )}
        <div className="relative z-10 space-y-4 max-w-xs">
          <p className="text-base font-bold text-white">Conteúdo para assinantes</p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Assine para desbloquear este vídeo
            {clip.requiresSubscription === 'global' ? ' (assinatura global)' : ''}.
          </p>
          {onSubscribe && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSubscribe();
              }}
              className="cineclips-welcome-btn cineclips-welcome-btn--inline"
            >
              Ver planos
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!shouldLoad) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        {clip.thumbnailUrl ? (
          <img
            src={clip.thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-50"
          />
        ) : null}
      </div>
    );
  }

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
            className="w-full h-full object-contain pointer-events-none cineclips-video"
            playsInline
            loop
            muted={muted}
            controls={false}
            preload={isActive ? 'metadata' : 'none'}
            onError={() => setVideoFailed(true)}
          />
        ) : isHosted ? (
          <img
            src={clip.thumbnailUrl}
            alt={clip.titulo}
            loading="lazy"
            decoding="async"
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
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover opacity-60"
        />
      )}

      {/* Play/Pause Overlay Animation */}
      {showPlayOverlay && (
          <div className="absolute z-20 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/55 border border-white/15 flex items-center justify-center text-white pointer-events-none cineclips-play-flash">
            {isPlaying ? (
              <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white ml-0.5" />
            ) : (
              <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-white" />
            )}
          </div>
        )}
    </div>
  );
});

/** Ações do clip — texto, sem ícones de rede social */
const ClipActionChip = memo(function ClipActionChip({
  variant,
  count,
  active,
  onClick,
}: {
  variant: 'like' | 'comment' | 'share';
  count?: number;
  active?: boolean;
  onClick: () => void;
}) {
  const word =
    variant === 'like' ? 'Curtir' : variant === 'comment' ? 'Comentar' : 'Enviar';
  const countLabel =
    variant !== 'share' && count !== undefined ? formatCount(count) : null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`cineclips-action-chip cineclips-action-chip--${variant}${active ? ' is-active' : ''}`}
      aria-label={countLabel ? `${word} — ${countLabel}` : word}
    >
      <span className="cineclips-action-chip-word">{word}</span>
      {countLabel && <span className="cineclips-action-chip-count">{countLabel}</span>}
    </button>
  );
});

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

  return (
    <div className="cineclips-sheet-overlay">
      <div className="cineclips-sheet-backdrop" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 340 }}
        className="cineclips-sheet-panel"
      >
        <div className="cineclips-sheet-handle" />

        <div className="cineclips-sheet-header">
          <h3 className="cineclips-sheet-title">
            Comentários
            <span className="cineclips-sheet-count">{comments.length}</span>
          </h3>
          <button type="button" onClick={onClose} className="cineclips-sheet-close" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="cineclips-sheet-body">
          {loading ? (
            <div className="cineclips-sheet-empty">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
              <span>Carregando...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="cineclips-sheet-empty">
              <p className="text-sm font-medium text-zinc-300">Nenhum comentário ainda</p>
              <p className="text-xs text-zinc-500">Deixe a primeira reação neste clip.</p>
            </div>
          ) : (
            comments.map((c) => {
              const author = resolveAuthorProfileProps(c);
              return (
              <div key={c.id} className="cineclips-comment-row">
                <ProfileAvatar
                  photoUrl={author.avatar}
                  alt={c.usuarioNome}
                  size="sm"
                  profileDisplay={author.profileDisplay}
                  isDonor={author.isDonor}
                  lite
                  className="flex-shrink-0"
                />
                <div className="cineclips-comment-bubble">
                  <ProfileNameRow
                    name={c.usuarioNome}
                    isDonor={author.isDonor}
                    profileDisplay={author.profileDisplay}
                    nameSize="sm"
                  />
                  <p className="cineclips-comment-text">{c.texto}</p>
                </div>
              </div>
            );
            })
          )}
        </div>

        {user.isLoggedIn ? (
          <div className="cineclips-sheet-compose">
            <ProfileAvatar
              photoUrl={user.avatar}
              alt={user.nome}
              size="sm"
              isDonor={!!user.isDonor}
              lite
              className="flex-shrink-0"
            />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escreva um comentário..."
              className="cineclips-sheet-input"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !text.trim()}
              className="cineclips-sheet-send"
              aria-label="Enviar comentário"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        ) : (
          <div className="cineclips-sheet-login">
            <p>Faça login para comentar neste clip.</p>
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
  onSubscribe,
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
  const [showBetaNotice, setShowBetaNotice] = useState(() => !readBetaDismissed());

  const feedRef = useRef<HTMLDivElement>(null);
  const slideHeightRef = useRef(0);
  const activeIndexRef = useRef(0);
  const watchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const scrollingRef = useRef(false);
  const scrollRafRef = useRef(0);
  const preloadLinkRef = useRef<HTMLLinkElement | null>(null);

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
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = requestAnimationFrame(() => {
        const h = slideHeightRef.current || feed.clientHeight;
        if (!h) return;
        const idx = Math.round(feed.scrollTop / h);
        const clamped = Math.max(0, Math.min(idx, clips.length - 1));
        if (clamped !== activeIndexRef.current) {
          activeIndexRef.current = clamped;
          setActiveIndex(clamped);
        }
        if (clamped >= clips.length - 2 && nextCursor) loadMore();
      });
    };

    feed.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      feed.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(scrollRafRef.current);
    };
  }, [clips.length, nextCursor, loadMore]);

  const visibleRange = useMemo(() => {
    const min = Math.max(0, activeIndex - SLIDE_WINDOW);
    const max = Math.min(clips.length - 1, activeIndex + SLIDE_WINDOW);
    return { min, max };
  }, [activeIndex, clips.length]);

  useEffect(() => {
    const next = clips[activeIndex + 1];
    if (!next?.videoUrl && !next?.thumbnailUrl) return;

    const href = next.videoUrl || next.thumbnailUrl;
    if (!href) return;

    if (!preloadLinkRef.current) {
      preloadLinkRef.current = document.createElement('link');
      preloadLinkRef.current.rel = 'prefetch';
      document.head.appendChild(preloadLinkRef.current);
    }
    preloadLinkRef.current.href = href;

    return () => {
      if (preloadLinkRef.current) preloadLinkRef.current.href = '';
    };
  }, [activeIndex, clips]);

  const dismissBetaNotice = useCallback(() => {
    persistBetaDismissed();
    setShowBetaNotice(false);
  }, []);

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
      <div className="cineclips-device">
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

          <span className="cineclips-header-label">Clips</span>

          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="cineclips-header-minimal-btn"
            aria-label={muted ? 'Ativar som' : 'Silenciar'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </header>

        {loading && clips.length === 0 ? (
          <div className="cineclips-state">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            <p>Carregando clips...</p>
          </div>
        ) : error ? (
          <div className="cineclips-state">
            <p className="cineclips-state-message">{error}</p>
            <button type="button" onClick={onBack} className="cineclips-secondary-btn">
              Voltar ao início
            </button>
          </div>
        ) : clips.length === 0 ? (
          <div className="cineclips-state">
            <h3 className="cineclips-state-title">Sem clips por aqui</h3>
            <p className="cineclips-state-message">
              Novos vídeos curtos entram no feed regularmente. Volte em breve ou explore o catálogo.
            </p>
            <button type="button" onClick={onBack} className="cineclips-primary-btn">
              Explorar catálogo
            </button>
          </div>
        ) : (
          <div ref={feedRef} className="cineclips-feed w-full h-full flex-1">
            {clips.map((clip, index) => {
              const isActive = index === activeIndex;
              const shouldLoad = index >= visibleRange.min && index <= visibleRange.max;

              return (
              <article key={clip.id} className="cineclips-slide">
                <div className="cineclips-slide-media">
                  <ClipPlayer
                    clip={clip}
                    isActive={isActive}
                    shouldLoad={shouldLoad}
                    muted={muted}
                    onDoubleTapHeart={(x, y) => handleDoubleTapHeart(clip, x, y)}
                    onSubscribe={() => onSubscribe?.(clip.criadorEmail)}
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

                  <div className="cineclips-rail cineclips-rail--text">
                    <ClipActionChip
                      variant="like"
                      count={clip.likes}
                      active={likedIds.has(clip.id)}
                      onClick={() => handleLike(clip)}
                    />
                    <ClipActionChip
                      variant="comment"
                      count={clip.commentsCount}
                      onClick={() => setCommentsClipId(clip.id)}
                    />
                    <ClipActionChip variant="share" onClick={() => handleShare(clip)} />
                  </div>
                </div>
              </article>
              );
            })}
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
        {showBetaNotice && <CineClipsBetaNotice onDismiss={dismissBetaNotice} />}
      </AnimatePresence>
    </div>
  );
}
