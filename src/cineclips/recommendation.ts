import type { CineClip, CineClipWatchEvent } from '../types/cineclips.ts';
import { computeTrendingScore } from './utils.ts';

export interface ClipRecommendationContext {
  email?: string;
  followedCreators?: string[];
  watchHistory?: CineClipWatchEvent[];
  likedClipIds?: Set<string>;
  favoriteCategories?: string[];
  favoriteHashtags?: string[];
  excludeIds?: Set<string>;
}

function getWatchedClipIds(history: CineClipWatchEvent[] = []): Set<string> {
  return new Set(history.map((h) => h.clipId));
}

function getCreatorAffinity(
  clip: CineClip,
  followedCreators: string[] = [],
  history: CineClipWatchEvent[] = [],
  allClips: CineClip[]
): number {
  let score = 0;
  if (followedCreators.some((c) => c.toLowerCase() === clip.criadorNome.toLowerCase())) {
    score += 40;
  }
  const watchedFromCreator = history.filter((h) => {
    const watched = allClips.find((c) => c.id === h.clipId);
    return watched?.criadorNome.toLowerCase() === clip.criadorNome.toLowerCase();
  }).length;
  score += Math.min(watchedFromCreator * 8, 32);
  return score;
}

function getCategoryAffinity(clip: CineClip, favoriteCategories: string[] = []): number {
  if (!favoriteCategories.length) return 0;
  const overlap = clip.categorias.filter((c) =>
    favoriteCategories.some((f) => f.toLowerCase() === c.toLowerCase())
  ).length;
  return overlap * 15;
}

function getHashtagAffinity(clip: CineClip, favoriteHashtags: string[] = []): number {
  if (!favoriteHashtags.length) return 0;
  const overlap = clip.hashtags.filter((h) => favoriteHashtags.includes(h.toLowerCase())).length;
  return overlap * 10;
}

function getFreshnessBoost(clip: CineClip): number {
  const ageDays = (Date.now() - new Date(clip.publicadoEm).getTime()) / 86_400_000;
  if (ageDays < 1) return 20;
  if (ageDays < 3) return 12;
  if (ageDays < 7) return 6;
  return 0;
}

export function scoreClipForUser(clip: CineClip, ctx: ClipRecommendationContext, allClips: CineClip[]): number {
  let score = computeTrendingScore(clip);

  if (clip.isTrending) score += 25;

  score += getCreatorAffinity(clip, ctx.followedCreators, ctx.watchHistory, allClips);
  score += getCategoryAffinity(clip, ctx.favoriteCategories);
  score += getHashtagAffinity(clip, ctx.favoriteHashtags);
  score += getFreshnessBoost(clip);

  if (ctx.likedClipIds?.has(clip.id)) score -= 5;

  const watched = getWatchedClipIds(ctx.watchHistory);
  if (watched.has(clip.id)) score -= 30;

  if (ctx.excludeIds?.has(clip.id)) score -= 1000;

  return score;
}

export function recommendClips(
  clips: CineClip[],
  ctx: ClipRecommendationContext,
  limit = 20,
  cursor = 0
): { items: CineClip[]; nextCursor: number | null } {
  const published = clips.filter((c) => c.status === 'published');
  const scored = published
    .map((clip) => ({ clip, score: scoreClipForUser(clip, ctx, published) }))
    .sort((a, b) => b.score - a.score);

  const start = Math.max(0, cursor);
  const slice = scored.slice(start, start + limit);
  const nextCursor = start + limit < scored.length ? start + limit : null;

  return {
    items: slice.map((s) => s.clip),
    nextCursor,
  };
}

export function getTrendingClips(clips: CineClip[], limit = 10): CineClip[] {
  return clips
    .filter((c) => c.status === 'published')
    .map((clip) => ({ clip, score: computeTrendingScore(clip) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => ({ ...s.clip, trendingScore: s.score, isTrending: s.score >= 50 }));
}

export function getRelatedClips(clip: CineClip, allClips: CineClip[], limit = 6): CineClip[] {
  return allClips
    .filter((c) => c.id !== clip.id && c.status === 'published')
    .map((c) => {
      let score = 0;
      if (c.criadorNome.toLowerCase() === clip.criadorNome.toLowerCase()) score += 30;
      const sharedCats = c.categorias.filter((cat) => clip.categorias.includes(cat)).length;
      score += sharedCats * 15;
      const sharedTags = c.hashtags.filter((tag) => clip.hashtags.includes(tag)).length;
      score += sharedTags * 10;
      score += computeTrendingScore(c) * 0.2;
      return { clip: c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.clip);
}

export function deriveUserPreferences(
  history: CineClipWatchEvent[],
  allClips: CineClip[]
): { categories: string[]; hashtags: string[] } {
  const categoryCount: Record<string, number> = {};
  const hashtagCount: Record<string, number> = {};

  for (const event of history) {
    const clip = allClips.find((c) => c.id === event.clipId);
    if (!clip) continue;
    for (const cat of clip.categorias) {
      categoryCount[cat] = (categoryCount[cat] || 0) + (event.completed ? 2 : 1);
    }
    for (const tag of clip.hashtags) {
      hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
    }
  }

  const categories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  const hashtags = Object.entries(hashtagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k]) => k);

  return { categories, hashtags };
}
