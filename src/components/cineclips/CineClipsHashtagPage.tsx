import React, { useEffect, useState } from 'react';
import { ArrowLeft, Hash, Loader2, Play, Flame } from 'lucide-react';
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full flex-1 min-h-screen bg-zinc-950 text-white"
    >
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-20">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-cyan-400 transition-colors mb-6 cursor-pointer bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao CineClips
        </button>

        <div className="flex items-center gap-4 mb-8 bg-gradient-to-r from-zinc-900 to-zinc-950 border border-white/10 p-5 rounded-2xl shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center shadow-lg">
            <Hash className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400/90">
              Hashtag Feed
            </p>
            <h1 className="text-2xl font-black text-white">{tag}</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {clips.length} {clips.length === 1 ? 'vídeo encontrado' : 'vídeos encontrados'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-xs font-medium">Carregando clips da tag...</p>
          </div>
        ) : clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 gap-2">
            <Hash className="w-12 h-12 text-zinc-700 stroke-1" />
            <p className="text-sm font-semibold">Nenhum clip com esta hashtag ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {clips.map((clip) => (
              <motion.button
                key={clip.id}
                type="button"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectClip(clip.id)}
                className="group relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 cursor-pointer text-left shadow-lg"
              >
                <OptimizedImage
                  src={clip.thumbnailUrl}
                  alt={clip.titulo}
                  containerClassName="absolute inset-0"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Hover Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-11 h-11 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Top Badges */}
                {clip.isTrending && (
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-rose-500/90 text-[9px] font-extrabold text-white uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                    Em alta
                  </span>
                )}

                {/* Bottom Meta */}
                <div className="absolute bottom-0 left-0 right-0 p-3.5 space-y-1">
                  <p className="text-xs font-bold text-white line-clamp-2 leading-tight">
                    {clip.titulo}
                  </p>
                  <p className="text-[10px] font-semibold text-cyan-300/80">
                    @{clip.criadorNome}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
