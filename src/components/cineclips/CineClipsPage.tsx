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
  ChevronUp,
  Play,
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

function ClipPlayer({
  clip,
  isActive,
  onEnded,
}: {
  clip: CineClip;
  isActive: boolean;
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
    if (isActive) {
      el.currentTime = 0;
      el.play().catch(() => setVideoFailed(true));
    } else {
      el.pause();
    }
  }, [isActive, isHosted, clip.videoUrl, videoFailed]);

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
            muted={false}
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
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${videoId}`}
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
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none" />
    </div>
  );
}

function ClipOverlay({
  clip,
  user,
  liked,
  favorited,
  onLike,
  onFavorite,
  onShare,
  onComment,
  onFollow,
  onReport,
  onHashtag,
  onDownload,
  canDownload,
  isDownloading,
}: {
  clip: CineClip;
  user: UserState;
  liked: boolean;
  favorited: boolean;
  onLike: () => void;
  onFavorite: () => void;
  onShare: () => void;
  onComment: () => void;
  onFollow: () => void;
  onReport: () => void;
  onHashtag: (tag: string) => void;
  onDownload: () => void;
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
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 pr-20 z-10 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {clip.isTrending && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/30 text-[#FFD700] text-[10px] font-bold uppercase tracking-wider">
              <Flame className="w-3 h-3" />
              Em alta
            </span>
          )}
          {sourceLabel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-zinc-300 text-[9px] font-semibold uppercase tracking-wide">
              <Play className="w-2.5 h-2.5" />
              {sourceLabel}
            </span>
          )}
        </div>

        <p className="text-white font-bold text-base leading-snug line-clamp-2 drop-shadow-lg">{clip.titulo}</p>
        <button
          type="button"
          onClick={onFollow}
          className="mt-1.5 text-[#FFD700] text-sm font-bold pointer-events-auto hover:underline cursor-pointer"
        >
          @{clip.criadorNome}
        </button>

        {clip.descricao && (
          <p className="text-zinc-300 text-xs mt-2 line-clamp-2 leading-relaxed">{clip.descricao}</p>
        )}

        {clip.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5 pointer-events-auto">
            {clip.hashtags.slice(0, 5).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onHashtag(tag)}
                className="text-[#FFD700] text-[11px] font-bold hover:text-white transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <p className="text-zinc-500 text-[10px] mt-2.5 font-medium">
          {formatCount(clip.visualizacoes)} visualizações · {clip.duracao}
        </p>
      </div>

      <div className="absolute right-3 bottom-32 z-10 flex flex-col items-center gap-4">
        <ActionButton
          icon={Heart}
          label={formatCount(clip.likes)}
          active={liked}
          activeClass="text-red-500"
          onClick={onLike}
        />
        <ActionButton icon={MessageCircle} label={formatCount(clip.commentsCount)} onClick={onComment} />
        <ActionButton
          icon={Bookmark}
          label={formatCount(clip.favorites)}
          active={favorited}
          activeClass="text-[#FFD700]"
          onClick={onFavorite}
        />
        <ActionButton icon={Share2} label={formatCount(clip.shares)} onClick={onShare} />
        {canDownload && (
          <ActionButton
            icon={isDownloading ? Loader2 : Download}
            label={isDownloading ? '...' : 'Baixar'}
            onClick={onDownload}
            spinning={isDownloading}
          />
        )}
        {user.isLoggedIn && <ActionButton icon={UserPlus} label="" onClick={onFollow} />}
        <ActionButton icon={Flag} label="" onClick={onReport} small />
      </div>
    </>
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
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer group">
      <div className={`cineclips-action-btn ${small ? '!w-9 !h-9' : ''}`}>
        <Icon
          className={`${small ? 'w-4 h-4' : 'w-5 h-5'} ${spinning ? 'animate-spin' : ''} ${active ? activeClass || 'text-[#FFD700]' : 'text-white'}`}
          fill={active ? 'currentColor' : 'none'}
        />
      </div>
      {label !== '' && (
        <span className="text-[10px] font-bold text-white drop-shadow">{label}</span>
      )}
    </button>
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
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="absolute inset-x-0 bottom-0 z-30 bg-neutral-950/96 backdrop-blur-xl border-t border-[#FFD700]/15 rounded-t-3xl max-h-[72vh] flex flex-col"
    >
      <div className="flex items-center justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full bg-white/15" />
      </div>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <h3 className="text-sm font-bold text-white">Comentários</h3>
        <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 cursor-pointer">
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#FFD700]" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10">
            <MessageCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-500 text-sm">Seja o primeiro a comentar!</p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/25 flex items-center justify-center text-xs font-bold text-[#FFD700] shrink-0">
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
        <div className="p-3 border-t border-white/5 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Adicione um comentário..."
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[#FFD700]/40"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="p-2.5 rounded-2xl bg-[#FFD700] text-black disabled:opacity-40 cursor-pointer hover:brightness-105 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <p className="p-4 text-center text-xs text-zinc-500 border-t border-white/5">
          Faça login para comentar
        </p>
      )}
    </motion.div>
  );
}

function CineClipsHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 px-4 pt-3 pb-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/40 border border-white/10 text-white/90 hover:text-white hover:border-[#FFD700]/30 text-sm font-semibold cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="cineclips-brand-line" />
            <span className="text-[10px] font-bold tracking-[0.35em] text-[#FFD700]">CINEREACT</span>
            <span className="cineclips-brand-line" />
          </div>
          <p className="mt-1 text-lg font-black leading-none">
            <span className="text-[#FFD700]">CINE</span>
            <span className="text-white">CLIPS</span>
          </p>
        </div>

        <div className="w-[76px]" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-8 text-center">
      <div className="flex items-center gap-2">
        <span className="cineclips-brand-line w-8" />
        <span className="text-[10px] font-bold tracking-[0.3em] text-[#FFD700]">CINEREACT</span>
        <span className="cineclips-brand-line w-8" />
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-black text-[#FFD700] leading-none">MAIS</p>
        <p className="text-3xl font-black text-white leading-none">REACTS</p>
        <p className="text-3xl font-black text-[#FFD700] leading-none">ASSIM?</p>
      </div>
      <p className="text-zinc-400 text-sm max-w-xs leading-relaxed">
        Reações curtas chegando em breve. Enquanto isso, acompanhe o canal oficial.
      </p>
      <a
        href="https://bit.ly/CineReact"
        target="_blank"
        rel="noopener noreferrer"
        className="cineclips-pill hover:brightness-105 transition-all"
      >
        bit.ly/CineReact
      </a>
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
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [commentsClipId, setCommentsClipId] = useState<string | null>(null);
  const [downloadingClipId, setDownloadingClipId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const watchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const allClips = clips;

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const child = container.children[index] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    if (!initialClipId || allClips.length === 0) return;
    const idx = allClips.findIndex((c) => c.id === initialClipId);
    if (idx >= 0) scrollToIndex(idx);
  }, [initialClipId, allClips, scrollToIndex]);

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
              if (idx >= allClips.length - 3 && nextCursor) loadMore();
            }
          }
        }
      },
      { root: container, threshold: [0.6] }
    );

    Array.from(container.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [allClips.length, nextCursor, loadMore]);

  useEffect(() => {
    const clip = allClips[activeIndex];
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
  }, [activeIndex, allClips, user.email, user.isLoggedIn]);

  const handleLike = async (clip: CineClip) => {
    if (!user.isLoggedIn) return;
    const isLiked = likedIds.has(clip.id);
    const action = isLiked ? 'unlike' : 'like';
    try {
      await clipAction(clip.id, action, { email: user.email });
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
    const action = isFav ? 'unfavorite' : 'favorite';
    try {
      await clipAction(clip.id, action, { email: user.email });
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
      <CineClipsHeader onBack={onBack} />

      {trending.length > 0 && (
        <div className="absolute top-[4.5rem] left-0 right-0 z-40 px-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FFD700]/70 mb-2 px-1">
            Em alta agora
          </p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {trending.slice(0, 6).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  const idx = allClips.findIndex((c) => c.id === t.id);
                  if (idx >= 0) scrollToIndex(idx);
                }}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/25 text-[#FFD700] text-[10px] font-bold cursor-pointer hover:bg-[#FFD700]/18 transition-colors"
              >
                <Flame className="w-3 h-3" />
                <span className="max-w-[120px] truncate">{t.titulo}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && allClips.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
          <p className="text-zinc-500 text-sm">Carregando clips...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
          <p className="text-zinc-300">{error}</p>
          <p className="text-zinc-500 text-sm">
            Nenhum clip disponível ainda. O admin pode adicionar pelo painel CineClips.
          </p>
        </div>
      ) : allClips.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div
            ref={containerRef}
            className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
            style={{ scrollSnapType: 'y mandatory' }}
          >
            {allClips.map((clip, index) => (
              <section
                key={clip.id}
                data-index={index}
                className="relative h-full w-full snap-start snap-always shrink-0"
              >
                <ClipPlayer clip={clip} isActive={index === activeIndex} />
                <ClipOverlay
                  clip={clip}
                  user={user}
                  liked={likedIds.has(clip.id)}
                  favorited={favIds.has(clip.id)}
                  onLike={() => handleLike(clip)}
                  onFavorite={() => handleFavorite(clip)}
                  onShare={() => handleShare(clip)}
                  onComment={() => setCommentsClipId(clip.id)}
                  onFollow={() => onFollowCreator?.(clip.criadorNome)}
                  onReport={() => handleReport(clip)}
                  onHashtag={(tag) => onOpenHashtag?.(tag)}
                  onDownload={() => handleDownload(clip)}
                  canDownload={!!clip.videoUrl}
                  isDownloading={downloadingClipId === clip.id}
                />
              </section>
            ))}
          </div>

          {allClips.length > 1 && activeIndex < allClips.length - 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 pointer-events-none animate-bounce">
              <ChevronUp className="w-4 h-4 text-white/50 rotate-180" />
              <span className="text-[9px] font-semibold text-white/40 uppercase tracking-wider">Deslize</span>
            </div>
          )}

          {allClips.length > 1 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1">
              {allClips.slice(0, Math.min(allClips.length, 8)).map((clip, i) => (
                <button
                  key={clip.id}
                  type="button"
                  onClick={() => scrollToIndex(i)}
                  className={`w-1 rounded-full transition-all cursor-pointer ${
                    i === activeIndex ? 'h-5 bg-[#FFD700]' : 'h-1.5 bg-white/25 hover:bg-white/40'
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
