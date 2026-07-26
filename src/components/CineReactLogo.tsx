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

function BrandMark({ sizeClass, heading }: { sizeClass: string; heading: boolean }) {
  const className = `cine-brand ${sizeClass}`;
  const text = (
    <span className="cine-brand-name">
      Cine<span className="cine-brand-react">React</span>
    </span>
  );

  if (heading) {
    return <h1 className={className}>{text}</h1>;
  }

  return <div className={className}>{text}</div>;
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
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
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
