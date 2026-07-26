import { motion } from 'motion/react';

export type CineReactLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeStyles: Record<CineReactLogoSize, string> = {
  xs: 'cine-wordmark--xs',
  sm: 'cine-wordmark--sm',
  md: 'cine-wordmark--md',
  lg: 'cine-wordmark--lg',
  xl: 'cine-wordmark--xl',
};

interface CineReactLogoProps {
  size?: CineReactLogoSize;
  align?: 'left' | 'center';
  animated?: boolean;
  className?: string;
  heading?: boolean;
}

function Lockup({ sizeClass, heading }: { sizeClass: string; heading: boolean }) {
  const className = `cine-wordmark ${sizeClass}`;

  const inner = (
    <span className="cine-wordmark-frame">
      <span className="cine-wordmark-text">
        C<span className="cine-wordmark-i">i</span>
        <span className="cine-wordmark-join">ne</span>
        <span className="cine-wordmark-join">R</span>
        eact
      </span>
      <span className="cine-wordmark-rail" aria-hidden />
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
  const sizeClass = sizeStyles[size];
  const wrapperClass = `select-none inline-block ${align === 'center' ? 'mx-auto block w-fit' : ''} ${className}`;

  const wordmark = <Lockup sizeClass={sizeClass} heading={heading} />;

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
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
