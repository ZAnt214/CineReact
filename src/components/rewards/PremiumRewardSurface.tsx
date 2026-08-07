import React from 'react';
import { motion } from 'motion/react';
import { getVisualStyle } from '../../data/rewardVisualStyles.ts';
import type { RewardVisualStyle } from '../../types/gamification.ts';

function StarField({ count = 6, lite = false }: { count?: number; lite?: boolean }) {
  if (lite) return null;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-white"
          style={{
            top: `${15 + (i * 17) % 70}%`,
            left: `${10 + (i * 23) % 80}%`,
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.5 + (i % 3), repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </>
  );
}

function BubbleField({ count = 5, lite = false }: { count?: number; lite?: boolean }) {
  if (lite) return null;
  const colors = ['bg-pink-300/40', 'bg-sky-300/40', 'bg-fuchsia-300/40', 'bg-violet-300/30'];
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className={`absolute rounded-full ${colors[i % colors.length]}`}
          style={{
            width: 4 + (i % 3) * 3,
            height: 4 + (i % 3) * 3,
            bottom: `${10 + (i * 15) % 60}%`,
            left: `${15 + (i * 18) % 70}%`,
          }}
          animate={{ y: [0, -8, 0], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
        />
      ))}
    </>
  );
}

function SparkleField({ count = 4, lite = false }: { count?: number; lite?: boolean }) {
  if (lite) return null;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute text-[8px] text-white/70"
          style={{ top: `${20 + i * 18}%`, right: `${10 + i * 15}%` }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4 }}
        >
          ✦
        </motion.span>
      ))}
    </>
  );
}

export function PremiumRewardSurface({
  visualStyle,
  size = 'md',
  rounded = 'xl',
  className = '',
  lite = false,
  children,
}: {
  visualStyle?: RewardVisualStyle;
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'full' | 'xl' | '2xl';
  className?: string;
  lite?: boolean;
  children?: React.ReactNode;
}) {
  const style = getVisualStyle(visualStyle);
  const sizeClass = size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';
  const roundClass = rounded === 'full' ? 'rounded-full' : rounded === '2xl' ? 'rounded-2xl' : 'rounded-xl';
  const useCssGradient = !!style.gradientCss;
  const animated = style.animated && !lite;
  const showShimmer = style.shimmer && !lite;

  const surfaceStyle: React.CSSProperties | undefined = useCssGradient
    ? {
        background: style.gradientCss,
        backgroundSize: animated ? '200% 200%' : undefined,
      }
    : undefined;

  const inner = (
    <>
      {!useCssGradient && (
        <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient}`} />
      )}

      {showShimmer && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
        />
      )}

      {style.particles === 'stars' && <StarField lite={lite} />}
      {style.particles === 'bubbles' && <BubbleField lite={lite} />}
      {style.particles === 'sparkles' && <SparkleField lite={lite} />}
      {style.particles === 'confetti' && !lite &&
        ['#ef4444', '#22c55e', '#3b82f6', '#9d92a8'].map((c, i) => (
          <motion.span
            key={c}
            className="absolute w-1 h-1 rounded-sm"
            style={{ background: c, top: `${20 + i * 15}%`, left: `${20 + i * 18}%` }}
            animate={{ y: [0, 6, 0], rotate: [0, 180, 360] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}

      {children && <div className="relative z-10 w-full h-full flex items-center justify-center">{children}</div>}
    </>
  );

  if (lite) {
    return (
      <div
        className={`relative overflow-hidden ${sizeClass} ${roundClass} ${style.glow} ${className}`}
        style={surfaceStyle}
      >
        {inner}
      </div>
    );
  }

  return (
    <motion.div
      className={`relative overflow-hidden ${sizeClass} ${roundClass} ${style.glow} ${className}`}
      whileHover={{ scale: 1.04 }}
      animate={
        animated && useCssGradient
          ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }
          : undefined
      }
      transition={animated ? { duration: 4, repeat: Infinity, ease: 'linear' } : undefined}
      style={surfaceStyle}
    >
      {inner}
    </motion.div>
  );
}

export function PremiumFrameRing({
  visualStyle,
  size = 'md',
  lite = false,
  children,
}: {
  visualStyle?: RewardVisualStyle;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  lite?: boolean;
  children: React.ReactNode;
}) {
  const style = getVisualStyle(visualStyle);
  const pad = size === 'sm' ? 'p-[3px]' : size === 'lg' ? 'p-[5px]' : size === 'xl' ? 'p-[6px]' : 'p-1';
  const useRotatingBorder = style.animated && !!style.gradientCss && !lite;

  const borderStyle: React.CSSProperties | undefined = style.gradientCss
    ? {
        background: style.gradientCss,
        backgroundSize: useRotatingBorder ? '220% 220%' : undefined,
      }
    : undefined;

  const ringClass = `relative inline-flex rounded-full ${pad} ${useRotatingBorder ? '' : style.ring}`;

  const inner = (
    <div className="relative rounded-full bg-neutral-950 p-[2px] shadow-inner shadow-black/60">
      {!lite && style.shimmer && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/0 via-white/25 to-white/0 pointer-events-none z-10"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {children}
    </div>
  );

  if (lite || !style.animated) {
    return (
      <div className={ringClass} style={borderStyle}>
        {inner}
      </div>
    );
  }

  return (
    <motion.div
      className={ringClass}
      style={borderStyle}
      animate={
        useRotatingBorder
          ? {
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              boxShadow: [
                '0 0 16px rgba(255,255,255,0.12)',
                '0 0 36px rgba(168,85,247,0.55)',
                '0 0 16px rgba(255,255,255,0.12)',
              ],
            }
          : {
              boxShadow: [
                '0 0 14px rgba(255,255,255,0.15)',
                '0 0 36px rgba(168,85,247,0.5)',
                '0 0 14px rgba(255,255,255,0.15)',
              ],
            }
      }
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      {inner}
    </motion.div>
  );
}

export function PremiumFullPreview({
  visualStyle,
  className = '',
  lite = false,
}: {
  visualStyle?: RewardVisualStyle;
  className?: string;
  lite?: boolean;
}) {
  const style = getVisualStyle(visualStyle);
  const animated = style.animated && !lite;

  const inner = (
    <>
      {!style.gradientCss && <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient}`} />}
      {style.particles === 'stars' && <StarField count={10} lite={lite} />}
      {style.particles === 'bubbles' && <BubbleField count={8} lite={lite} />}
      {style.particles === 'sparkles' && <SparkleField count={6} lite={lite} />}
      {!lite && style.shimmer && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }}
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-black uppercase tracking-[0.2em] ${style.accent} drop-shadow-lg`}>
          {style.label}
        </span>
      </div>
    </>
  );

  if (lite) {
    return (
      <div
        className={`relative w-full max-w-[260px] h-36 rounded-2xl border border-white/10 overflow-hidden ${className}`}
        style={style.gradientCss ? { background: style.gradientCss } : undefined}
      >
        {inner}
      </div>
    );
  }

  return (
    <motion.div
      className={`relative w-full max-w-[260px] h-36 rounded-2xl border border-white/10 overflow-hidden ${className}`}
      style={
        style.gradientCss
          ? { background: style.gradientCss, backgroundSize: animated ? '200% 200%' : undefined }
          : undefined
      }
      animate={animated && style.gradientCss ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] } : undefined}
      transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
    >
      {inner}
    </motion.div>
  );
}
