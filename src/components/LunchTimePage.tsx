import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, UtensilsCrossed, Sparkles, Play, Shuffle, Clock, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReactVideo } from '../types.ts';
import OptimizedImage from './OptimizedImage.tsx';

interface LunchTimePageProps {
  reacts: ReactVideo[];
  onPlayVideo: (reactId: string, obraId: string) => void;
  onBackToHome: () => void;
  autoPlayOnMount?: boolean;
}

function getDurationSeconds(duracao: string): number {
  if (!duracao || duracao === '--:--') return 0;
  const parts = duracao.split(':').map((p) => parseInt(p, 10));
  if (parts.some((n) => isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

export function pickRandomLunchReact(reacts: ReactVideo[]): ReactVideo | null {
  if (reacts.length === 0) return null;

  const lunchPool = reacts.filter((r) => {
    if (!r.thumbnailUrl || !r.id) return false;
    const secs = getDurationSeconds(r.duracao);
    if (secs > 0 && secs < 180) return false;
    if (secs > 0 && secs > 3600) return false;
    return true;
  });

  const pool = lunchPool.length > 0 ? lunchPool : reacts;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function LunchTimePage({
  reacts,
  onPlayVideo,
  onBackToHome,
  autoPlayOnMount = true,
}: LunchTimePageProps) {
  const [picked, setPicked] = useState<ReactVideo | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const hasAutoPlayed = useRef(false);

  const hasVideos = reacts.length > 0;

  const drawRandom = useCallback(() => {
    if (!hasVideos) return null;
    setIsDrawing(true);
    setCountdown(null);
    const selected = pickRandomLunchReact(reacts);
    setPicked(selected);
    setTimeout(() => setIsDrawing(false), 900);
    return selected;
  }, [hasVideos, reacts]);

  const startPlayback = useCallback((react: ReactVideo) => {
    onPlayVideo(react.id, react.obraId);
  }, [onPlayVideo]);

  const handleSortearEAssistir = useCallback(() => {
    const selected = drawRandom();
    if (!selected) return;
    setCountdown(3);
  }, [drawRandom]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      if (picked) startPlayback(picked);
      setCountdown(null);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 700);
    return () => clearTimeout(timer);
  }, [countdown, picked, startPlayback]);

  useEffect(() => {
    if (!autoPlayOnMount || hasAutoPlayed.current || !hasVideos) return;
    hasAutoPlayed.current = true;
    const selected = pickRandomLunchReact(reacts);
    setPicked(selected);
    if (selected) {
      setCountdown(3);
    }
  }, [autoPlayOnMount, hasVideos, reacts]);

  const subtitle = useMemo(() => {
    if (!hasVideos) return 'Nenhum vídeo disponível no catálogo ainda.';
    if (isDrawing) return 'Sorteando o react perfeito para o seu almoço...';
    if (countdown !== null) return `Começando em ${countdown}...`;
    if (picked) return 'Pronto! Aproveite a refeição com este react.';
    return 'Clique para o CineReact escolher um vídeo aleatório para você.';
  }, [hasVideos, isDrawing, countdown, picked]);

  return (
    <div className="cine-container pt-24 pb-28 min-h-screen w-full flex flex-col">
      <button
        onClick={onBackToHome}
        className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/40 text-xs font-black uppercase tracking-wider transition-all mb-8 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition-transform" />
        Voltar ao Início
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-950 p-8 sm:p-10 shadow-[0_20px_60px_rgba(245,158,11,0.12)]"
        >
          <motion.div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <motion.div className="absolute -bottom-20 -left-16 w-56 h-56 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-5">
            <motion.div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <UtensilsCrossed className="w-8 h-8 text-black" />
            </motion.div>

            <motion.div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 mb-2">Categoria Especial</p>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Hora do Almoço</h1>
              <p className="text-sm text-zinc-400 mt-3 leading-relaxed">{subtitle}</p>
            </motion.div>

            <AnimatePresence mode="wait">
              {picked && !isDrawing && (
                <motion.div
                  key={picked.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-md text-left bg-zinc-950/80 border border-zinc-800 rounded-2xl overflow-hidden"
                >
                  <div className="relative aspect-video">
                    <OptimizedImage
                      src={picked.thumbnailUrl}
                      alt={picked.titulo}
                      className="w-full h-full object-cover"
                    />
                    {countdown !== null && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-5xl font-black text-amber-400 tabular-nums">{countdown}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-sm font-bold text-white line-clamp-2">{picked.titulo}</p>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono">
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-amber-400" />{picked.visualizacoes?.toLocaleString('pt-BR') || 0}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" />{picked.duracao || '—'}</span>
                      <span>{picked.canalNome}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {isDrawing && (
                <motion.div
                  key="drawing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-10 flex flex-col items-center gap-3"
                >
                  <Shuffle className="w-10 h-10 text-amber-400 animate-spin" />
                  <p className="text-xs text-amber-300 font-bold uppercase tracking-wider">Sorteando...</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2">
              <button
                onClick={handleSortearEAssistir}
                disabled={!hasVideos || isDrawing || countdown !== null}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-sm hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-amber-500/25"
              >
                <Sparkles className="w-4 h-4" />
                {picked ? 'Sortear Outro' : 'Sortear React'}
              </button>
              {picked && countdown === null && (
                <button
                  onClick={() => startPlayback(picked)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-bold text-sm hover:border-amber-500/50 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 text-amber-400" />
                  Assistir Agora
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
