import { motion } from 'motion/react';

export type CineReactLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeStyles: Record<CineReactLogoSize, string> = {
  xs: 'text-[1.05rem]',
  sm: 'text-[1.2rem] sm:text-[1.35rem]',
  md: 'text-[1.5rem] sm:text-[1.75rem]',
  lg: 'text-[2.5rem] sm:text-[3rem]',
  xl: 'text-[3rem] sm:text-[3.75rem]',
};

interface CineReactLogoProps {
  size?: CineReactLogoSize;
  align?: 'left' | 'center';
  animated?: boolean;
  className?: string;
  heading?: boolean;
}

function Wordmark({ sizeClass, heading }: { sizeClass: string; heading: boolean }) {
  const className = `cine-wordmark ${sizeClass}`;

  if (heading) {
    return (
      <h1 className={className}>
        <span className="cine-wordmark-cine">Cine</span>
        <span className="cine-wordmark-react">React</span>
      </h1>
    );
  }

  return (
    <div className={className} aria-hidden>
      <span className="cine-wordmark-cine">Cine</span>
      <span className="cine-wordmark-react">React</span>
    </div>
  );
}

export default function CineReactLogo({
  size = 'md',
  align = 'left',
  animated = false,
  className = '',
  heading = false,
}: CineReactLogoProps) {
  const sizeClass = sizeStyles[size];
  const wrapperClass = `select-none inline-block ${align === 'center' ? 'mx-auto' : ''} ${className}`;

  const wordmark = <Wordmark sizeClass={sizeClass} heading={heading} />;

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
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
