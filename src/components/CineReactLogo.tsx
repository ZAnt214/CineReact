import { motion } from 'motion/react';

export type CineReactLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeStyles: Record<
  CineReactLogoSize,
  { text: string; showGlow: boolean; reactTilt: boolean }
> = {
  xs: {
    text: 'text-sm',
    showGlow: false,
    reactTilt: false,
  },
  sm: {
    text: 'text-base sm:text-lg',
    showGlow: false,
    reactTilt: false,
  },
  md: {
    text: 'text-xl sm:text-2xl',
    showGlow: false,
    reactTilt: true,
  },
  lg: {
    text: 'text-5xl sm:text-6xl',
    showGlow: true,
    reactTilt: true,
  },
  xl: {
    text: 'text-6xl xl:text-7xl',
    showGlow: true,
    reactTilt: true,
  },
};

interface CineReactLogoProps {
  size?: CineReactLogoSize;
  align?: 'left' | 'center';
  animated?: boolean;
  showGlow?: boolean;
  className?: string;
  heading?: boolean;
}

export default function CineReactLogo({
  size = 'md',
  align = 'left',
  animated = false,
  showGlow,
  className = '',
  heading = false,
}: CineReactLogoProps) {
  const styles = sizeStyles[size];
  const glowEnabled = showGlow ?? styles.showGlow;
  const Tag = heading ? 'h1' : 'div';

  const wordmark = (
    <div
      className={`relative inline-block ${align === 'center' ? 'mx-auto' : 'px-0.5'}`}
    >
      {glowEnabled && (
        <motion.div
          className="absolute -inset-4 bg-amber-500/10 blur-3xl rounded-full pointer-events-none"
          animate={{ opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <Tag
        className={`relative font-bungee leading-[0.9] tracking-tight ${styles.text}`}
      >
        <span className="block text-white drop-shadow-[0_4px_20px_rgba(255,255,255,0.15)]">
          CINE
        </span>
        <span
          className={`block mt-0.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_6px_24px_rgba(245,158,11,0.4)] ${
            styles.reactTilt ? '-rotate-1 origin-left' : ''
          }`}
        >
          REACT
          <span className="inline-block text-amber-400 ml-0.5 animate-bounce">!</span>
        </span>
      </Tag>
    </div>
  );

  const wrapperClass = `select-none ${align === 'center' ? 'text-center' : 'text-left'} ${className}`;

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={wrapperClass}
        aria-label="CineReact"
      >
        {wordmark}
      </motion.div>
    );
  }

  return (
    <div className={wrapperClass} aria-label="CineReact">
      {wordmark}
    </div>
  );
}
