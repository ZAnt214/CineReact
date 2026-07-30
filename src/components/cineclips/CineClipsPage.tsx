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
  Volume2,
  VolumeX,
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

function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (value >= 10_000) return `${Math.round(value / 1000)}K`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}K`;
  return String(value);
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

function ClipPlayer({
  clip,
  isActive,
  muted,
}: {
  clip: CineClip;
  isActive: boolean;
  muted: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
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
    if (isActive) {
      el.play().catch(() => setVideoFailed(true));
    } else {
      el.pause();
    }
  }, [isActive, isHosted, clip.videoUrl, videoFailed, muted]);

  const showHostedVideo = isHosted && !videoFailed;

  return (
    <div className="cineclips-slide-media">
      {isActive ? (
        showHostedVideo ? (
          <video
            ref={videoRef}
            src={clip.videoUrl}
            poster={clip.thumbnailUrl}
            className="cineclips-video"
            playsInline
            loop
            muted={muted}
            controls={false}
            onError={() => setVideoFailed(true)}
          />
        ) : isHosted ? (
          <img src={clip.thumbnailUrl} alt={clip.titulo} className="cineclips-video" />
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${videoId}`}
            title={clip.titulo}
            className="cineclips-video pointer-events-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        )
      ) : (
        <img src={clip.thumbnailUrl} alt={clip.titulo} className="cineclips-video cineclips-video--idle" />
      )}
      <div className="cineclips-slide-scrim" />
    </div>
  );
}

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
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className={`cineclips-action cineclips-action--${variant}${active ? ' is-active' : ''}`}
      aria-label={label}
    >
      <span className="cineclips-action-glow" aria-hidden />
      <span className="cineclips-action-icon">
        <Icon
          className={`w-[22px] h-[22px] ${spinning ? 'animate-spin' : ''}`}
          fill={active && variant === 'like' ? 'currentColor' : active && variant === 'favorite' ? 'currentColor' : 'none'}
        />
      </span>
      {label !== '' && <span className="cineclips-action-label">{label}</span>}
    </motion.button>
  );
}

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
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'tween', duration: 0.22 }}
      className="cineclips-sheet"
    >
      <div className="cineclips-sheet-handle" />
      <div className="cineclips-sheet-header">
        <h3>Comentários</h3>
        <button type="button" onClick={onClose} aria-label="Fechar">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="cineclips-sheet-body">
        {loading ? (
          <div className="cineclips-sheet-empty">
            <Loader2 className="w-5 h-5 animate-spin text-cine-accent" />
          </div>
        ) : comments.length === 0 ? (
          <p className="cineclips-sheet-empty">Seja o primeiro a comentar</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="cineclips-comment">
              <div className="cineclips-comment-avatar">{c.usuarioNome.charAt(0).toUpperCase()}</div>
              <div>
                <p className="cineclips-comment-name">{c.usuarioNome}</p>
                <p className="cineclips-comment-text">{c.texto}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {user.isLoggedIn ? (
        <div className="cineclips-sheet-input">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Comentar..."
          />
          <button type="button" onClick={handleSend} disabled={sending || !text.trim()}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <p className="cineclips-sheet-login">Faça login para comentar</p>
      )}
    </motion.div>
  );
}

export default function CineClipsPage({
  user,
  onBack,
  onOpenHashtag,
  onFollowCreator,
  initialClipId,
}: CineClipsPageProps) {
  const { clips, trending, loading, error, loadMore, nextCursor } = useCineClipsFeed(user.email);
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [commentsClipId, setCommentsClipId] = useState<string | null>(null);
  const [downloadingClipId, setDownloadingClipId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const slideHeightRef = useRef(0);
  const activeIndexRef = useRef(0);
  const watchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const scrollingRef = useRef(false);

  useBodyScrollLock(true);

  activeIndexRef.current = activeIndex;

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
    if (!user.isLoggedIn) return;
    const isLiked = likedIds.has(clip.id);
    try {
      await clipAction(clip.id, isLiked ? 'unlike' : 'like', { email: user.email });
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (isLiked) next.delete(clip.id);
        else next.add(clip.id);
        return next;
      });
    } catch {
      /* ignore */
    }
  };

  const handleFavorite = async (clip: CineClip) => {
    if (!user.isLoggedIn) return;
    const isFav = favIds.has(clip.id);
    try {
      await clipAction(clip.id, isFav ? 'unfavorite' : 'favorite', { email: user.email });
      setFavIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(clip.id);
        else next.add(clip.id);
        return next;
      });
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
        window.alert('Link copiado!');
      }
      await clipAction(clip.id, 'share', user.isLoggedIn ? { email: user.email } : {});
    } catch {
      /* ignore */
    }
  };

  const handleDownload = async (clip: CineClip) => {
    setDownloadingClipId(clip.id);
    try {
      await downloadClipVideo(clip.id);
    } catch (err: any) {
      window.alert(err.message || 'Não foi possível baixar o vídeo.');
    } finally {
      setDownloadingClipId(null);
    }
  };

  const handleReport = async (clip: CineClip) => {
    if (!user.isLoggedIn) return;
    const reason = window.prompt('Motivo: spam, inappropriate, copyright, misleading ou other');
    if (!reason) return;
    try {
      await reportClip(clip.id, user.email, user.nome, reason);
      window.alert('Denúncia enviada. Obrigado!');
    } catch {
      window.alert('Não foi possível enviar a denúncia.');
    }
  };

  const activeClip = clips[activeIndex];

  return (
    <div className="cineclips-shell">
      <header className="cineclips-header">
        <button type="button" onClick={onBack} className="cineclips-header-btn" aria-label="Voltar">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="cineclips-header-brand">
          <span className="cineclips-header-logo" aria-hidden>
            <Play className="w-3.5 h-3.5 fill-black text-black ml-0.5" />
          </span>
          <span className="cineclips-header-title">
            <span className="text-white">Cine</span>
            <span className="text-cine-accent">Clips</span>
          </span>
        </div>

        <div className="cineclips-header-actions">
          {trending.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTrending((v) => !v)}
              className={`cineclips-header-btn ${showTrending ? 'cineclips-header-btn--active' : ''}`}
              aria-label="Em alta"
            >
              <Flame className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="cineclips-header-btn"
            aria-label={muted ? 'Ativar som' : 'Silenciar'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {showTrending && trending.length > 0 && (
        <div className="cineclips-trending-bar">
          {trending.slice(0, 6).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                const idx = clips.findIndex((c) => c.id === t.id);
                if (idx >= 0) scrollToIndex(idx, true);
                setShowTrending(false);
              }}
              className="cineclips-trending-item"
            >
              {t.titulo}
            </button>
          ))}
        </div>
      )}

      {loading && clips.length === 0 ? (
        <div className="cineclips-state">
          <Loader2 className="w-7 h-7 animate-spin text-cine-accent" />
          <p>Carregando...</p>
        </div>
      ) : error ? (
        <div className="cineclips-state">
          <p>{error}</p>
          <button type="button" onClick={onBack} className="cineclips-cta">
            Voltar
          </button>
        </div>
      ) : clips.length === 0 ? (
        <div className="cineclips-state">
          <p className="text-lg font-bold text-white">Nenhum clip ainda</p>
          <p className="text-sm text-zinc-400">Em breve novos reacts por aqui.</p>
          <button type="button" onClick={onBack} className="cineclips-cta">
            Voltar ao início
          </button>
        </div>
      ) : (
        <div ref={feedRef} className="cineclips-feed">
          {clips.map((clip, index) => (
            <article key={clip.id} className="cineclips-slide" data-index={index}>
              <ClipPlayer clip={clip} isActive={index === activeIndex} muted={muted} />

              <div className="cineclips-slide-ui">
                <div className="cineclips-meta">
                  {clip.isTrending && (
                    <span className="cineclips-tag cineclips-tag--hot">
                      <Flame className="w-3 h-3" /> Em alta
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onFollowCreator?.(clip.criadorNome)}
                    className="cineclips-creator"
                  >
                    @{clip.criadorNome}
                  </button>
                  <h2 className="cineclips-title">{clip.titulo}</h2>
                  {clip.descricao && <p className="cineclips-desc">{clip.descricao}</p>}
                  {clip.hashtags.length > 0 && (
                    <div className="cineclips-tags">
                      {clip.hashtags.slice(0, 3).map((tag) => (
                        <button key={tag} type="button" onClick={() => onOpenHashtag?.(tag)}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="cineclips-stats">
                    {formatCount(clip.visualizacoes)} views · {clip.duracao}
                  </p>
                </div>

                <div className="cineclips-rail">
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
                    onClick={() => handleReport(clip)}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {clips.length > 1 && activeClip && (
        <div className="cineclips-progress" aria-hidden>
          {clips.slice(0, Math.min(clips.length, 12)).map((clip, i) => (
            <span key={clip.id} className={i === activeIndex ? 'is-active' : ''} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {commentsClipId && (
          <CommentsSheet
            clipId={commentsClipId}
            user={user}
            onClose={() => setCommentsClipId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
