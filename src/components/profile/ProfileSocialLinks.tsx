import React from 'react';
import { Instagram, Youtube, Twitch, ArrowUpRight } from 'lucide-react';
import type { CreatorSocialLinks } from '../../types.ts';
import { hasSocialLinks, SOCIAL_PLATFORMS, type SocialPlatform } from '../../utils/socialLinks.ts';

export interface ProfileSocialLinksProps {
  links?: CreatorSocialLinks | null;
  size?: 'sm' | 'md';
  align?: 'center' | 'start';
  variant?: 'default' | 'neutral';
  className?: string;
}

const PLATFORM_STYLES: Record<
  SocialPlatform,
  {
    Icon: React.ElementType;
    label: string;
    accent: string;
    iconClass: string;
  }
> = {
  instagram: {
    Icon: Instagram,
    label: 'Instagram',
    accent: 'from-fuchsia-400 via-pink-400 to-fuchsia-500',
    iconClass: 'text-fuchsia-300',
  },
  youtube: {
    Icon: Youtube,
    label: 'YouTube',
    accent: 'from-cine-accent-light to-cine-accent',
    iconClass: 'text-cine-cream',
  },
  x: {
    Icon: XBrandIcon,
    label: 'X',
    accent: 'from-cine-accent-light via-cine-accent to-cine-accent-dark',
    iconClass: 'text-cine-accent-light',
  },
  twitch: {
    Icon: Twitch,
    label: 'Twitch',
    accent: 'from-zinc-500 via-zinc-400 to-zinc-500',
    iconClass: 'text-zinc-300',
  },
  tiktok: {
    Icon: TikTokIcon,
    label: 'TikTok',
    accent: 'from-cine-accent-light via-cine-accent to-cine-accent-dark',
    iconClass: 'text-cine-accent-light',
  },
  discord: {
    Icon: DiscordIcon,
    label: 'Discord',
    accent: 'from-indigo-400 via-violet-500 to-indigo-500',
    iconClass: 'text-indigo-300',
  },
};

function XBrandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
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
    if (platform === 'tiktok') {
      const at = parsed.pathname.match(/@([^/]+)/);
      if (at) return `@${at[1]}`;
    }
    if (platform === 'discord') {
      const invite = parsed.pathname.replace(/^\/+/, '');
      return invite ? invite.split('/')[0] : parsed.hostname;
    }
    const handle = segment.replace(/^@/, '') || parsed.hostname;
    return handle.startsWith('@') ? handle : `@${handle}`;
  } catch {
    const raw = url.replace(/^@/, '');
    return raw.startsWith('@') ? raw : `@${raw}`;
  }
}

const SIZE_CONFIG = {
  sm: {
    strip: 'h-10 px-3 gap-2.5',
    icon: 'w-3.5 h-3.5',
    platform: 'text-[9px] w-[4.25rem]',
    handle: 'text-[11px]',
    arrow: 'w-3.5 h-3.5',
    heading: 'text-sm',
  },
  md: {
    strip: 'h-11 px-3.5 gap-3',
    icon: 'w-4 h-4',
    platform: 'text-[10px] w-[4.75rem]',
    handle: 'text-xs',
    arrow: 'w-4 h-4',
    heading: 'text-base',
  },
} as const;

export default function ProfileSocialLinks({
  links,
  size = 'md',
  align = 'center',
  variant = 'default',
  className = '',
}: ProfileSocialLinksProps) {
  if (!hasSocialLinks(links)) return null;

  const isCenter = align === 'center';
  const isNeutral = variant === 'neutral';
  const cfg = SIZE_CONFIG[size];
  const activePlatforms = SOCIAL_PLATFORMS.filter(({ key }) => links?.[key]?.trim());

  return (
    <div
      className={`flex w-full max-w-sm flex-col gap-2 ${isCenter ? 'mx-auto' : ''} ${className}`}
    >
      <div className={isCenter ? 'text-center' : 'text-left'}>
        <p className={`profile-social-heading ${cfg.heading} leading-tight`}>
          Onde me encontrar
        </p>
        <p className={`mt-0.5 text-[10px] font-medium tracking-wide ${isNeutral ? 'text-zinc-500' : 'text-cine-accent/45'}`}>
          Minhas redes oficiais
        </p>
      </div>

      <div className="flex w-full flex-col gap-1.5">
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
              className={`group relative flex w-full min-w-0 items-center overflow-hidden rounded-lg border transition-colors ${cfg.strip} ${
                isNeutral
                  ? 'border-neutral-800/80 bg-neutral-950 hover:border-neutral-700 hover:bg-neutral-900/80'
                  : 'border-cine-accent/12 bg-cine-card-deep hover:border-cine-accent/28 hover:bg-cine-surface'
              }`}
            >
              <span
                className={`absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${style.accent} opacity-80`}
                aria-hidden
              />

              <span className="ml-1 flex shrink-0 items-center justify-center">
                <Icon className={`${cfg.icon} ${style.iconClass}`} />
              </span>

              <span
                className={`shrink-0 font-semibold uppercase tracking-[0.12em] ${cfg.platform} ${
                  isNeutral ? 'text-zinc-500' : 'text-cine-accent/55'
                }`}
              >
                {style.label}
              </span>

              <span className={`min-w-0 flex-1 truncate font-medium text-zinc-100 ${cfg.handle}`}>
                {handle}
              </span>

              <ArrowUpRight
                className={`shrink-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${cfg.arrow} ${
                  isNeutral
                    ? 'text-zinc-600 group-hover:text-zinc-400'
                    : 'text-cine-accent/35 group-hover:text-cine-accent-light/80'
                }`}
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}
