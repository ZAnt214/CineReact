import type { CineClip } from '../types/cineclips.ts';
import type { ClipAccessLevel } from '../types/finance.ts';
import {
  hasExclusiveAccess,
  hasGlobalAccess,
} from './subscriptionService.ts';

export function resolveEffectiveAccessLevel(clip: CineClip): ClipAccessLevel {
  const level = clip.accessLevel || 'public';
  if (level === 'timed_exclusive' && clip.exclusiveUntil) {
    if (new Date(clip.exclusiveUntil).getTime() <= Date.now()) {
      return 'public';
    }
  }
  return level;
}

export function isClipExclusive(clip: CineClip): boolean {
  const level = resolveEffectiveAccessLevel(clip);
  return level === 'exclusive' || level === 'timed_exclusive';
}

export function canUserViewClip(viewerEmail: string | undefined, clip: CineClip): boolean {
  const level = resolveEffectiveAccessLevel(clip);
  if (level === 'public') return true;
  if (!viewerEmail) return false;

  const email = viewerEmail.toLowerCase();
  if (clip.criadorEmail?.toLowerCase() === email) return true;

  if (level === 'exclusive' || level === 'timed_exclusive') {
    if (clip.criadorEmail && hasExclusiveAccess(email, clip.criadorEmail)) return true;
    if (clip.participatesInGlobal && hasGlobalAccess(email)) return true;
    return false;
  }

  return true;
}

export type ClipViewerMeta = CineClip & {
  isLocked?: boolean;
  effectiveAccessLevel?: ClipAccessLevel;
  requiresSubscription?: 'exclusive' | 'global';
};

export function maskClipForViewer(clip: CineClip, viewerEmail?: string): ClipViewerMeta {
  const effectiveAccessLevel = resolveEffectiveAccessLevel(clip);
  const locked = isClipExclusive(clip) && !canUserViewClip(viewerEmail, clip);

  if (!locked) {
    return { ...clip, isLocked: false, effectiveAccessLevel };
  }

  return {
    ...clip,
    isLocked: true,
    effectiveAccessLevel,
    requiresSubscription: clip.participatesInGlobal ? 'global' : 'exclusive',
    videoUrl: undefined,
    sourceUrl: undefined,
  };
}
