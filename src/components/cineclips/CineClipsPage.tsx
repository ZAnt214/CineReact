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
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { CineClip, CineClipComment } from '../types/cineclips.ts';
import type { UserState } from '../types.ts';
import {
  clipAction,
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
  const videoId = clip.youtubeId || clip.id;
  const isHosted = !!clip.videoUrl;

  useEffect(() => {
    if (!isActive) return;
    clipAction(clip.id, 'view').catch(() => undefined);
  }, [isActive, clip.id]);

  useEffect(() => {
    const el = videoRef.current;
    if (!isHosted || !el) return;
    if (isActive) {
      el.currentTime = 0;
      el.play().catch(() => undefined);
    } else {
      el.pause();
    }
  }, [isActive, isHosted, clip.videoUrl]);

  return (
    <div className="absolute inset-0 bg-black">
      {isActive ? (
        isHosted ? (
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
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none" />
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
}) {
  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 pr-20 z-10 pointer-events-none">
        {clip.isTrending && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Flame className="w-3 h-3" />
            Em alta
          </div>
        )}
        <p className="text-white font-bold text-sm leading-snug line-clamp-2 drop-shadow-lg">{clip.titulo}</p>
        <p className="text-zinc-300 text-xs mt-1 font-semibold">@{clip.criadorNome}</p>
        {(clip.sourceType === 'tiktok' || clip.sourceType === 'instagram') && (
          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/10 text-zinc-300">
            Republicado no CineReact
          </span>
        )}
        {clip.descricao && (
          <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{clip.descricao}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-2 pointer-events-auto">
          {clip.hashtags.slice(0, 4).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onHashtag(tag)}
              className="text-cine-accent-light text-[11px] font-bold hover:underline cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
        <p className="text-zinc-500 text-[10px] mt-2">
          {clip.visualizacoes.toLocaleString('pt-BR')} views · {clip.duracao}
        </p>
      </div>

      <div className="absolute right-3 bottom-28 z-10 flex flex-col items-center gap-5">
        <ActionButton
          icon={Heart}
          label={clip.likes}
          active={liked}
          activeClass="text-red-500"
          onClick={onLike}
        />
        <ActionButton icon={MessageCircle} label={clip.commentsCount} onClick={onComment} />
        <ActionButton
          icon={Bookmark}
          label={clip.favorites}
          active={favorited}
          activeClass="text-cine-accent-light"
          onClick={onFavorite}
        />
        <ActionButton icon={Share2} label={clip.shares} onClick={onShare} />
        {user.isLoggedIn && (
          <ActionButton icon={UserPlus} label="" onClick={onFollow} />
        )}
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
}: {
  icon: React.ElementType;
  label: string | number;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 cursor-pointer group"
    >
      <div className={`${small ? 'w-9 h-9' : 'w-11 h-11'} rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors`}>
        <Icon className={`${small ? 'w-4 h-4' : 'w-5 h-5'} ${active ? activeClass || 'text-cine-accent-light' : 'text-white'}`} fill={active ? 'currentColor' : 'none'} />
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
      className="absolute inset-x-0 bottom-0 z-30 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800 rounded-t-2xl max-h-[70vh] flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <h3 className="text-sm font-bold text-white">Comentários</h3>
        <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-800 cursor-pointer">
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-cine-accent" /></div>
        ) : comments.length === 0 ? (
          <p className="text-center text-zinc-500 text-sm py-8">Seja o primeiro a comentar!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-cine-accent/20 flex items-center justify-center text-xs font-bold text-cine-accent-light shrink-0">
                {c.usuarioNome.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{c.usuarioNome}</p>
                <p className="text-sm text-zinc-300 mt-0.5">{c.texto}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {user.isLoggedIn ? (
        <div className="p-3 border-t border-neutral-800 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Adicione um comentário..."
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-cine-accent/50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="p-2.5 rounded-xl bg-cine-accent text-white disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <p className="p-4 text-center text-xs text-zinc-500 border-t border-neutral-800">Faça login para comentar</p>
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
    } catch { /* ignore */ }
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
    } catch { /* ignore */ }
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
    } catch { /* ignore */ }
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
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cine-accent-light" />
          <span className="text-sm font-black tracking-wide">
            <span className="text-white">CINE</span>
            <span className="text-cine-accent-light">CLIPS</span>
          </span>
        </div>
        <div className="w-16" />
      </div>

      {trending.length > 0 && activeIndex === 0 && (
        <div className="absolute top-14 left-0 right-0 z-40 px-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {trending.slice(0, 5).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  const idx = allClips.findIndex((c) => c.id === t.id);
                  if (idx >= 0) scrollToIndex(idx);
                }}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-400/25 text-orange-200 text-[10px] font-bold cursor-pointer"
              >
                <Flame className="w-3 h-3" />
                {t.titulo.slice(0, 24)}…
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && allClips.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-cine-accent" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
          <p className="text-zinc-400">{error}</p>
          <p className="text-zinc-500 text-sm">Nenhum clip disponível ainda. O admin pode adicionar pelo painel CineClips.</p>
        </div>
      ) : allClips.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
          <Zap className="w-12 h-12 text-cine-accent/40" />
          <h2 className="text-xl font-black text-white">CineClips</h2>
          <p className="text-zinc-400 text-sm">Reações curtas em breve. O painel admin já está pronto para importar os primeiros vídeos.</p>
        </div>
      ) : (
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
              />
            </section>
          ))}
        </div>
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
