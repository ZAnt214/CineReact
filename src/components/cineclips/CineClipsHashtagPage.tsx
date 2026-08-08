import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { CineClip } from '../../types/cineclips.ts';
import { fetchHashtagClips } from '../../hooks/useCineClips.ts';
import OptimizedImage from '../OptimizedImage.tsx';

interface CineClipsHashtagPageProps {
  hashtag: string;
  onBack: () => void;
  onSelectClip: (clipId: string) => void;
}

export default function CineClipsHashtagPage({
  hashtag,
  onBack,
  onSelectClip,
}: CineClipsHashtagPageProps) {
  const [clips, setClips] = useState<CineClip[]>([]);
  const [loading, setLoading] = useState(true);
  const tag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;

  useEffect(() => {
    fetchHashtagClips(tag)
      .then((data) => setClips(data.clips || []))
      .finally(() => setLoading(false));
  }, [tag]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="cineclips-hashtag-page w-full flex-1"
    >
      <div className="cineclips-hashtag-inner">
        <button type="button" onClick={onBack} className="cineclips-hashtag-back">
          <ArrowLeft className="w-4 h-4" />
          Voltar aos clips
        </button>

        <header className="cineclips-hashtag-hero">
          <p className="cineclips-hashtag-eyebrow">Hashtag</p>
          <h1 className="cineclips-hashtag-title">{tag}</h1>
          <p className="cineclips-hashtag-meta">
            {clips.length} {clips.length === 1 ? 'vídeo' : 'vídeos'}
          </p>
        </header>

        {loading ? (
          <div className="cineclips-sheet-empty py-16">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            <span>Carregando...</span>
          </div>
        ) : clips.length === 0 ? (
          <div className="cineclips-sheet-empty py-16">
            <p className="text-sm font-medium text-zinc-300">Nenhum clip com esta hashtag</p>
            <p className="text-xs text-zinc-500">Tente outra tag ou volte ao feed principal.</p>
          </div>
        ) : (
          <div className="cineclips-hashtag-grid">
            {clips.map((clip) => (
              <button
                key={clip.id}
                type="button"
                onClick={() => onSelectClip(clip.id)}
                className="cineclips-hashtag-card"
              >
                <OptimizedImage
                  src={clip.thumbnailUrl}
                  alt={clip.titulo}
                  containerClassName="absolute inset-0"
                  className="object-cover"
                />
                <div className="cineclips-hashtag-card-scrim" aria-hidden />
                {clip.isTrending && (
                  <span className="cineclips-hashtag-trending">Em alta</span>
                )}
                <div className="cineclips-hashtag-card-body">
                  <p className="cineclips-hashtag-card-title">{clip.titulo}</p>
                  <p className="cineclips-hashtag-card-creator">@{clip.criadorNome}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
