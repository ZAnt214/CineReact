import React, { useEffect, useState } from 'react';
import { ArrowLeft, Hash, Loader2, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import type { CineClip } from '../../types/cineclips.ts';
import { fetchHashtagClips } from '../../hooks/useCineClips.ts';
import OptimizedImage from '../OptimizedImage.tsx';

interface CineClipsHashtagPageProps {
  hashtag: string;
  onBack: () => void;
  onSelectClip: (clipId: string) => void;
}

export default function CineClipsHashtagPage({ hashtag, onBack, onSelectClip }: CineClipsHashtagPageProps) {
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full flex-1 min-h-screen bg-cine-bg"
    >
      <div className="cine-container pt-24 pb-20">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao CineClips
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-cine-accent/15 border border-cine-accent/25 flex items-center justify-center">
            <Hash className="w-6 h-6 text-cine-accent-light" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-cine-accent/80 flex items-center gap-1">
              <Zap className="w-3 h-3" /> CineClips
            </p>
            <h1 className="text-2xl font-black text-white">{tag}</h1>
            <p className="text-sm text-zinc-500">{clips.length} vídeo{clips.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cine-accent" />
          </div>
        ) : clips.length === 0 ? (
          <p className="text-center text-zinc-500 py-20">Nenhum clip com esta hashtag ainda.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {clips.map((clip) => (
              <button
                key={clip.id}
                type="button"
                onClick={() => onSelectClip(clip.id)}
                className="group relative aspect-[9/16] rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 cursor-pointer"
              >
                <OptimizedImage
                  src={clip.thumbnailUrl}
                  alt={clip.titulo}
                  containerClassName="absolute inset-0"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-xs font-bold text-white line-clamp-2">{clip.titulo}</p>
                  <p className="text-[10px] text-zinc-400 mt-1">{clip.visualizacoes.toLocaleString('pt-BR')} views</p>
                </div>
                {clip.isTrending && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-orange-500/80 text-[9px] font-bold text-white uppercase">
                    Em alta
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
