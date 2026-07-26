import { motion } from 'motion/react';

export type CineReactLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeStyles: Record<CineReactLogoSize, { scale: string; compact: boolean }> = {
  xs: { scale: 'cine-brand--xs', compact: true },
  sm: { scale: 'cine-brand--sm', compact: true },
  md: { scale: 'cine-brand--md', compact: false },
  lg: { scale: 'cine-brand--lg', compact: false },
  xl: { scale: 'cine-brand--xl', compact: false },
};

interface CineReactLogoProps {
  size?: CineReactLogoSize;
  align?: 'left' | 'center';
  animated?: boolean;
  className?: string;
  heading?: boolean;
}

function PlayMark() {
  return (
    <span className="cine-brand-play" aria-hidden>
      <svg viewBox="0 0 48 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="34" rx="9" fill="#FF0000" />
        <path d="M20 10.5v13l11-6.5-11-6.5Z" fill="#FFFFFF" />
      </svg>
    </span>
  );
}

function Perforations() {
  return (
    <span className="cine-brand-perfs" aria-hidden>
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className="cine-brand-perf" />
      ))}
    </span>
  );
}

function BrandLockup({
  scale,
  compact,
  heading,
}: {
  scale: string;
  compact: boolean;
  heading: boolean;
}) {
  const className = `cine-brand ${scale}`;

  const inner = (
    <span className="cine-brand-lockup">
      <PlayMark />
      <span className="cine-brand-panel">
        {!compact && <Perforations />}
        <span className="cine-brand-type">
          <span className="cine-brand-cine">Cine</span>
          <span className="cine-brand-react">React</span>
        </span>
        <span className="cine-brand-scrubber" aria-hidden>
          <span className="cine-brand-scrubber-track" />
          <span className="cine-brand-scrubber-fill" />
          <span className="cine-brand-scrubber-head" />
        </span>
      </span>
    </span>
  );

  if (heading) {
    return <h1 className={className}>{inner}</h1>;
  }

  return <div className={className}>{inner}</div>;
}

export default function CineReactLogo({
  size = 'md',
  align = 'left',
  animated = false,
  className = '',
  heading = false,
}: CineReactLogoProps) {
  const styles = sizeStyles[size];
  const wrapperClass = `select-none inline-block ${align === 'center' ? 'mx-auto block w-fit' : ''} ${className}`;

  const lockup = (
    <BrandLockup scale={styles.scale} compact={styles.compact} heading={heading} />
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={wrapperClass}
        aria-label="CineReact"
      >
        {lockup}
      </motion.div>
    );
  }

  return (
    <div className={wrapperClass} aria-label="CineReact">
      {lockup}
    </div>
  );
}
