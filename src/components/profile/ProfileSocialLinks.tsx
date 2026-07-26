import React from 'react';
import { Instagram, Youtube, Twitch, ExternalLink } from 'lucide-react';
import type { CreatorSocialLinks } from '../../types.ts';
import { hasSocialLinks, SOCIAL_PLATFORMS, type SocialPlatform } from '../../utils/socialLinks.ts';

export interface ProfileSocialLinksProps {
  links?: CreatorSocialLinks | null;
  size?: 'sm' | 'md';
  align?: 'center' | 'start';
  className?: string;
}

const PLATFORM_STYLES: Record<
  SocialPlatform,
  {
    Icon: React.ElementType;
    label: string;
    gradient: string;
    border: string;
    iconClass: string;
    glow: string;
  }
> = {
  instagram: {
    Icon: Instagram,
    label: 'Instagram',
    gradient: 'from-fuchsia-500/20 via-pink-500/15 to-orange-500/20',
    border: 'border-fuchsia-400/35',
    iconClass: 'text-fuchsia-300',
    glow: 'group-hover:shadow-[0_0_20px_rgba(217,70,239,0.18)]',
  },
  youtube: {
    Icon: Youtube,
    label: 'YouTube',
    gradient: 'from-red-500/20 via-rose-500/15 to-orange-500/15',
    border: 'border-red-400/35',
    iconClass: 'text-red-300',
    glow: 'group-hover:shadow-[0_0_20px_rgba(248,113,113,0.18)]',
  },
  x: {
    Icon: XBrandIcon,
    label: 'X',
    gradient: 'from-zinc-400/15 via-zinc-300/10 to-zinc-500/15',
    border: 'border-zinc-400/30',
    iconClass: 'text-zinc-200',
    glow: 'group-hover:shadow-[0_0_20px_rgba(161,161,170,0.15)]',
  },
  twitch: {
    Icon: Twitch,
    label: 'Twitch',
    gradient: 'from-violet-500/20 via-purple-500/15 to-fuchsia-500/15',
    border: 'border-violet-400/35',
    iconClass: 'text-violet-300',
    glow: 'group-hover:shadow-[0_0_20px_rgba(167,139,250,0.18)]',
  },
};

function XBrandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function getHandle(url: string, platform: SocialPlatform): string {
  try {
    const parsed = new URL(url);
    const segment = parsed.pathname.replace(/^\/+/, '').split('/')[0] || '';
    if (platform === 'youtube') {
      const at = parsed.pathname.match(/@([^/]+)/);
      if (at) return `@${at[1]}`;
    }
    return segment.replace(/^@/, '') || parsed.hostname;
  } catch {
    return url.replace(/^@/, '');
  }
}

const SIZE_CONFIG = {
  sm: {
    grid: 'grid-cols-2 gap-2',
    card: 'h-[76px] px-2.5 py-2.5',
    iconWrap: 'w-7 h-7',
    icon: 'w-3.5 h-3.5',
    label: 'text-[7px]',
    handle: 'text-[10px]',
    external: 'w-2 h-2 top-1.5 right-1.5',
  },
  md: {
    grid: 'grid-cols-2 gap-2.5',
    card: 'h-[84px] px-3 py-3',
    iconWrap: 'w-8 h-8',
    icon: 'w-4 h-4',
    label: 'text-[8px]',
    handle: 'text-[11px]',
    external: 'w-2.5 h-2.5 top-2 right-2',
  },
} as const;

export default function ProfileSocialLinks({
  links,
  size = 'md',
  align = 'center',
  className = '',
}: ProfileSocialLinksProps) {
  if (!hasSocialLinks(links)) return null;

  const isCenter = align === 'center';
  const cfg = SIZE_CONFIG[size];
  const activePlatforms = SOCIAL_PLATFORMS.filter(({ key }) => links?.[key]?.trim());
  const count = activePlatforms.length;
  const gridClass =
    count === 1
      ? 'grid-cols-1'
      : count === 3
        ? 'grid-cols-2 [&>a:last-child]:col-span-2 [&>a:last-child]:max-w-[calc(50%-0.3125rem)] [&>a:last-child]:justify-self-center'
        : cfg.grid;

  return (
    <div
      className={`flex flex-col gap-2.5 w-full max-w-sm ${isCenter ? 'mx-auto' : ''} ${className}`}
    >
      <p
        className={`text-[9px] font-mono uppercase tracking-[0.2em] text-cyan-400/70 ${
          isCenter ? 'text-center' : 'text-left'
        }`}
      >
        Redes do criador
      </p>

      <div className={`grid w-full ${gridClass}`}>
        {activePlatforms.map(({ key }) => {
          const href = links![key]!;
          const style = PLATFORM_STYLES[key];
          const Icon = style.Icon;
          const handle = getHandle(href, key);

          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={`${style.label}: ${handle}`}
              className={`group relative flex w-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border bg-gradient-to-br ${style.gradient} ${style.border} backdrop-blur-sm transition-all hover:scale-[1.01] ${style.glow} ${cfg.card}`}
            >
              <span
                className={`flex shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-zinc-950/50 ${cfg.iconWrap}`}
              >
                <Icon className={`${cfg.icon} ${style.iconClass}`} />
              </span>

              <span className="flex w-full min-w-0 flex-col items-center gap-0.5 px-1 text-center">
                <span
                  className={`w-full truncate font-bold uppercase tracking-[0.14em] profile-text-muted ${cfg.label}`}
                >
                  {style.label}
                </span>
                <span className={`w-full truncate font-semibold profile-text ${cfg.handle}`}>
                  {handle}
                </span>
              </span>

              <ExternalLink
                className={`absolute opacity-0 transition-opacity group-hover:opacity-60 profile-text-muted ${cfg.external}`}
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}
