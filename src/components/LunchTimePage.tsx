import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, UtensilsCrossed, Sparkles, Play, Clock, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReactVideo } from '../types.ts';
import OptimizedImage from './OptimizedImage.tsx';

const COUNTDOWN_SECONDS = 8;
const SHUFFLE_DURATION_MS = 5500;

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

function runShuffleAnimation(
  reacts: ReactVideo[],
  onTick: (preview: ReactVideo) => void,
  onComplete: (selected: ReactVideo) => void
) {
  const selected = pickRandomLunchReact(reacts);
  if (!selected) return () => {};

  const start = Date.now();
  let lastId = '';
  let timeoutId: ReturnType<typeof setTimeout>;

  const tick = () => {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / SHUFFLE_DURATION_MS, 1);
    const eased = progress * progress;
    const delay = 70 + eased * 430;

    if (progress < 1) {
      let preview = pickRandomLunchReact(reacts);
      let attempts = 0;
      while (preview && preview.id === lastId && attempts < 5) {
        preview = pickRandomLunchReact(reacts);
        attempts++;
      }
      if (preview) {
        lastId = preview.id;
        onTick(preview);
      }
      timeoutId = setTimeout(tick, delay);
    } else {
      onTick(selected);
      onComplete(selected);
    }
  };

  tick();
  return () => clearTimeout(timeoutId);
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
  const [shuffleProgress, setShuffleProgress] = useState(0);
  const hasAutoPlayed = useRef(false);
  const cancelShuffleRef = useRef<(() => void) | null>(null);

  const hasVideos = reacts.length > 0;

  const startShuffle = useCallback((onDone?: (selected: ReactVideo) => void) => {
    if (!hasVideos) return;

    cancelShuffleRef.current?.();
    setIsDrawing(true);
    setCountdown(null);
    setShufflePreview(null);
    setShuffleProgress(0);

    const progressInterval = setInterval(() => {
      setShuffleProgress((p) => Math.min(p + 2, 100));
    }, SHUFFLE_DURATION_MS / 50);

    const cancel = runShuffleAnimation(
      reacts,
      (preview) => setShufflePreview(preview),
      (selected) => {
        clearInterval(progressInterval);
        setShuffleProgress(100);
        setPicked(selected);
        setShufflePreview(selected);
        setTimeout(() => {
          setIsDrawing(false);
          onDone?.(selected);
        }, 600);
      }
    );

    cancelShuffleRef.current = () => {
      cancel();
      clearInterval(progressInterval);
    };
  }, [hasVideos, reacts]);

  const startPlayback = useCallback((react: ReactVideo) => {
    setCountdown(null);
    onPlayVideo(react.id, react.obraId);
  }, [onPlayVideo]);

  const handleSortearEAssistir = useCallback(() => {
    startShuffle(() => setCountdown(COUNTDOWN_SECONDS));
  }, [startShuffle]);

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
    startShuffle(() => setCountdown(COUNTDOWN_SECONDS));
  }, [autoPlayOnMount, hasVideos, startShuffle]);

  useEffect(() => () => cancelShuffleRef.current?.(), []);

  const subtitle = useMemo(() => {
    if (!hasVideos) return 'Nenhum vídeo disponível no catálogo ainda.';
    if (isDrawing) return 'Escolhendo o react perfeito para o seu almoço...';
    if (countdown !== null) return `Seu react começa em ${countdown} segundo${countdown !== 1 ? 's' : ''}`;
    if (picked) return 'Bom apetite! Aproveite a refeição.';
    return 'Toque no botão e deixe o CineReact surpreender você.';
  }, [hasVideos, isDrawing, countdown, picked]);

  const displayReact = isDrawing ? shufflePreview : picked;

  return (
    <div className="cine-container pt-24 pb-28 min-h-screen w-full flex flex-col">
      <button
        onClick={onBackToHome}
        className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/60 hover:bg-amber-500/15 text-zinc-400 hover:text-amber-400 text-xs font-bold uppercase tracking-wider transition-all mb-10 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Voltar
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col items-center w-full max-w-4xl mx-auto"
      >
        {/* Header — sem caixa, layout aberto */}
        <div className="text-center mb-10 w-full">
          <motion.div
            animate={isDrawing ? { rotate: [0, -5, 5, 0] } : { y: [0, -4, 0] }}
            transition={isDrawing ? { duration: 1.2, repeat: Infinity } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/15 mb-5"
          >
            <UtensilsCrossed className="w-7 h-7 text-amber-400" />
          </motion.div>

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/80 mb-2">
            Categoria Especial
          </p>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Hora do Almoço
          </h1>
          <motion.p
            key={subtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm sm:text-base text-zinc-500 mt-3"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Área do vídeo — sem moldura quadrada */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {(isDrawing || displayReact) && (
              <motion.div
                key={isDrawing ? 'drawing' : displayReact?.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                <motion.div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-900 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                  {displayReact ? (
                    <AnimatePresence mode="popLayout">
                      <motion.div
                        key={displayReact.id}
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: isDrawing ? 0.15 : 0.35 }}
                        className="absolute inset-0"
                      >
                        <OptimizedImage
                          src={displayReact.thumbnailUrl}
                          alt={displayReact.titulo}
                          className={`w-full h-full object-cover transition-all duration-300 ${isDrawing ? 'blur-[1px] brightness-75' : ''}`}
                        />
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <div className="absolute inset-0 bg-zinc-900" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

                  {/* Barra de progresso do sorteio */}
                  {isDrawing && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                      <motion.div
                        className="h-full bg-amber-400"
                        style={{ width: `${shuffleProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  )}

                  {/* Overlay sorteio */}
                  {isDrawing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-[2px]"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="flex flex-col items-center gap-3"
                      >
                        <Sparkles className="w-8 h-8 text-amber-400" />
                        <p className="text-sm sm:text-base font-bold text-white tracking-wide">
                          Escolhendo seu react...
                        </p>
                        {shufflePreview && (
                          <p className="text-xs text-zinc-400 max-w-xs text-center line-clamp-1 px-6">
                            {shufflePreview.titulo}
                          </p>
                        )}
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Countdown */}
                  {!isDrawing && countdown !== null && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/55 backdrop-blur-sm"
                    >
                      <motion.span
                        key={countdown}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-8xl sm:text-9xl font-black text-white tabular-nums"
                        style={{ textShadow: '0 0 60px rgba(251,191,36,0.5)' }}
                      >
                        {countdown}
                      </motion.span>
                      <p className="text-sm text-zinc-400">Iniciando em breve</p>
                      <button
                        onClick={() => picked && startPlayback(picked)}
                        className="px-5 py-2 rounded-full text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                      >
                        Assistir agora
                      </button>
                    </motion.div>
                  )}
                </motion.div>

                {/* Info abaixo do vídeo */}
                {displayReact && !isDrawing && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-5 px-1"
                  >
                    <p className="text-lg sm:text-xl font-bold text-white line-clamp-2 leading-snug">
                      {displayReact.titulo}
                    </p>
                    <motion.div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-zinc-500">
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-zinc-600" />
                        {displayReact.visualizacoes?.toLocaleString('pt-BR') || 0}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-zinc-600" />
                        {displayReact.duracao || '—'}
                      </span>
                      <span>{displayReact.canalNome}</span>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-10">
          <button
            onClick={handleSortearEAssistir}
            disabled={!hasVideos || isDrawing || countdown !== null}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-black text-sm disabled:opacity-40 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            {picked ? 'Sortear Outro' : 'Sortear React'}
          </button>
          {picked && countdown === null && !isDrawing && (
            <button
              onClick={() => startPlayback(picked)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              Assistir Agora
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
