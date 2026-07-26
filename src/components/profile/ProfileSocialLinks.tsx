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
  }
> = {
  instagram: {
    Icon: Instagram,
    label: 'Instagram',
    gradient: 'from-fuchsia-500/20 via-pink-500/15 to-orange-500/20',
    border: 'border-fuchsia-400/35',
    iconClass: 'text-fuchsia-300',
  },
  youtube: {
    Icon: Youtube,
    label: 'YouTube',
    gradient: 'from-red-500/20 via-rose-500/15 to-orange-500/15',
    border: 'border-red-400/35',
    iconClass: 'text-red-300',
  },
  x: {
    Icon: XBrandIcon,
    label: 'X',
    gradient: 'from-zinc-400/15 via-zinc-300/10 to-zinc-500/15',
    border: 'border-zinc-400/30',
    iconClass: 'text-zinc-200',
  },
  twitch: {
    Icon: Twitch,
    label: 'Twitch',
    gradient: 'from-violet-500/20 via-purple-500/15 to-fuchsia-500/15',
    border: 'border-violet-400/35',
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
    return segment.replace(/^@/, '') || parsed.hostname;
  } catch {
    return url.replace(/^@/, '');
  }
}

export default function ProfileSocialLinks({
  links,
  size = 'md',
  align = 'center',
  className = '',
}: ProfileSocialLinksProps) {
  if (!hasSocialLinks(links)) return null;

  const isMd = size === 'md';
  const isCenter = align === 'center';
  const activePlatforms = SOCIAL_PLATFORMS.filter(({ key }) => links?.[key]?.trim());

  return (
    <div className={`flex flex-col gap-2 w-full ${isCenter ? 'items-center' : 'items-start'} ${className}`}>
      <p className={`text-[9px] font-mono uppercase tracking-[0.2em] text-cyan-400/70 w-full ${isCenter ? 'text-center' : 'text-left'}`}>
        Redes do criador
      </p>
      <div className={`flex flex-wrap gap-2 w-full ${isCenter ? 'justify-center' : 'justify-start'}`}>
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
              className={`group relative inline-flex items-center gap-2 rounded-xl border bg-gradient-to-r ${style.gradient} ${style.border} backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(34,211,238,0.12)] ${
                isMd ? 'px-3 py-2 min-w-[120px]' : 'px-2.5 py-1.5 min-w-[100px]'
              }`}
            >
              <span
                className={`flex items-center justify-center rounded-lg bg-zinc-950/50 border border-white/[0.06] shrink-0 ${
                  isMd ? 'w-7 h-7' : 'w-6 h-6'
                }`}
              >
                <Icon className={`${isMd ? 'w-3.5 h-3.5' : 'w-3 h-3'} ${style.iconClass}`} />
              </span>
              <span className="flex flex-col min-w-0 text-left">
                <span className={`font-bold uppercase tracking-[0.14em] profile-text-muted ${isMd ? 'text-[8px]' : 'text-[7px]'}`}>
                  {style.label}
                </span>
                <span className={`font-semibold profile-text truncate ${isMd ? 'text-[11px]' : 'text-[10px]'}`}>
                  {handle}
                </span>
              </span>
              <ExternalLink
                className={`absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-60 transition-opacity profile-text-muted ${
                  isMd ? 'w-2.5 h-2.5' : 'w-2 h-2'
                }`}
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}
