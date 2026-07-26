import { motion } from 'motion/react';

export type CineReactLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeStyles: Record<
  CineReactLogoSize,
  { text: string; icon: string; showGlow: boolean; gap: string }
> = {
  xs: { text: 'text-sm', icon: 'w-6 h-6', showGlow: false, gap: 'gap-1.5' },
  sm: { text: 'text-base sm:text-lg', icon: 'w-7 h-7', showGlow: false, gap: 'gap-2' },
  md: { text: 'text-xl sm:text-2xl', icon: 'w-9 h-9', showGlow: false, gap: 'gap-2.5' },
  lg: { text: 'text-4xl sm:text-5xl', icon: 'w-14 h-14', showGlow: true, gap: 'gap-3' },
  xl: { text: 'text-5xl xl:text-6xl', icon: 'w-16 h-16', showGlow: true, gap: 'gap-3.5' },
};

interface CineReactLogoProps {
  size?: CineReactLogoSize;
  align?: 'left' | 'center';
  animated?: boolean;
  showGlow?: boolean;
  className?: string;
  heading?: boolean;
}

function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#cinereact-mark-bg)" />
      <rect
        x="2.5"
        y="2.5"
        width="43"
        height="43"
        rx="13.5"
        stroke="url(#cinereact-mark-ring)"
        strokeWidth="1"
      />
      <rect
        x="14"
        y="15"
        width="20"
        height="18"
        rx="3"
        stroke="#e7e5e4"
        strokeWidth="1.5"
        fill="none"
      />
      <path d="M14 20h20" stroke="#a8a29e" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M22 23.5 28.5 27 22 30.5V23.5Z" fill="#fafaf9" />
      <defs>
        <linearGradient id="cinereact-mark-bg" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#27272a" />
          <stop offset="1" stopColor="#18181b" />
        </linearGradient>
        <linearGradient id="cinereact-mark-ring" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d6d3d1" stopOpacity="0.55" />
          <stop offset="1" stopColor="#78716c" stopOpacity="0.25" />
        </linearGradient>
      </defs>
    </svg>
  );
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
      className={`relative inline-flex items-center ${styles.gap} ${
        align === 'center' ? 'mx-auto' : ''
      }`}
    >
      {glowEnabled && (
        <motion.div
          className="absolute -inset-6 bg-stone-400/8 blur-3xl rounded-full pointer-events-none"
          animate={{ opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <LogoMark className={`${styles.icon} shrink-0 relative z-10`} />

      <Tag
        className={`relative z-10 font-fredoka font-bold leading-none tracking-tight ${styles.text}`}
      >
        <span className="text-stone-100">Cine</span>
        <span className="bg-gradient-to-r from-stone-300 via-stone-200 to-stone-400 bg-clip-text text-transparent">
          React
        </span>
      </Tag>
    </div>
  );

  const wrapperClass = `select-none ${align === 'center' ? 'text-center' : 'text-left'} ${className}`;

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
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
