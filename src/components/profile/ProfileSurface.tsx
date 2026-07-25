import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { getVisualStyle } from '../../data/rewardVisualStyles.ts';
import { resolvePublicProfileDisplay } from '../../gamification/profileDisplay.ts';
import type { ProfileLoadout, PublicProfileDisplay, RewardVisualStyle } from '../../types/gamification.ts';

function LayerParticles({ style }: { style: RewardVisualStyle }) {
  const cfg = getVisualStyle(style);
  if (!cfg.particles) return null;

  if (cfg.particles === 'stars') {
    return (
      <>
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute w-0.5 h-0.5 rounded-full bg-white/80"
            style={{ top: `${8 + (i * 13) % 84}%`, left: `${6 + (i * 19) % 88}%` }}
            animate={{ opacity: [0.15, 0.9, 0.15], scale: [0.7, 1.3, 0.7] }}
            transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </>
    );
  }

  if (cfg.particles === 'bubbles') {
    const colors = ['bg-pink-400/30', 'bg-sky-400/30', 'bg-fuchsia-400/25'];
    return (
      <>
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.span
            key={i}
            className={`absolute rounded-full ${colors[i % colors.length]}`}
            style={{
              width: 6 + (i % 3) * 4,
              height: 6 + (i % 3) * 4,
              bottom: `${8 + (i * 11) % 70}%`,
              left: `${10 + (i * 14) % 80}%`,
            }}
            animate={{ y: [0, -12, 0], opacity: [0.25, 0.7, 0.25] }}
            transition={{ duration: 3 + i * 0.2, repeat: Infinity }}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute text-[10px] text-white/50"
          style={{ top: `${12 + i * 14}%`, right: `${8 + i * 12}%` }}
          animate={{ opacity: [0, 0.8, 0], scale: [0.6, 1, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.35 }}
        >
          ✦
        </motion.span>
      ))}
    </>
  );
}

function StyleLayer({
  visualStyle,
  opacity = 1,
  className = '',
}: {
  visualStyle?: RewardVisualStyle;
  opacity?: number;
  className?: string;
}) {
  if (!visualStyle) return null;
  const style = getVisualStyle(visualStyle);
  const useCss = !!style.gradientCss;

  return (
    <motion.div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity }}
      animate={
        style.animated && useCss
          ? { backgroundPosition: ['0% 40%', '100% 60%', '0% 40%'] }
          : style.animated
            ? { opacity: [opacity * 0.75, opacity, opacity * 0.75] }
            : undefined
      }
      transition={{ duration: style.animated && useCss ? 8 : 4, repeat: Infinity, ease: 'linear' }}
    >
      <motion.div
        className="absolute inset-0"
        style={
          useCss
            ? { background: style.gradientCss, backgroundSize: style.animated ? '220% 220%' : undefined }
            : undefined
        }
      >
        {!useCss && (
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${style.gradient}`}
            animate={style.animated ? { opacity: [0.82, 1, 0.82], scale: [1, 1.03, 1] } : undefined}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </motion.div>
      {style.shimmer && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/18 to-transparent"
          animate={{ x: ['-120%', '120%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.8 }}
        />
      )}
      <LayerParticles style={visualStyle} />
    </motion.div>
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
    <motion.div
      layout
      className={`relative overflow-hidden border border-zinc-800/70 bg-zinc-950/40 ${rounded} ${pad} min-h-0 ${className}`}
    >
      <StyleLayer visualStyle={display.backgroundVisualStyle} opacity={1} />
      <StyleLayer visualStyle={display.themeVisualStyle} opacity={0.88} className="mix-blend-screen" />
      {display.effectVisualStyle && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0.55, 0.92, 0.55] }}
          transition={{ duration: 3.2, repeat: Infinity }}
        >
          <StyleLayer visualStyle={display.effectVisualStyle} opacity={0.62} className="mix-blend-soft-light" />
        </motion.div>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/5 via-zinc-950/20 to-zinc-950/40 pointer-events-none" />

      {hasCard ? (
        <div
          className={`relative z-10 overflow-hidden rounded-2xl border border-white/10 backdrop-blur-sm ${innerClassName}`}
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
    </motion.div>
  );
}
