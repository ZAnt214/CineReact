import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  RotateCw, 
  Tv, 
  Settings, 
  Film, 
  Flame, 
  Layers,
  ChevronRight,
  Zap,
  Sliders
} from 'lucide-react';
import { ReactVideo, Obra } from '../types.ts';
import { motion, AnimatePresence } from 'motion/react';
import CineReactLogo from './CineReactLogo.tsx';

interface CineReactPlayerProps {
  video: ReactVideo;
  obra?: Obra;
  onProgressUpdate?: (progressPercentage: number) => void;
  isTheaterMode?: boolean;
  onToggleTheaterMode?: () => void;
}

export default function CineReactPlayer({
  video,
  obra,
  onProgressUpdate,
  isTheaterMode = false,
  onToggleTheaterMode
}: CineReactPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [dualView, setDualView] = useState<boolean>(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);
  const [showNativePlayer, setShowNativePlayer] = useState<boolean>(false);
  const [centerAnimation, setCenterAnimation] = useState<'play' | 'pause' | 'rewind' | 'forward' | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Send command to YouTube iFrame via postMessage
  const postToYT = useCallback((func: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  }, []);

  // Sync state from YouTube messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data !== 'string') return;
        const data = JSON.parse(event.data);

        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            setCurrentTime(data.info.currentTime);
          }
          if (typeof data.info.duration === 'number' && data.info.duration > 0) {
            setDuration(data.info.duration);
          }
          if (typeof data.info.playerState === 'number') {
            // YT.PlayerState: 1 = playing, 2 = paused, 0 = ended, 3 = buffering
            if (data.info.playerState === 1) {
              setIsPlaying(true);
            } else if (data.info.playerState === 2 || data.info.playerState === 0) {
              setIsPlaying(false);
            }
          }
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Poll current time / duration via postMessage
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && !showNativePlayer) {
        postToYT('getCurrentTime');
        postToYT('getDuration');
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isPlaying, showNativePlayer, postToYT]);

  // Update parent progress callback
  useEffect(() => {
    if (duration > 0 && onProgressUpdate) {
      const pct = Math.min(100, Math.max(0, (currentTime / duration) * 100));
      onProgressUpdate(pct);
    }
  }, [currentTime, duration, onProgressUpdate]);

  // Handle Play/Pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      postToYT('pauseVideo');
      setIsPlaying(false);
      setCenterAnimation('pause');
    } else {
      postToYT('playVideo');
      setIsPlaying(true);
      setCenterAnimation('play');
    }
    setTimeout(() => setCenterAnimation(null), 600);
  }, [isPlaying, postToYT]);

  // Skip Seconds
  const skipTime = useCallback((seconds: number) => {
    setCurrentTime((prev) => {
      const target = Math.min(Math.max(0, prev + seconds), duration || 9999);
      postToYT('seekTo', [target, true]);
      return target;
    });
    setCenterAnimation(seconds < 0 ? 'rewind' : 'forward');
    setTimeout(() => setCenterAnimation(null), 600);
  }, [duration, postToYT]);

  // Handle Double Click or Click on Screen
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (showNativePlayer) return;

    if (clickTimeoutRef.current) {
      // Double click detected
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (clickX < rect.width / 2) {
        skipTime(-10);
      } else {
        skipTime(10);
      }
    } else {
      // Single click delay to check for double click
      clickTimeoutRef.current = setTimeout(() => {
        togglePlay();
        clickTimeoutRef.current = null;
      }, 250);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space' || e.code === 'KeyK') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipTime(-5);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipTime(5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, skipTime]);

  // Handle Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    postToYT('seekTo', [newTime, true]);
  };

  // Handle Volume Change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    postToYT('setVolume', [newVol]);
    if (newVol === 0) {
      setIsMuted(true);
      postToYT('mute');
    } else if (isMuted) {
      setIsMuted(false);
      postToYT('unMute');
    }
  };

  // Handle Toggle Mute
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      postToYT('unMute');
      postToYT('setVolume', [volume || 80]);
    } else {
      setIsMuted(true);
      postToYT('mute');
    }
  };

  // Handle Speed Change
  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    postToYT('setPlaybackRate', [speed]);
    setShowSpeedMenu(false);
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.error("Erro ao entrar em tela cheia:", err));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => console.error("Erro ao sair da tela cheia:", err));
    }
  };

  // Monitor fullscreen change events
  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  // Controls auto-hide activity handler
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 3500);
    }
  };

  // Format time (e.g. 125 -> 02:05)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (num: number) => String(num).padStart(2, '0');

    if (hrs > 0) {
      return `${hrs}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Timeline hover calculation
  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, offsetX / rect.width));
    setHoverTime(percentage * (duration || 100));
    setHoverX(offsetX);
  };

  const handleTimelineMouseLeave = () => {
    setHoverTime(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative w-full bg-black rounded-2xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.9)] border border-cine-accent/25 group/player select-none transition-all duration-300 ${
        isFullscreen ? 'rounded-none border-none h-screen w-screen' : 'aspect-video'
      }`}
    >
      {/* CINE REACT MAIN VIDEO FRAME */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        
        {/* DUAL VIEW SPLIT OPTION */}
        <div className={`relative w-full h-full flex transition-all duration-500 ${dualView ? 'flex-col md:flex-row' : ''}`}>
          
          {/* MAIN REACT VIDEO IFRAME (SCALED & CROPPED TO COMPLETELY REMOVE NATIVE YT BRANDING/OVERLAYS) */}
          <div className={`relative h-full overflow-hidden transition-all duration-500 ${dualView ? 'w-full md:w-2/3 border-r border-cine-accent/30' : 'w-full'}`}>
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${video.id}?enablejsapi=1&autoplay=1&controls=${showNativePlayer ? '1' : '0'}&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&fs=0&disablekb=1&autohide=1&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`}
              title={video.titulo}
              className={`w-full h-full object-cover transition-transform duration-300 ${showNativePlayer ? 'pointer-events-auto scale-100' : 'pointer-events-none scale-100'}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            {/* CINEMATIC VIGNETTE OVERLAY FOR DEEP BLACKS & OPTICAL CONTRAST */}
            {!showNativePlayer && (
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.6)] z-[5]" />
            )}

            {/* FULL SCREEN CLICK/TAP OVERLAY WITH DOUBLE-CLICK SEEKING */}
            {!showNativePlayer && (
              <div 
                onClick={handleOverlayClick}
                className="absolute inset-0 z-10 cursor-pointer bg-transparent"
              />
            )}
          </div>

          {/* DUAL VIEW PANEL (OBRA CONTEXT & SYNCHRONIZED METADATA) */}
          {dualView && obra && (
            <div className="w-full md:w-1/3 h-full bg-neutral-950/95 border-t md:border-t-0 md:border-l border-cine-accent/30 p-4 sm:p-6 overflow-y-auto flex flex-col justify-between gap-4 backdrop-blur-2xl z-10">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cine-accent/20 text-cine-accent-light border border-cine-accent/30 flex items-center gap-1.5 shadow-md">
                    <Film className="w-3 h-3 text-cine-accent-light animate-pulse" />
                    Obra Sincronizada
                  </span>
                  <button 
                    onClick={() => setDualView(false)}
                    className="text-xs text-zinc-400 hover:text-white font-bold transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>

                <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-800 shadow-xl group">
                  <img src={obra.banner || obra.poster} alt={obra.titulo} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-3">
                    <div>
                      <h4 className="text-sm font-black text-white">{obra.titulo}</h4>
                      <p className="text-[10px] text-zinc-400">{obra.ano} • {obra.generos?.join(', ')}</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-4 font-sans bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/80 shadow-inner">
                  {obra.sinopse || obra.synopsis || 'Sem sinopse disponível.'}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-cine-accent" /> Modo Reação CineReact
                </span>
                <span className="text-cine-accent-light font-bold">100% Sincronizado</span>
              </div>
            </div>
          )}
        </div>

        {/* CENTER FEEDBACK ANIMATIONS (PLAY, PAUSE, REWIND, FORWARD) */}
        <AnimatePresence>
          {centerAnimation && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.15, opacity: 1 }}
              exit={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute pointer-events-none z-30 w-20 h-20 rounded-full bg-cine-accent/90 backdrop-blur-md flex flex-col items-center justify-center text-white shadow-[0_0_40px_rgba(255,255,255,0.9)] border border-cine-cream/40"
            >
              {centerAnimation === 'play' && (
                <Play className="w-10 h-10 fill-black ml-1" />
              )}
              {centerAnimation === 'pause' && (
                <Pause className="w-10 h-10 fill-black" />
              )}
              {centerAnimation === 'rewind' && (
                <div className="flex flex-col items-center">
                  <RotateCcw className="w-8 h-8" />
                  <span className="text-[10px] font-black font-mono mt-0.5">-10s</span>
                </div>
              )}
              {centerAnimation === 'forward' && (
                <div className="flex flex-col items-center">
                  <RotateCw className="w-8 h-8" />
                  <span className="text-[10px] font-black font-mono mt-0.5">+10s</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOP CINEREACT HEADER OVERLAY BAR */}
        {!showNativePlayer && (
          <div className={`absolute top-0 left-0 right-0 z-20 p-4 sm:p-5 bg-gradient-to-b from-black/95 via-black/60 to-transparent flex items-center justify-between gap-4 transition-all duration-300 ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}>
            {/* LEFT: CINE REACT BRAND BADGE & TITLE */}
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-black/80 backdrop-blur-xl px-2.5 py-1 rounded-xl border border-cine-accent/40 shadow-xl shrink-0">
                <CineReactLogo size="xs" className="pointer-events-none" />
              </div>

              <div className="truncate">
                <h2 className="text-sm sm:text-base font-extrabold text-white truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {video.titulo}
                </h2>
                <p className="text-[11px] text-zinc-300 font-medium truncate flex items-center gap-2">
                  <span className="text-zinc-200 font-semibold">{video.canalNome}</span>
                  {obra && (
                    <span className="text-cine-accent-light font-bold flex items-center gap-1">
                      • Reagindo a: {obra.titulo}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* RIGHT: DUAL VIEW & PLAYER TOGGLES */}
            <div className="flex items-center gap-2 shrink-0">
              {obra && (
                <button
                  onClick={() => setDualView(!dualView)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xl cursor-pointer ${
                    dualView 
                      ? 'bg-cine-accent text-white border-cine-cream shadow-cine-accent/40 font-black' 
                      : 'bg-black/70 hover:bg-neutral-900 text-zinc-200 border-zinc-700/80 backdrop-blur-md'
                  }`}
                  title="Modo Duplo (Vídeo + Obra)"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{dualView ? 'Visão Normal' : 'Modo Duplo'}</span>
                </button>
              )}

              <button
                onClick={() => setShowNativePlayer(!showNativePlayer)}
                className="px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold bg-black/70 hover:bg-black text-zinc-400 hover:text-white border border-neutral-800 transition-colors backdrop-blur-md cursor-pointer"
                title="Alternar entre Player CineReact e Player Padrão"
              >
                {showNativePlayer ? 'Player CineReact' : 'Player YouTube'}
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM CINEREACT CUSTOM CONTROLS OVERLAY BAR */}
        {!showNativePlayer && (
          <div className={`absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-5 bg-gradient-to-t from-black/95 via-black/80 to-transparent space-y-3 transition-all duration-300 ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}>
            
            {/* CUSTOM PROGRESS BAR & SCRUBBER */}
            <div className="relative group/timeline py-2 cursor-pointer">
              
              {/* HOVER TIMESTAMP TOOLTIP */}
              {hoverTime !== null && (
                <div 
                  className="absolute -top-8 transform -translate-x-1/2 bg-neutral-950/95 text-cine-cream border border-cine-accent/50 text-[11px] font-mono px-2.5 py-1 rounded-md shadow-2xl pointer-events-none backdrop-blur-md font-bold"
                  style={{ left: `${hoverX}px` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}

              {/* BAR BACKGROUND */}
              <div 
                onMouseMove={handleTimelineMouseMove}
                onMouseLeave={handleTimelineMouseLeave}
                className="relative h-2 group-hover/timeline:h-3 bg-neutral-800/90 rounded-full overflow-hidden transition-all duration-200 shadow-inner border border-zinc-700/40"
              >
                {/* PROGRESS TRACK FILL WITH GLOW */}
                <div 
                  className="h-full bg-cine-accent rounded-full relative"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)] scale-0 group-hover/timeline:scale-100 transition-transform" />
                </div>
              </div>

              {/* ACCURATE RANGE INPUT FOR SEEKING */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>

            {/* CONTROLS BUTTONS ROW */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 font-sans">
              
              {/* LEFT CONTROLS: Play, Rewind/Forward, Volume, Time */}
              <div className="flex items-center gap-2 sm:gap-4">
                
                {/* Play / Pause Toggle */}
                <button
                  onClick={togglePlay}
                  className="p-2.5 sm:p-3 rounded-xl bg-white hover:bg-cine-accent-dark text-white shadow-lg shadow-cine-accent/30 transition-all hover:scale-105 cursor-pointer active:scale-95"
                  title={isPlaying ? 'Pausar (Espaço/K)' : 'Reproduzir (Espaço/K)'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                {/* Skip 10s Backward */}
                <button
                  onClick={() => skipTime(-10)}
                  className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer hidden sm:block"
                  title="Voltar 10s (Seta Esquerda)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Skip 10s Forward */}
                <button
                  onClick={() => skipTime(10)}
                  className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer hidden sm:block"
                  title="Avançar 10s (Seta Direita)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Volume Controls */}
                <div className="flex items-center gap-2 group/volume">
                  <button
                    onClick={toggleMute}
                    className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                    title={isMuted ? 'Ativar som (M)' : 'Mudar volume (M)'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-red-400" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-cine-accent-light" />
                    )}
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 sm:w-20 h-1.5 bg-zinc-700 accent-cine-accent-light rounded-lg cursor-pointer hidden group-hover/volume:block sm:block transition-all"
                  />
                </div>

                {/* Time Display */}
                <div className="text-xs sm:text-sm font-mono text-zinc-300 tracking-wider">
                  <span className="text-white font-bold">{formatTime(currentTime)}</span>
                  <span className="text-zinc-600 px-1.5">/</span>
                  <span className="text-zinc-400">{formatTime(duration)}</span>
                </div>
              </div>

              {/* RIGHT CONTROLS: Speed Selector, Theater Mode, Fullscreen */}
              <div className="flex items-center gap-2 sm:gap-3 relative">
                
                {/* Playback Speed Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="px-2.5 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-xs font-mono font-bold text-cine-accent-light border border-zinc-700/80 transition-colors cursor-pointer flex items-center gap-1 shadow-md"
                    title="Velocidade de reprodução"
                  >
                    {playbackSpeed}x
                  </button>

                  {showSpeedMenu && (
                    <div className="absolute bottom-11 right-0 bg-neutral-950/95 border border-cine-accent/40 backdrop-blur-2xl rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 z-30 min-w-[120px]">
                      {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                        <button
                          key={s}
                          onClick={() => changeSpeed(s)}
                          className={`text-xs font-mono px-3 py-1.5 rounded-lg text-left transition-colors cursor-pointer flex items-center justify-between ${
                            playbackSpeed === s
                              ? 'bg-cine-accent text-white font-bold'
                              : 'text-zinc-300 hover:bg-neutral-800 hover:text-white'
                          }`}
                        >
                          <span>{s === 1.0 ? '1.0x (Normal)' : `${s}x`}</span>
                          {playbackSpeed === s && <Zap className="w-3 h-3 fill-current" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Theater Mode Toggle */}
                {onToggleTheaterMode && (
                  <button
                    onClick={onToggleTheaterMode}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isTheaterMode 
                        ? 'bg-cine-accent/20 text-cine-accent-light border border-cine-accent/40 shadow-lg' 
                        : 'text-zinc-300 hover:text-white hover:bg-white/10'
                    }`}
                    title={isTheaterMode ? 'Sair do Modo Teatro' : 'Modo Teatro'}
                  >
                    <Tv className="w-5 h-5" />
                  </button>
                )}

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  title={isFullscreen ? 'Sair da tela cheia (F)' : 'Tela cheia (F)'}
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5" />
                  ) : (
                    <Maximize className="w-5 h-5" />
                  )}
                </button>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

