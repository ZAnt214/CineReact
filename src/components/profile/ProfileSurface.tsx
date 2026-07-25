import React, { useMemo } from 'react';
import { getVisualStyle } from '../../data/rewardVisualStyles.ts';
import { resolvePublicProfileDisplay } from '../../gamification/profileDisplay.ts';
import type { ProfileLoadout, PublicProfileDisplay, RewardVisualStyle } from '../../types/gamification.ts';

function LayerParticles({ style }: { style: RewardVisualStyle }) {
  const cfg = getVisualStyle(style);
  if (!cfg.particles) return null;

  const count = cfg.particles === 'stars' ? 5 : cfg.particles === 'bubbles' ? 4 : 3;

  if (cfg.particles === 'bubbles') {
    const colors = ['bg-pink-400/25', 'bg-sky-400/25', 'bg-fuchsia-400/20'];
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            className={`absolute rounded-full profile-surface-star ${colors[i % colors.length]}`}
            style={{
              width: 5 + (i % 2) * 3,
              height: 5 + (i % 2) * 3,
              bottom: `${12 + (i * 18) % 65}%`,
              left: `${12 + (i * 22) % 75}%`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-white/70 profile-surface-star"
          style={{
            top: `${10 + (i * 17) % 80}%`,
            left: `${8 + (i * 21) % 85}%`,
            animationDelay: `${i * 0.45}s`,
          }}
        />
      ))}
    </>
  );
}

function StyleLayer({
  visualStyle,
  opacity = 1,
  className = '',
  pulse = false,
}: {
  visualStyle?: RewardVisualStyle;
  opacity?: number;
  className?: string;
  pulse?: boolean;
}) {
  if (!visualStyle) return null;
  const style = getVisualStyle(visualStyle);
  const useCss = !!style.gradientCss;

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${pulse ? 'profile-surface-pulse' : ''} ${className}`}
      style={{ opacity }}
    >
      <div
        className={`absolute inset-0 ${useCss && style.animated ? 'profile-surface-gradient' : ''} ${style.shimmer ? 'profile-surface-shimmer overflow-hidden' : ''}`}
        style={useCss ? { background: style.gradientCss } : undefined}
      >
        {!useCss && <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient}`} />}
      </div>
      <LayerParticles style={visualStyle} />
    </div>
  );
}

export interface ProfileSurfaceProps {
  loadout?: ProfileLoadout | null;
  profileDisplay?: PublicProfileDisplay | null;
  variant?: 'hero' | 'panel' | 'preview';
  rounded?: string;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
}

export default function ProfileSurface({
  loadout,
  profileDisplay,
  variant = 'preview',
  rounded = 'rounded-3xl',
  className = '',
  innerClassName = '',
  children,
}: ProfileSurfaceProps) {
  const display = useMemo(
    () => profileDisplay || resolvePublicProfileDisplay(loadout),
    [profileDisplay, loadout]
  );

  const pad = variant === 'hero' ? 'p-6 md:p-10' : variant === 'panel' ? 'p-8' : 'p-8';
  const hasCard = !!display.profileCardVisualStyle;
  const cardStyle = hasCard ? getVisualStyle(display.profileCardVisualStyle) : null;

  return (
    <div
      className={`profile-surface-root relative overflow-hidden border border-zinc-800/70 bg-zinc-950/40 ${rounded} ${pad} min-h-0 ${className}`}
    >
      <StyleLayer visualStyle={display.backgroundVisualStyle} opacity={1} />
      <StyleLayer visualStyle={display.themeVisualStyle} opacity={0.72} />
      {display.effectVisualStyle && (
        <StyleLayer visualStyle={display.effectVisualStyle} opacity={0.5} pulse />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/5 via-zinc-950/18 to-zinc-950/38 pointer-events-none" />

      {hasCard ? (
        <div
          className={`relative z-10 overflow-hidden rounded-2xl border border-white/10 ${innerClassName} ${cardStyle?.animated && cardStyle.gradientCss ? 'profile-surface-gradient' : ''}`}
          style={
            cardStyle?.gradientCss
              ? { background: cardStyle.gradientCss, backgroundSize: cardStyle.animated ? '200% 200%' : undefined }
              : undefined
          }
        >
          {!cardStyle?.gradientCss && cardStyle && (
            <div className={`absolute inset-0 bg-gradient-to-br ${cardStyle.gradient} opacity-95`} />
          )}
          <div className="relative p-6">{children}</div>
        </div>
      ) : (
        <div className={`relative z-10 ${innerClassName}`}>{children}</div>
      )}
    </div>
  );
}
