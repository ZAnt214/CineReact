import React from 'react';
import { Instagram, Youtube, Twitch, ArrowUpRight } from 'lucide-react';
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
    accent: 'from-cyan-300 via-sky-300 to-cyan-400',
    iconClass: 'text-cyan-200',
  },
  twitch: {
    Icon: Twitch,
    label: 'Twitch',
    accent: 'from-violet-400 via-fuchsia-400 to-violet-500',
    iconClass: 'text-violet-300',
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
  className = '',
}: ProfileSocialLinksProps) {
  if (!hasSocialLinks(links)) return null;

  const isCenter = align === 'center';
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
        <p className="mt-0.5 text-[10px] text-cyan-200/45 font-medium tracking-wide">
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
              className={`group relative flex w-full min-w-0 items-center overflow-hidden rounded-lg border border-fuchsia-500/10 bg-neutral-950/75 backdrop-blur-sm transition-all hover:border-cyan-400/25 hover:bg-neutral-900/80 hover:shadow-[0_0_18px_rgba(34,211,238,0.08)] ${cfg.strip}`}
            >
              <span
                className={`absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${style.accent} opacity-80`}
                aria-hidden
              />

              <span className="ml-1 flex shrink-0 items-center justify-center">
                <Icon className={`${cfg.icon} ${style.iconClass}`} />
              </span>

              <span
                className={`shrink-0 font-semibold uppercase tracking-[0.12em] text-cyan-200/55 ${cfg.platform}`}
              >
                {style.label}
              </span>

              <span className={`min-w-0 flex-1 truncate font-medium text-zinc-100 ${cfg.handle}`}>
                {handle}
              </span>

              <ArrowUpRight
                className={`shrink-0 text-cyan-300/35 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cyan-200/80 ${cfg.arrow}`}
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}
