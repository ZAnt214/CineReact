import React, { memo } from 'react';
import { Play, Clock } from 'lucide-react';
import type { ReactVideo } from '../../types.ts';

export interface CreatorShowcaseFeaturedProps {
  videos: ReactVideo[];
  onPlay?: (reactId: string, obraId: string) => void;
}

const ShowcaseVideoCard = memo(function ShowcaseVideoCard({
  video,
  onPlay,
}: {
  video: ReactVideo;
  onPlay?: (reactId: string, obraId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPlay?.(video.id, video.obraId)}
      className="creator-showcase-video group text-left"
    >
      <div className="creator-showcase-video-thumb">
        <img
          src={video.thumbnailUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="creator-showcase-video-img"
        />
        <span className="creator-showcase-video-play" aria-hidden>
          <Play className="w-4 h-4 fill-current ml-0.5" />
        </span>
        <span className="creator-showcase-video-duration">
          <Clock className="w-3 h-3" />
          {video.duracao}
        </span>
      </div>
      <p className="creator-showcase-video-title">{video.titulo}</p>
    </button>
  );
});

export default function CreatorShowcaseFeatured({ videos, onPlay }: CreatorShowcaseFeaturedProps) {
  if (videos.length === 0) return null;

  return (
    <section className="creator-showcase-section" aria-labelledby="creator-showcase-featured-heading">
      <div className="creator-showcase-section-head">
        <h2 id="creator-showcase-featured-heading" className="creator-showcase-section-title">
          Destaques na plataforma
        </h2>
        <p className="creator-showcase-section-sub">Reacts em evidência do catálogo CineReact</p>
      </div>
      <div className="creator-showcase-video-grid">
        {videos.map((video) => (
          <ShowcaseVideoCard key={video.id} video={video} onPlay={onPlay} />
        ))}
      </div>
    </section>
  );
}
