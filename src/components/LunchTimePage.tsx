import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, UtensilsCrossed, Sparkles, Play, Clock, Eye, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReactVideo } from '../types.ts';
import OptimizedImage from './OptimizedImage.tsx';

const COUNTDOWN_SECONDS = 8;
const SHUFFLE_DURATION_MS = 5500;

const WARM_MESSAGES = [
  'Respira fundo… sua pausa merece um bom react.',
  'Enquanto você come, a gente cuida da escolha.',
  'Relaxe — estamos preparando algo especial pra você.',
  'Aproveite cada garfada. O react vem aí.',
  'Hora de desligar a cabeça e curtir um react.',
  'Boa refeição! Daqui a pouco tem react na mesa.',
  'Você merece esse momento. Deixa com a gente.',
  'Um react quentinho chegando na sua tela…',
];

interface LunchTimePageProps {
  reacts: ReactVideo[];
  onPlayVideo: (reactId: string, obraId: string) => void;
  onBackToHome: () => void;
  onLunchPick?: () => void;
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

function WarmMessage({ message }: { message: string }) {
  return (
    <motion.div
      key={message}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.45 }}
      className="flex flex-col items-center gap-3 px-6 text-center"
    >
      <Heart className="w-5 h-5 text-cine-accent-light fill-cine-accent-light/30" />
      <p className="text-base sm:text-lg font-semibold text-white leading-relaxed max-w-sm">
        {message}
      </p>
    </motion.div>
  );
}

export default function LunchTimePage({
  reacts,
  onPlayVideo,
  onBackToHome,
  onLunchPick,
  autoPlayOnMount = true,
}: LunchTimePageProps) {
  const [picked, setPicked] = useState<ReactVideo | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shufflePreview, setShufflePreview] = useState<ReactVideo | null>(null);
  const [shuffleProgress, setShuffleProgress] = useState(0);
  const [warmMessageIndex, setWarmMessageIndex] = useState(0);
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
    setWarmMessageIndex(0);

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
          onLunchPick?.();
          onDone?.(selected);
        }, 400);
      }
    );

    cancelShuffleRef.current = () => {
      cancel();
      clearInterval(progressInterval);
    };
  }, [hasVideos, reacts, onLunchPick]);

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

  useEffect(() => {
    if (!isDrawing) return;
    const interval = setInterval(() => {
      setWarmMessageIndex((i) => (i + 1) % WARM_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isDrawing]);

  const statusText = useMemo(() => {
    if (!hasVideos) return 'Em breve teremos reacts para acompanhar sua refeição.';
    if (isDrawing) return 'Preparando sua sugestão do dia…';
    if (countdown !== null) return `Seu react começa em ${countdown}s — aproveite!`;
    if (picked) return 'Pronto! Bom apetite e boa sessão.';
    return 'Clique no botão ao lado para escolher um vídeo aleatório.';
  }, [hasVideos, isDrawing, countdown, picked]);

  const displayReact = isDrawing ? shufflePreview : picked;
  const showPlayer = isDrawing || displayReact;
  const sortearButtonLabel = picked ? 'Escolher outro vídeo' : 'Escolher um vídeo';

  return (
    <div className="cine-container pt-24 pb-28 w-full min-h-screen flex-1">
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBackToHome}
          className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-zinc-300 hover:text-white font-extrabold text-xs transition-all flex items-center gap-2 border border-neutral-800 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-cine-accent-light" />
          <span>Voltar ao Início</span>
        </button>
        {hasVideos && (
          <span className="text-xs text-zinc-500 font-mono font-bold">
            {reacts.length} reacts disponíveis
          </span>
        )}
      </div>

      <div className="relative bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-cine-accent/30 rounded-3xl p-6 sm:p-8 mb-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-cine-accent/80" />
        <motion.div className="absolute -top-20 -right-20 w-64 h-64 bg-cine-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cine-accent/10 border border-cine-accent/30 text-cine-accent-light text-xs font-extrabold uppercase tracking-wider">
              <UtensilsCrossed className="w-4 h-4" />
              <span>Hora do Almoço</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Sua pausa, nosso react
            </h1>

            <p className="text-zinc-300 text-sm leading-relaxed">{statusText}</p>
          </div>

          {!isDrawing && countdown === null && (
            <button
              onClick={handleSortearEAssistir}
              disabled={!hasVideos}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-[#cc0000] text-black font-black text-sm transition-all shadow-lg shadow-cine-accent/20 disabled:opacity-40 cursor-pointer active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              {sortearButtonLabel}
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto">
        {!showPlayer && hasVideos && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-6"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cine-accent/10 mb-6">
              <UtensilsCrossed className="w-9 h-9 text-cine-accent-light" />
            </div>
            <p className="text-lg text-zinc-300 font-medium leading-relaxed max-w-md mx-auto">
              Que tal um react aleatório para acompanhar sua refeição? É só um clique.
            </p>
          </motion.div>
        )}

        {showPlayer && displayReact && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-900 shadow-2xl">
              <OptimizedImage
                src={displayReact.thumbnailUrl}
                alt={displayReact.titulo}
                loading="eager"
                className={`w-full h-full object-cover transition-[filter,transform] duration-500 ${
                  isDrawing ? 'brightness-[0.45] scale-105' : 'brightness-100 scale-100'
                }`}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 pointer-events-none" />

              {isDrawing && (
                <>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                    <div
                      className="h-full bg-cine-accent-light transition-[width] duration-300 ease-out"
                      style={{ width: `${shuffleProgress}%` }}
                    />
                  </div>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <AnimatePresence mode="wait">
                      <WarmMessage message={WARM_MESSAGES[warmMessageIndex]} />
                    </AnimatePresence>
                  </div>
                </>
              )}

              {!isDrawing && countdown !== null && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-[3px]">
                  <motion.span
                    key={countdown}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-7xl sm:text-8xl font-black text-white tabular-nums"
                  >
                    {countdown}
                  </motion.span>
                  <p className="text-sm text-zinc-300">Bom apetite! Começando em instantes…</p>
                  <button
                    onClick={() => picked && startPlayback(picked)}
                    className="mt-1 text-xs font-bold text-cine-accent-light hover:text-cine-cream transition-colors cursor-pointer"
                  >
                    Assistir agora →
                  </button>
                </div>
              )}
            </div>

            {!isDrawing && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-cine-accent/80 mb-1">
                    Escolhido para você
                  </p>
                  <h2 className="text-lg sm:text-xl font-bold text-white line-clamp-2 leading-snug">
                    {displayReact.titulo}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      {displayReact.visualizacoes?.toLocaleString('pt-BR') || 0}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {displayReact.duracao || '—'}
                    </span>
                    <span>{displayReact.canalNome}</span>
                  </div>
                </div>

                {countdown === null && (
                  <button
                    onClick={() => startPlayback(displayReact)}
                    className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-800 hover:bg-zinc-700 text-white font-bold text-sm transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Assistir Agora
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
