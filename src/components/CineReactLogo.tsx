import { motion } from 'motion/react';

export type CineReactLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeStyles: Record<CineReactLogoSize, string> = {
  xs: 'cine-brand--xs',
  sm: 'cine-brand--sm',
  md: 'cine-brand--md',
  lg: 'cine-brand--lg',
  xl: 'cine-brand--xl',
};

interface CineReactLogoProps {
  size?: CineReactLogoSize;
  align?: 'left' | 'center';
  animated?: boolean;
  className?: string;
  heading?: boolean;
}

function ReactionRipple() {
  return (
    <svg
      className="cine-brand-ripple"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="16" cy="16" r="4" fill="#22d3ee" />
      <circle cx="16" cy="16" r="8" stroke="#22d3ee" strokeWidth="1.5" strokeOpacity="0.55" />
      <circle cx="16" cy="16" r="12" stroke="#22d3ee" strokeWidth="1.2" strokeOpacity="0.3" />
      <circle cx="16" cy="16" r="15" stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.15" />
    </svg>
  );
}

function ReactionWave() {
  return (
    <svg
      className="cine-brand-wave"
      viewBox="0 0 200 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0 6 C12 6 12 1 24 1 C36 1 36 11 48 11 C60 11 60 1 72 1 C84 1 84 11 96 11 C108 11 108 1 120 1 C132 1 132 11 144 11 C156 11 156 1 168 1 C180 1 180 6 200 6"
        stroke="#22d3ee"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BrandMark({ sizeClass, heading }: { sizeClass: string; heading: boolean }) {
  const className = `cine-brand ${sizeClass}`;

  const inner = (
    <span className="cine-brand-lockup">
      <span className="cine-brand-row">
        <ReactionRipple />
        <span className="cine-brand-name">
          Cine<span className="cine-brand-react">React</span>
        </span>
      </span>
      <ReactionWave />
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

  const mark = <BrandMark sizeClass={sizeClass} heading={heading} />;

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={wrapperClass}
        aria-label="CineReact"
      >
        {mark}
      </motion.div>
    );
  }

  return (
    <div className={wrapperClass} aria-label="CineReact">
      {mark}
    </div>
  );
}
