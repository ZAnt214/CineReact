import React from 'react';
import { motion } from 'motion/react';
import { getVisualStyle } from '../../data/rewardVisualStyles.ts';
import type { RewardVisualStyle } from '../../types/gamification.ts';

function StarField({ count = 6 }: { count?: number }) {
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

function BubbleField({ count = 5 }: { count?: number }) {
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

function SparkleField({ count = 4 }: { count?: number }) {
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
  children,
}: {
  visualStyle?: RewardVisualStyle;
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'full' | 'xl' | '2xl';
  className?: string;
  children?: React.ReactNode;
}) {
  const style = getVisualStyle(visualStyle);
  const sizeClass = size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';
  const roundClass = rounded === 'full' ? 'rounded-full' : rounded === '2xl' ? 'rounded-2xl' : 'rounded-xl';

  const useCssGradient = !!style.gradientCss;

  return (
    <motion.div
      className={`relative overflow-hidden ${sizeClass} ${roundClass} ${style.glow} ${className}`}
      whileHover={{ scale: 1.04 }}
      animate={
        style.animated && useCssGradient
          ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }
          : undefined
      }
      transition={style.animated ? { duration: 4, repeat: Infinity, ease: 'linear' } : undefined}
      style={
        useCssGradient
          ? {
              background: style.gradientCss,
              backgroundSize: style.animated ? '200% 200%' : undefined,
            }
          : undefined
      }
    >
      {!useCssGradient && (
        <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient}`} />
      )}

      {style.shimmer && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
        />
      )}

      {style.particles === 'stars' && <StarField />}
      {style.particles === 'bubbles' && <BubbleField />}
      {style.particles === 'sparkles' && <SparkleField />}
      {style.particles === 'confetti' &&
        ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b'].map((c, i) => (
          <motion.span
            key={c}
            className="absolute w-1 h-1 rounded-sm"
            style={{ background: c, top: `${20 + i * 15}%`, left: `${20 + i * 18}%` }}
            animate={{ y: [0, 6, 0], rotate: [0, 180, 360] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}

      {children && <div className="relative z-10 w-full h-full flex items-center justify-center">{children}</div>}
    </motion.div>
  );
}

export function PremiumFrameRing({
  visualStyle,
  size = 'md',
  children,
}: {
  visualStyle?: RewardVisualStyle;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}) {
  const style = getVisualStyle(visualStyle);
  const pad = size === 'sm' ? 'p-[3px]' : size === 'lg' ? 'p-[5px]' : size === 'xl' ? 'p-[6px]' : 'p-1';
  const useRotatingBorder = style.animated && !!style.gradientCss;

  const borderStyle: React.CSSProperties | undefined = useRotatingBorder
    ? {
        background: style.gradientCss,
        backgroundSize: style.animated ? '220% 220%' : undefined,
      }
    : undefined;

  return (
    <motion.div
      className={`relative inline-flex rounded-full ${pad} ${useRotatingBorder ? '' : style.ring}`}
      style={borderStyle}
      animate={
        style.animated
          ? useRotatingBorder
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
          : undefined
      }
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="relative rounded-full bg-zinc-950 p-[2px] shadow-inner shadow-black/60">
        {style.shimmer && (
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/0 via-white/25 to-white/0 pointer-events-none z-10"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
          />
        )}
        {children}
      </div>
    </motion.div>
  );
}

export function PremiumFullPreview({
  visualStyle,
  className = '',
}: {
  visualStyle?: RewardVisualStyle;
  className?: string;
}) {
  const style = getVisualStyle(visualStyle);

  return (
    <motion.div
      className={`relative w-full max-w-[260px] h-36 rounded-2xl border border-white/10 overflow-hidden ${className}`}
      style={
        style.gradientCss
          ? { background: style.gradientCss, backgroundSize: style.animated ? '200% 200%' : undefined }
          : undefined
      }
      animate={style.animated && style.gradientCss ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] } : undefined}
      transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
    >
      {!style.gradientCss && <motion.div className={`absolute inset-0 bg-gradient-to-br ${style.gradient}`} />}
      {style.particles === 'stars' && <StarField count={10} />}
      {style.particles === 'bubbles' && <BubbleField count={8} />}
      {style.particles === 'sparkles' && <SparkleField count={6} />}
      {style.shimmer && (
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
    </motion.div>
  );
}
