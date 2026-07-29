import type { CineClip } from '../types/cineclips.ts';

const SHORT_HASHTAGS = [
  '#shorts', '#short', '#reels', '#tiktok', '#ytshorts', '#viralshorts',
  '#shortsforyou', '#shortsfeed', '#shortsclip',
];

const MAX_CLIP_SECONDS = 180;

export function parseDurationToSeconds(duracao: string): number {
  if (!duracao) return 0;
  const parts = String(duracao).split(':').map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

export function formatSecondsToDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\p{L}\p{N}_]+/gu) || [];
  return [...new Set(matches.map((tag) => tag.toLowerCase()))];
}

export function extractVideoIdFromUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] || null;
}

export function usesHostedVideo(clip: { videoUrl?: string; sourceType?: string }): boolean {
  return !!clip.videoUrl || clip.sourceType === 'tiktok' || clip.sourceType === 'instagram';
}

export function hasShortFormSignals(title: string, description = ''): boolean {
  const combined = `${title} ${description}`.toLowerCase();
  return SHORT_HASHTAGS.some((kw) => combined.includes(kw));
}

export function isValidClipDuration(seconds: number, title = '', description = ''): boolean {
  if (seconds <= 0) return true;
  if (seconds <= MAX_CLIP_SECONDS) return true;
  return hasShortFormSignals(title, description) && seconds <= 600;
}

export function getClipDurationRejection(seconds: number, title = '', description = ''): string | null {
  if (seconds <= 0) return null;
  if (isValidClipDuration(seconds, title, description)) return null;
  if (seconds > 600) {
    return `Vídeo muito longo (${formatSecondsToDuration(seconds)}). CineClips aceita até ${MAX_CLIP_SECONDS / 60} minutos para reações curtas.`;
  }
  return `Duração de ${formatSecondsToDuration(seconds)} excede o limite de ${MAX_CLIP_SECONDS / 60} minutos para CineClips.`;
}

export function computeTrendingScore(clip: CineClip): number {
  const ageHours = Math.max(1, (Date.now() - new Date(clip.publicadoEm).getTime()) / 3_600_000);
  const engagement = clip.likes * 3 + clip.commentsCount * 5 + clip.shares * 4 + clip.favorites * 2;
  const views = clip.visualizacoes;
  return Math.round((engagement + views * 0.5) / Math.pow(ageHours, 0.8));
}

export function normalizeHashtag(tag: string): string {
  const clean = tag.trim().toLowerCase();
  return clean.startsWith('#') ? clean : `#${clean}`;
}

export function buildClipShareUrl(clipId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${window.location.pathname}?tab=cineclips&clip=${clipId}`;
  }
  return `?tab=cineclips&clip=${clipId}`;
}
