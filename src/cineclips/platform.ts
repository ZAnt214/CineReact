export type ClipPlatform = 'youtube' | 'tiktok' | 'instagram' | 'unknown';

export interface ParsedClipUrl {
  platform: ClipPlatform;
  normalizedUrl: string;
  platformId?: string;
}

const TIKTOK_PATTERNS = [
  /tiktok\.com\/@[\w.-]+\/video\/(\d+)/i,
  /tiktok\.com\/t\/(\w+)/i,
  /vm\.tiktok\.com\/(\w+)/i,
  /vt\.tiktok\.com\/(\w+)/i,
];

const INSTAGRAM_PATTERNS = [
  /instagram\.com\/(?:reel|reels|p|tv)\/([\w-]+)/i,
  /instagr\.am\/(?:p|reel|reels)\/([\w-]+)/i,
];

export function detectClipPlatform(url: string): ClipPlatform {
  const u = url.toLowerCase().trim();
  if (u.includes('tiktok.com') || u.includes('vm.tiktok.com') || u.includes('vt.tiktok.com')) {
    return 'tiktok';
  }
  if (u.includes('instagram.com') || u.includes('instagr.am')) {
    return 'instagram';
  }
  if (u.includes('youtube.com') || u.includes('youtu.be')) {
    return 'youtube';
  }
  return 'unknown';
}

export function parseClipUrl(url: string): ParsedClipUrl {
  const trimmed = url.trim();
  const platform = detectClipPlatform(trimmed);

  if (platform === 'tiktok') {
    for (const pattern of TIKTOK_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match) {
        return { platform, normalizedUrl: trimmed.split('?')[0], platformId: match[1] };
      }
    }
    return { platform, normalizedUrl: trimmed.split('?')[0] };
  }

  if (platform === 'instagram') {
    for (const pattern of INSTAGRAM_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match) {
        return { platform, normalizedUrl: trimmed.split('?')[0], platformId: match[1] };
      }
    }
    return { platform, normalizedUrl: trimmed.split('?')[0] };
  }

  if (platform === 'youtube') {
    const ytMatch = trimmed.match(
      /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    );
    return {
      platform,
      normalizedUrl: trimmed,
      platformId: ytMatch?.[1],
    };
  }

  return { platform: 'unknown', normalizedUrl: trimmed };
}

export function platformLabel(platform: ClipPlatform): string {
  switch (platform) {
    case 'tiktok': return 'TikTok';
    case 'instagram': return 'Instagram';
    case 'youtube': return 'YouTube';
    default: return 'Desconhecida';
  }
}

export const SUPPORTED_IMPORT_PLATFORMS: ClipPlatform[] = ['youtube', 'tiktok', 'instagram'];
