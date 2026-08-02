export interface CreatorSocialLinks {
  instagram?: string;
  youtube?: string;
  x?: string;
  tiktok?: string;
  discord?: string;
  twitch?: string;
}

export type SocialPlatform = keyof CreatorSocialLinks;

export const SOCIAL_PLATFORMS: {
  key: SocialPlatform;
  label: string;
  placeholder: string;
  baseUrl: string;
}[] = [
  { key: 'youtube', label: 'YouTube', placeholder: '@canal ou URL completa', baseUrl: 'https://youtube.com/' },
  { key: 'instagram', label: 'Instagram', placeholder: 'usuario ou URL completa', baseUrl: 'https://instagram.com/' },
  { key: 'x', label: 'X', placeholder: 'usuario ou URL completa', baseUrl: 'https://x.com/' },
  { key: 'tiktok', label: 'TikTok', placeholder: '@usuario ou URL completa', baseUrl: 'https://tiktok.com/@' },
  { key: 'discord', label: 'Discord', placeholder: 'convite ou URL completa', baseUrl: 'https://discord.gg/' },
  { key: 'twitch', label: 'Twitch', placeholder: 'usuario ou URL completa', baseUrl: 'https://twitch.tv/' },
];

const EMPTY_LINKS: CreatorSocialLinks = {};

export function normalizeSocialLink(platform: SocialPlatform, input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const handle = trimmed.replace(/^@/, '').replace(/\/+$/, '');
  const config = SOCIAL_PLATFORMS.find((p) => p.key === platform);
  return config ? `${config.baseUrl}${handle}` : trimmed;
}

export function sanitizeSocialLinks(links: unknown): CreatorSocialLinks {
  if (!links || typeof links !== 'object') return { ...EMPTY_LINKS };

  const result: CreatorSocialLinks = {};
  for (const { key } of SOCIAL_PLATFORMS) {
    const raw = (links as Record<string, unknown>)[key];
    if (typeof raw !== 'string') continue;
    const normalized = normalizeSocialLink(key, raw);
    if (normalized) result[key] = normalized;
  }
  return result;
}

export function hasSocialLinks(links?: CreatorSocialLinks | null): boolean {
  if (!links) return false;
  return SOCIAL_PLATFORMS.some(({ key }) => !!links[key]?.trim());
}
