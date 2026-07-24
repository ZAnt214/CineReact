import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, UtensilsCrossed, Sparkles, Play, Shuffle, Clock, Eye, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReactVideo } from '../types.ts';
import OptimizedImage from './OptimizedImage.tsx';

const COUNTDOWN_SECONDS = 8;
const DRAWING_MS = 1800;

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

function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds / total;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="url(#countdownGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="countdownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      <motion.span
        key={seconds}
        initial={{ scale: 1.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute text-6xl font-black text-white tabular-nums drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]"
      >
        {seconds}
      </motion.span>
    </div>
  );
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
  const [shufflePreview, setShufflePreview] = useState<ReactVideo | null>(null);
  const hasAutoPlayed = useRef(false);

  const hasVideos = reacts.length > 0;

  const drawRandom = useCallback(() => {
    if (!hasVideos) return null;
    setIsDrawing(true);
    setCountdown(null);
    setShufflePreview(null);

    const shuffleInterval = setInterval(() => {
      setShufflePreview(pickRandomLunchReact(reacts));
    }, 120);

    const selected = pickRandomLunchReact(reacts);
    setTimeout(() => {
      clearInterval(shuffleInterval);
      setPicked(selected);
      setShufflePreview(null);
      setIsDrawing(false);
    }, DRAWING_MS);

    return selected;
  }, [hasVideos, reacts]);

  const startPlayback = useCallback((react: ReactVideo) => {
    setCountdown(null);
    onPlayVideo(react.id, react.obraId);
  }, [onPlayVideo]);

  const handleSortearEAssistir = useCallback(() => {
    drawRandom();
    setTimeout(() => setCountdown(COUNTDOWN_SECONDS), DRAWING_MS + 200);
  }, [drawRandom]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      if (picked) startPlayback(picked);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, picked, startPlayback]);

  useEffect(() => {
    if (!autoPlayOnMount || hasAutoPlayed.current || !hasVideos) return;
    hasAutoPlayed.current = true;
    setIsDrawing(true);
    const shuffleInterval = setInterval(() => {
      setShufflePreview(pickRandomLunchReact(reacts));
    }, 120);
    const selected = pickRandomLunchReact(reacts);
    setTimeout(() => {
      clearInterval(shuffleInterval);
      setPicked(selected);
      setShufflePreview(null);
      setIsDrawing(false);
      if (selected) setCountdown(COUNTDOWN_SECONDS);
    }, DRAWING_MS);
  }, [autoPlayOnMount, hasVideos, reacts]);

  const subtitle = useMemo(() => {
    if (!hasVideos) return 'Nenhum vídeo disponível no catálogo ainda.';
    if (isDrawing) return 'Girando a roleta do almoço...';
    if (countdown !== null) return `Preparando seu react em ${countdown} segundo${countdown !== 1 ? 's' : ''}...`;
    if (picked) return 'Bom apetite! Este react foi escolhido especialmente para você.';
    return 'Deixe o CineReact surpreender sua refeição com um react aleatório.';
  }, [hasVideos, isDrawing, countdown, picked]);

  const displayReact = isDrawing ? shufflePreview : picked;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="cine-container pt-24 pb-28 min-h-screen w-full flex flex-col relative overflow-hidden"
    >
      {/* Background decor */}
      <motion.div
        className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/8 blur-[120px] pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-orange-500/10 blur-[100px] pointer-events-none"
        animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <button
        onClick={onBackToHome}
        className="group relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/40 text-xs font-black uppercase tracking-wider transition-all mb-8 cursor-pointer backdrop-blur-sm"
      >
        <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition-transform" />
        Voltar ao Início
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-3xl mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full"
        >
          {/* Animated border glow */}
          <div className="absolute -inset-[1px] rounded-[28px] bg-gradient-to-br from-amber-400/60 via-orange-500/30 to-yellow-400/50 opacity-70 blur-sm pointer-events-none" />
          <div className="absolute -inset-[1px] rounded-[28px] bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-400 opacity-20 pointer-events-none" />

          <motion.div className="relative rounded-[27px] overflow-hidden bg-zinc-950/95 backdrop-blur-xl border border-amber-500/20 shadow-[0_25px_80px_rgba(245,158,11,0.15)]">
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

            <div className="p-8 sm:p-12 flex flex-col items-center gap-7">
              {/* Icon */}
              <motion.div
                animate={isDrawing ? { rotate: [0, -8, 8, -8, 0], scale: [1, 1.1, 1] } : { y: [0, -6, 0] }}
                transition={isDrawing ? { duration: 0.5, repeat: Infinity } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
              >
                <div className="absolute inset-0 rounded-3xl bg-amber-400/30 blur-xl scale-150" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/40 ring-2 ring-amber-300/30">
                  <UtensilsCrossed className="w-10 h-10 text-black" />
                </div>
              </motion.div>

              {/* Title */}
              <div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 mb-3 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20"
                >
                  <Zap className="w-3 h-3" />
                  Categoria Especial
                </motion.p>
                <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 tracking-tight leading-tight">
                  Hora do Almoço
                </h1>
                <motion.p
                  key={subtitle}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm sm:text-base text-zinc-400 mt-4 leading-relaxed max-w-md mx-auto"
                >
                  {subtitle}
                </motion.p>
              </div>

              {/* Video card / drawing / countdown */}
              <AnimatePresence mode="wait">
                {isDrawing && (
                  <motion.div
                    key="drawing"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-lg"
                  >
                    <motion.div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                      {shufflePreview ? (
                        <div className="relative aspect-video">
                          <OptimizedImage
                            src={shufflePreview.thumbnailUrl}
                            alt={shufflePreview.titulo}
                            className="w-full h-full object-cover blur-[2px] scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-zinc-900 flex items-center justify-center">
                          <Shuffle className="w-12 h-12 text-amber-400 animate-spin" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Shuffle className="w-10 h-10 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                        </motion.div>
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">
                          Sorteando...
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {displayReact && !isDrawing && (
                  <motion.div
                    key={displayReact.id}
                    initial={{ opacity: 0, y: 20, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                    className="w-full max-w-lg"
                  >
                    <div className="relative group">
                      <motion.div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-400/50 via-yellow-400/30 to-orange-400/50 blur-md opacity-60 group-hover:opacity-80 transition-opacity" />
                      <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-zinc-950 shadow-2xl">
                        <div className="relative aspect-video">
                          <OptimizedImage
                            src={displayReact.thumbnailUrl}
                            alt={displayReact.titulo}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                          {countdown !== null && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
                            >
                              <CountdownRing seconds={countdown} total={COUNTDOWN_SECONDS} />
                              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/80">
                                Iniciando em breve
                              </p>
                              <button
                                onClick={() => picked && startPlayback(picked)}
                                className="mt-1 px-5 py-2 rounded-full bg-white/10 hover:bg-amber-500/30 border border-white/20 hover:border-amber-400/50 text-white text-xs font-bold transition-all cursor-pointer"
                              >
                                Pular countdown
                              </button>
                            </motion.div>
                          )}

                          {countdown === null && (
                            <div className="absolute bottom-3 left-3 right-3">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/90 text-black text-[10px] font-black uppercase tracking-wider">
                                <Sparkles className="w-3 h-3" />
                                Escolhido para você
                              </span>
                            </div>
                          )}
                        </div>

                        <motion.div className="p-5 text-left space-y-3 bg-zinc-950/90">
                          <p className="text-base font-bold text-white line-clamp-2 leading-snug">
                            {displayReact.titulo}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                            <span className="flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              {displayReact.visualizacoes?.toLocaleString('pt-BR') || 0}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              {displayReact.duracao || '—'}
                            </span>
                            <span className="text-zinc-400 font-medium">{displayReact.canalNome}</span>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg pt-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSortearEAssistir}
                  disabled={!hasVideos || isDrawing || countdown !== null}
                  className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-black font-black text-sm hover:brightness-110 disabled:opacity-40 transition-all cursor-pointer shadow-xl shadow-amber-500/30"
                >
                  <Sparkles className="w-4 h-4" />
                  {picked ? 'Sortear Outro' : 'Sortear React'}
                </motion.button>
                {picked && countdown === null && !isDrawing && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startPlayback(picked)}
                    className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-zinc-900/80 border border-zinc-700 hover:border-amber-500/60 text-white font-bold text-sm transition-all cursor-pointer backdrop-blur-sm"
                  >
                    <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                    Assistir Agora
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
