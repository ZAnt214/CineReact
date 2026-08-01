import React, { memo, useCallback } from 'react';
import { Play } from 'lucide-react';
import type { ReactVideo } from '../../types.ts';
import OptimizedImage from '../OptimizedImage.tsx';
import { CATALOG_EAGER_THUMBS } from '../../constants/catalog.ts';

interface PlaybackVideoShelfProps {
  title: string;
  videos: ReactVideo[];
  onSelect: (id: string) => void;
}

const PlaybackVideoCard = memo(function PlaybackVideoCard({
  video,
  index,
  onSelect,
}: {
  video: ReactVideo;
  index: number;
  onSelect: (id: string) => void;
}) {
  const handleClick = useCallback(() => onSelect(video.id), [onSelect, video.id]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex-shrink-0 w-[200px] sm:w-[240px] text-left snap-start group"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-950 border border-neutral-800/80 group-hover:border-cine-accent/30 transition-colors">
        <OptimizedImage
          src={video.thumbnailUrl}
          alt={video.titulo}
          loading={index < CATALOG_EAGER_THUMBS ? 'eager' : 'lazy'}
          fetchPriority={index < 2 ? 'high' : 'auto'}
          lite
          className="md:group-hover:scale-[1.03] md:transition-transform md:duration-300"
        />
        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded text-zinc-200">
          {video.duracao}
        </span>
        <div className="absolute inset-0 bg-black/40 opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
            <Play className="w-4 h-4 fill-black text-black ml-0.5" />
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs font-semibold text-zinc-200 line-clamp-2 leading-snug group-hover:text-cine-accent-light transition-colors">
        {video.titulo}
      </p>
      <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{video.canalNome}</p>
    </button>
  );
});

function PlaybackVideoShelf({ title, videos, onSelect }: PlaybackVideoShelfProps) {
  if (videos.length === 0) return null;

  return (
    <section className="pt-6 border-t border-neutral-900/80">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-white tracking-tight">{title}</h2>
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider shrink-0">
          {videos.length} {videos.length === 1 ? 'vídeo' : 'vídeos'}
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory min-w-0 -mx-1 px-1">
        {videos.map((video, index) => (
          <PlaybackVideoCard key={video.id} video={video} index={index} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

export default memo(PlaybackVideoShelf);
