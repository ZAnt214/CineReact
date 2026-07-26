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
  tagline?: string;
  showTagline?: boolean;
}

const DEFAULT_TAGLINE = 'Sua plataforma de reacts';

function BrandMark({
  sizeClass,
  heading,
  tagline,
  showTagline,
  align,
}: {
  sizeClass: string;
  heading: boolean;
  tagline: string;
  showTagline: boolean;
  align: 'left' | 'center';
}) {
  const stackClass = `cine-brand ${sizeClass} ${
    align === 'center' ? 'cine-brand--center' : ''
  }`;

  const name = (
    <span className="cine-brand-name">
      <span className="cine-brand-cine">Cine</span>
      <span className="cine-brand-connector" aria-hidden="true">
        <span className="cine-brand-connector-ring" />
        <span className="cine-brand-connector-core" />
      </span>
      <span className="cine-brand-react">React</span>
    </span>
  );

  const taglineEl = showTagline ? (
    <span className="cine-brand-tagline">{tagline}</span>
  ) : null;

  const titleBlock = (
    <>
      {heading ? (
        <h1 className="cine-brand-title">{name}</h1>
      ) : (
        <span className="cine-brand-title">{name}</span>
      )}
      <span className="cine-brand-rule" aria-hidden="true" />
    </>
  );

  if (heading) {
    return (
      <span className={stackClass}>
        {titleBlock}
        {taglineEl}
      </span>
    );
  }

  return (
    <span className={stackClass}>
      {titleBlock}
      {taglineEl}
    </span>
  );
}

export default function CineReactLogo({
  size = 'md',
  align = 'left',
  animated = false,
  className = '',
  heading = false,
  tagline = DEFAULT_TAGLINE,
  showTagline = true,
}: CineReactLogoProps) {
  const sizeClass = sizeStyles[size];
  const wrapperClass = `select-none inline-block ${align === 'center' ? 'mx-auto block w-fit' : ''} ${className}`;

  const mark = (
    <BrandMark
      sizeClass={sizeClass}
      heading={heading}
      tagline={tagline}
      showTagline={showTagline}
      align={align}
    />
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
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
