import { motion } from 'motion/react';

export type CineReactLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeStyles: Record<CineReactLogoSize, { scale: string; showGlow: boolean }> = {
  xs: { scale: 'text-[1rem]', showGlow: false },
  sm: { scale: 'text-[1.15rem] sm:text-[1.3rem]', showGlow: false },
  md: { scale: 'text-[1.45rem] sm:text-[1.7rem]', showGlow: false },
  lg: { scale: 'text-[2.75rem] sm:text-[3.4rem]', showGlow: true },
  xl: { scale: 'text-[3.4rem] xl:text-[4.2rem]', showGlow: true },
};

interface CineReactLogoProps {
  size?: CineReactLogoSize;
  align?: 'left' | 'center';
  animated?: boolean;
  showGlow?: boolean;
  className?: string;
  heading?: boolean;
}

function Lettermark({
  scale,
  showGlow,
  heading,
  align,
}: {
  scale: string;
  showGlow: boolean;
  heading: boolean;
  align: 'left' | 'center';
}) {
  const labelClass = `cine-lettermark relative z-10 ${scale}`;

  const inner = (
    <>
      <span className="cine-lettermark-cine">cine</span>
      <span className="cine-lettermark-sep" aria-hidden />
      <span className="cine-lettermark-react">React</span>
    </>
  );

  return (
    <div className={`relative inline-flex ${align === 'center' ? 'justify-center' : ''}`}>
      {showGlow && (
        <motion.div
          className="absolute -inset-10 bg-cine-mint/8 blur-3xl rounded-full pointer-events-none"
          animate={{ opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {heading ? (
        <h1 className={labelClass}>{inner}</h1>
      ) : (
        <div className={labelClass} aria-hidden>
          {inner}
        </div>
      )}
    </div>
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

  const wordmark = (
    <Lettermark scale={styles.scale} showGlow={glowEnabled} heading={heading} align={align} />
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
