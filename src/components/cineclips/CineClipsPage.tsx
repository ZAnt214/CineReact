import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  UserPlus,
  Flag,
  Flame,
  X,
  Send,
  Loader2,
  Download,
  ChevronDown,
  Play,
  Volume2,
  VolumeX,
  Home,
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

function CineReactMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const icon = size === 'sm' ? 'w-7 h-7 rounded-xl' : 'w-9 h-9 rounded-2xl';
  const play = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const text = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${icon} bg-cine-accent flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.35)] shrink-0`}>
        <Play className={`${play} text-black fill-black ml-0.5`} />
      </div>
      <div className={`font-display font-extrabold ${text} leading-none tracking-tight`}>
        <span className="text-white">Cine</span>
        <span className="text-cine-accent">React</span>
      </div>
    </div>
  );
}

function ClipPlayer({
  clip,
  isActive,
  muted,
  onEnded,
}: {
  clip: CineClip;
  isActive: boolean;
  muted: boolean;
  onEnded?: () => void;
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
      el.currentTime = 0;
      el.play().catch(() => setVideoFailed(true));
    } else {
      el.pause();
    }
  }, [isActive, isHosted, clip.videoUrl, videoFailed, muted]);

  const showHostedVideo = isHosted && !videoFailed;

  return (
    <div className="absolute inset-0 bg-black">
      {isActive ? (
        showHostedVideo ? (
          <video
            ref={videoRef}
            src={clip.videoUrl}
            poster={clip.thumbnailUrl}
            className="absolute inset-0 w-full h-full object-contain bg-black"
            playsInline
            loop
            muted={muted}
            controls={false}
            onEnded={onEnded}
            onError={() => setVideoFailed(true)}
          />
        ) : isHosted ? (
          <img
            src={clip.thumbnailUrl}
            alt={clip.titulo}
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${videoId}`}
            title={clip.titulo}
            className="absolute inset-0 w-full h-full pointer-events-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )
      ) : (
        <img
          src={clip.thumbnailUrl}
          alt={clip.titulo}
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/90 pointer-events-none" />
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  active,
  activeClass = '',
  small,
  spinning,
}: {
  icon: React.ElementType;
  label: string | number;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
  small?: boolean;
  spinning?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={typeof label === 'string' ? label : undefined}
      className="flex flex-col items-center gap-1.5 cursor-pointer group"
    >
      <div className={`cineclips-action-btn ${small ? '!w-10 !h-10' : ''}`}>
        <Icon
          className={`${small ? 'w-4 h-4' : 'w-[22px] h-[22px]'} ${spinning ? 'animate-spin' : ''} ${active ? activeClass || 'text-cine-accent' : 'text-white'}`}
          fill={active ? 'currentColor' : 'none'}
        />
      </div>
      {label !== '' && (
        <span className="text-[10px] font-semibold text-white/90 drop-shadow-sm">{label}</span>
      )}
    </button>
  );
}

function ClipOverlay({
  clip,
  user,
  liked,
  favorited,
  muted,
  onLike,
  onFavorite,
  onShare,
  onComment,
  onFollow,
  onReport,
  onHashtag,
  onDownload,
  onToggleMute,
  canDownload,
  isDownloading,
}: {
  clip: CineClip;
  user: UserState;
  liked: boolean;
  favorited: boolean;
  muted: boolean;
  onLike: () => void;
  onFavorite: () => void;
  onShare: () => void;
  onComment: () => void;
  onFollow: () => void;
  onReport: () => void;
  onHashtag: (tag: string) => void;
  onDownload: () => void;
  onToggleMute: () => void;
  canDownload: boolean;
  isDownloading: boolean;
}) {
  const sourceLabel =
    clip.sourceType === 'tiktok'
      ? 'TikTok'
      : clip.sourceType === 'instagram'
        ? 'Instagram'
        : clip.sourceType === 'youtube'
          ? 'YouTube'
          : null;

  return (
    <>
      <div className="absolute top-24 left-4 z-10 pointer-events-auto">
        <button
          type="button"
          onClick={onToggleMute}
          className="cineclips-chip-btn"
          aria-label={muted ? 'Ativar som' : 'Silenciar'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-6 pr-[4.5rem] pointer-events-none">
        <div className="cineclips-info-card pointer-events-auto">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {clip.isTrending && (
              <span className="cineclips-badge cineclips-badge--hot">
                <Flame className="w-3 h-3" />
                Em alta
              </span>
            )}
            {sourceLabel && (
              <span className="cineclips-badge">
                <Play className="w-2.5 h-2.5" />
                {sourceLabel}
              </span>
            )}
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={onFollow}
                className="text-cine-accent text-sm font-bold hover:text-cine-accent-light transition-colors cursor-pointer"
              >
                @{clip.criadorNome}
              </button>
              <h2 className="text-white font-bold text-[15px] leading-snug mt-1 line-clamp-2">
                {clip.titulo}
              </h2>
              {clip.descricao && (
                <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">{clip.descricao}</p>
              )}
            </div>
            {user.isLoggedIn && (
              <button
                type="button"
                onClick={onFollow}
                className="shrink-0 px-3 py-1.5 rounded-full bg-cine-accent/15 border border-cine-accent/30 text-cine-accent text-[11px] font-bold hover:bg-cine-accent hover:text-black transition-all cursor-pointer"
              >
                Seguir
              </button>
            )}
          </div>

          {clip.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {clip.hashtags.slice(0, 4).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onHashtag(tag)}
                  className="text-cine-accent-light text-[11px] font-semibold hover:text-white transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          <p className="text-zinc-500 text-[10px] mt-3 font-medium">
            {formatCount(clip.visualizacoes)} views · {clip.duracao}
          </p>
        </div>
      </div>

      <div className="absolute right-3 bottom-36 z-10 flex flex-col items-center gap-5">
        <ActionButton icon={Heart} label={formatCount(clip.likes)} active={liked} activeClass="text-red-500" onClick={onLike} />
        <ActionButton icon={MessageCircle} label={formatCount(clip.commentsCount)} onClick={onComment} />
        <ActionButton icon={Bookmark} label={formatCount(clip.favorites)} active={favorited} activeClass="text-cine-accent" onClick={onFavorite} />
        <ActionButton icon={Share2} label="Share" onClick={onShare} />
        {canDownload && (
          <ActionButton
            icon={isDownloading ? Loader2 : Download}
            label={isDownloading ? '...' : 'Baixar'}
            onClick={onDownload}
            spinning={isDownloading}
          />
        )}
        {user.isLoggedIn && <ActionButton icon={UserPlus} label="Seguir" onClick={onFollow} />}
        <ActionButton icon={Flag} label="" onClick={onReport} small />
      </div>
    </>
  );
}

function CommentsPanel({
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
      transition={{ type: 'spring', damping: 30, stiffness: 340 }}
      className="absolute inset-x-0 bottom-0 z-40 bg-[#0a0a0c]/97 backdrop-blur-2xl border-t border-white/8 rounded-t-[1.75rem] max-h-[75vh] flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-white/15" />
      </div>
      <div className="flex items-center justify-between px-5 py-2 border-b border-white/5">
        <h3 className="text-sm font-bold text-white">Comentários</h3>
        <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-cine-accent" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-9 h-9 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Nenhum comentário ainda</p>
            <p className="text-zinc-600 text-xs mt-1">Seja o primeiro a comentar</p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-cine-accent/12 border border-cine-accent/25 flex items-center justify-center text-xs font-bold text-cine-accent shrink-0">
                {c.usuarioNome.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">{c.usuarioNome}</p>
                <p className="text-sm text-zinc-300 mt-0.5 leading-relaxed">{c.texto}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {user.isLoggedIn ? (
        <div className="p-4 border-t border-white/5 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escreva um comentário..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-cine-accent/40 transition-colors"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="px-4 rounded-2xl bg-cine-accent text-black font-bold disabled:opacity-40 cursor-pointer hover:brightness-110 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <p className="p-5 text-center text-xs text-zinc-500 border-t border-white/5">Faça login para comentar</p>
      )}
    </motion.div>
  );
}

function EmptyState({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center">
      <CineReactMark size="md" />
      <div className="space-y-2 max-w-xs">
        <h2 className="text-xl font-bold text-white">Nenhum clip ainda</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Reações curtas em breve. Enquanto isso, explore o restante do CineReact.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button type="button" onClick={onBack} className="cineclips-primary-btn flex-1 justify-center">
          <Home className="w-4 h-4" />
          Voltar ao início
        </button>
        <a
          href="https://bit.ly/CineReact"
          target="_blank"
          rel="noopener noreferrer"
          className="cineclips-secondary-btn flex-1 justify-center"
        >
          bit.ly/CineReact
        </a>
      </div>
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
  const { clips, trending, loading, error, loadMore, nextCursor } = useCineClipsFeed(user.email);
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedTab, setFeedTab] = useState<'para-voce' | 'em-alta'>('para-voce');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [commentsClipId, setCommentsClipId] = useState<string | null>(null);
  const [downloadingClipId, setDownloadingClipId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const watchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const displayClips =
    feedTab === 'em-alta' && trending.length > 0
      ? [...trending, ...clips.filter((c) => !trending.some((t) => t.id === c.id))]
      : clips;

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const child = container.children[index] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    if (!initialClipId || displayClips.length === 0) return;
    const idx = displayClips.findIndex((c) => c.id === initialClipId);
    if (idx >= 0) scrollToIndex(idx);
  }, [initialClipId, displayClips, scrollToIndex]);

  useEffect(() => {
    setActiveIndex(0);
    containerRef.current?.scrollTo({ top: 0 });
  }, [feedTab]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) {
              setActiveIndex(idx);
              if (idx >= displayClips.length - 3 && nextCursor) loadMore();
            }
          }
        }
      },
      { root: container, threshold: [0.6] }
    );

    Array.from(container.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [displayClips.length, nextCursor, loadMore]);

  useEffect(() => {
    const clip = displayClips[activeIndex];
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
  }, [activeIndex, displayClips, user.email, user.isLoggedIn]);

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

  return (
    <div className="fixed inset-0 z-40 bg-black cineclips-page">
      <header className="absolute top-0 inset-x-0 z-50 px-4 pt-3 pb-2 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="cineclips-nav-btn" aria-label="Voltar">
            <ArrowLeft className="w-4 h-4" />
          </button>

          <CineReactMark size="sm" />

          {displayClips.length > 0 ? (
            <span className="cineclips-counter">
              {activeIndex + 1}/{displayClips.length}
            </span>
          ) : (
            <div className="w-12" />
          )}
        </div>

        <nav className="flex items-center justify-center gap-2 mt-3" aria-label="Feed">
          {(['para-voce', 'em-alta'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFeedTab(tab)}
              className={`cineclips-tab ${feedTab === tab ? 'cineclips-tab--active' : ''}`}
            >
              {tab === 'para-voce' ? 'Para você' : 'Em alta'}
            </button>
          ))}
        </nav>
      </header>

      {trending.length > 0 && feedTab === 'para-voce' && (
        <div className="absolute top-[7.25rem] left-0 right-0 z-40 px-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {trending.slice(0, 8).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  const idx = displayClips.findIndex((c) => c.id === t.id);
                  if (idx >= 0) scrollToIndex(idx);
                }}
                className="cineclips-trend-chip shrink-0"
              >
                <Flame className="w-3 h-3 text-cine-accent" />
                <span className="max-w-[110px] truncate">{t.titulo}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && displayClips.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cine-accent" />
          <p className="text-zinc-500 text-sm">Carregando clips...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
          <p className="text-zinc-300">{error}</p>
          <button type="button" onClick={onBack} className="cineclips-primary-btn">
            Voltar ao início
          </button>
        </div>
      ) : displayClips.length === 0 ? (
        <EmptyState onBack={onBack} />
      ) : (
        <>
          <div
            ref={containerRef}
            className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
            style={{ scrollSnapType: 'y mandatory' }}
          >
            {displayClips.map((clip, index) => (
              <section
                key={clip.id}
                data-index={index}
                className="relative h-full w-full snap-start snap-always shrink-0"
              >
                <ClipPlayer clip={clip} isActive={index === activeIndex} muted={muted} />
                <ClipOverlay
                  clip={clip}
                  user={user}
                  liked={likedIds.has(clip.id)}
                  favorited={favIds.has(clip.id)}
                  muted={muted}
                  onLike={() => handleLike(clip)}
                  onFavorite={() => handleFavorite(clip)}
                  onShare={() => handleShare(clip)}
                  onComment={() => setCommentsClipId(clip.id)}
                  onFollow={() => onFollowCreator?.(clip.criadorNome)}
                  onReport={() => handleReport(clip)}
                  onHashtag={(tag) => onOpenHashtag?.(tag)}
                  onDownload={() => handleDownload(clip)}
                  onToggleMute={() => setMuted((m) => !m)}
                  canDownload={!!clip.videoUrl}
                  isDownloading={downloadingClipId === clip.id}
                />
              </section>
            ))}
          </div>

          {displayClips.length > 1 && activeIndex < displayClips.length - 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 pointer-events-none opacity-60">
              <ChevronDown className="w-5 h-5 text-white animate-bounce" />
              <span className="text-[9px] font-medium text-white/70 uppercase tracking-widest">Deslize</span>
            </div>
          )}

          {displayClips.length > 1 && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5">
              {displayClips.slice(0, Math.min(displayClips.length, 10)).map((clip, i) => (
                <button
                  key={clip.id}
                  type="button"
                  onClick={() => scrollToIndex(i)}
                  className={`rounded-full transition-all cursor-pointer ${
                    i === activeIndex ? 'w-1 h-6 bg-cine-accent shadow-[0_0_8px_rgba(0,229,255,0.6)]' : 'w-1 h-2 bg-white/25 hover:bg-white/50'
                  }`}
                  aria-label={`Clip ${i + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {commentsClipId && (
          <CommentsPanel
            clipId={commentsClipId}
            user={user}
            onClose={() => setCommentsClipId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
