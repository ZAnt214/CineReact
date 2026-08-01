import React, { memo } from 'react';
import {
  Check,
  Clock,
  ExternalLink,
  Eye,
  Film,
  Heart,
  Share2,
  ThumbsUp,
  User,
} from 'lucide-react';
import type { Obra, ReactVideo } from '../../types.ts';

interface PlaybackMetaPanelProps {
  react: ReactVideo;
  obra?: Obra;
  channelPoster?: string;
  avatarError: boolean;
  isChannelVerified: boolean;
  isFollowing: boolean;
  videoLiked: boolean;
  isFavorited: boolean;
  videoLikesCount: number;
  shareFeedback: boolean;
  onAvatarError: () => void;
  onGoToChannel: () => void;
  onToggleFollow: () => void;
  onToggleLike: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  onGoToObra?: (obraId: string) => void;
  formatViews: (n: number) => string;
  formatDate: (dateStr?: string) => string;
}

function PlaybackMetaPanel({
  react,
  obra,
  channelPoster,
  avatarError,
  isChannelVerified,
  isFollowing,
  videoLiked,
  isFavorited,
  videoLikesCount,
  shareFeedback,
  onAvatarError,
  onGoToChannel,
  onToggleFollow,
  onToggleLike,
  onToggleFavorite,
  onShare,
  onGoToObra,
  formatViews,
  formatDate,
}: PlaybackMetaPanelProps) {
  const hasPoster = Boolean(channelPoster);

  return (
    <section className="space-y-4 pt-1">
      {/* Criador */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onGoToChannel}
          className="w-11 h-11 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700/50 overflow-hidden shrink-0"
        >
          {hasPoster && !avatarError ? (
            <img
              src={channelPoster}
              alt={react.canalNome}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={onAvatarError}
            />
          ) : (
            <User className="w-5 h-5 text-zinc-400" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <button
              type="button"
              onClick={onGoToChannel}
              className="font-semibold text-white text-sm hover:text-cine-accent-light transition-colors truncate max-w-full"
            >
              {react.canalNome}
            </button>
            {isChannelVerified && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wider text-cine-accent-light font-semibold"
                title="Criador verificado"
              >
                <Check className="w-3 h-3" />
                Verificado
              </span>
            )}
            <button
              type="button"
              onClick={onToggleFollow}
              className={`ml-auto sm:ml-0 px-3.5 py-1 rounded-full text-[11px] font-semibold transition-colors shrink-0 ${
                isFollowing
                  ? 'text-zinc-400 border border-neutral-800 hover:text-white'
                  : 'bg-cine-accent text-white hover:bg-cine-accent-dark'
              }`}
            >
              {isFollowing ? 'Inscrito' : 'Seguir'}
            </button>
          </div>

          {/* Stats em linha */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Eye className="w-3 h-3 shrink-0" />
              {formatViews(react.visualizacoes)} views
            </span>
            <span className="text-zinc-700" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="w-3 h-3 shrink-0" />
              {formatViews(videoLikesCount)} curtidas
            </span>
            <span className="text-zinc-700" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 shrink-0" />
              {react.duracao || '—'}
            </span>
            {react.publicadoEm && (
              <>
                <span className="text-zinc-700" aria-hidden>
                  ·
                </span>
                <span>{formatDate(react.publicadoEm)}</span>
              </>
            )}
          </div>

          {obra && obra.tipo !== 'canal' && onGoToObra && (
            <button
              type="button"
              onClick={() => onGoToObra(obra.id)}
              className="inline-flex items-center gap-1 mt-2 text-[11px] text-zinc-500 hover:text-cine-accent-light transition-colors"
            >
              <Film className="w-3 h-3 shrink-0" />
              <span className="truncate">{obra.titulo}</span>
            </button>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1.5 flex-wrap border-t border-neutral-900/80 pt-3">
        <button
          type="button"
          onClick={onToggleLike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            videoLiked ? 'text-cine-accent-light bg-cine-accent/10' : 'text-zinc-400 hover:text-white hover:bg-neutral-900/60'
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${videoLiked ? 'fill-cine-accent-light' : ''}`} />
          Curtir
        </button>

        <button
          type="button"
          onClick={onToggleFavorite}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            isFavorited ? 'text-cine-accent-light bg-cine-accent/10' : 'text-zinc-400 hover:text-white hover:bg-neutral-900/60'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-cine-accent-light' : ''}`} />
          {isFavorited ? 'Salvo' : 'Salvar'}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-neutral-900/60 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar
          </button>
          {shareFeedback && (
            <span className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-neutral-900 text-white border border-neutral-800 text-[10px] py-1 px-2 rounded whitespace-nowrap flex items-center gap-1 z-50">
              <Check className="w-3 h-3 text-cine-accent-light" />
              Copiado
            </span>
          )}
        </div>

        <a
          href={`https://www.youtube.com/watch?v=${react.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-cine-accent-light hover:bg-neutral-900/60 transition-colors ml-auto"
        >
          <ExternalLink className="w-4 h-4" />
          YouTube
        </a>
      </div>
    </section>
  );
}

export default memo(PlaybackMetaPanel);
