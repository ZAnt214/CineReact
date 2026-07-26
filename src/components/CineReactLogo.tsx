import { motion } from 'motion/react';

export type CineReactLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeStyles: Record<
  CineReactLogoSize,
  { scale: string; showGlow: boolean; showRule: boolean; ruleWidth: string }
> = {
  xs: { scale: 'text-[0.95rem]', showGlow: false, showRule: false, ruleWidth: 'w-[88%]' },
  sm: { scale: 'text-[1.1rem] sm:text-[1.25rem]', showGlow: false, showRule: false, ruleWidth: 'w-[88%]' },
  md: { scale: 'text-[1.35rem] sm:text-[1.6rem]', showGlow: false, showRule: true, ruleWidth: 'w-[88%]' },
  lg: { scale: 'text-[2.6rem] sm:text-[3.2rem]', showGlow: true, showRule: true, ruleWidth: 'w-full max-w-[280px]' },
  xl: { scale: 'text-[3.2rem] xl:text-[4rem]', showGlow: true, showRule: true, ruleWidth: 'w-full max-w-[340px]' },
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
  showRule,
  ruleWidth,
  heading,
  align,
}: {
  scale: string;
  showGlow: boolean;
  showRule: boolean;
  ruleWidth: string;
  heading: boolean;
  align: 'left' | 'center';
}) {
  const labelClass = `cine-lettermark relative z-10 ${scale}`;

  return (
    <div
      className={`relative inline-flex flex-col ${
        align === 'center' ? 'items-center' : 'items-start'
      }`}
    >
      {showGlow && (
        <motion.div
          className="absolute -inset-8 bg-cine-lilac/10 blur-3xl rounded-full pointer-events-none"
          animate={{ opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {heading ? (
        <h1 className={labelClass}>
          <span className="cine-lettermark-cine">Cine</span>
          <span className="cine-lettermark-react">React</span>
        </h1>
      ) : (
        <div className={labelClass} aria-hidden>
          <span className="cine-lettermark-cine">Cine</span>
          <span className="cine-lettermark-react">React</span>
        </div>
      )}

      {showRule && <span className={`cine-lettermark-rule relative z-10 mt-1.5 ${ruleWidth}`} aria-hidden />}
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
    <Lettermark
      scale={styles.scale}
      showGlow={glowEnabled}
      showRule={styles.showRule}
      ruleWidth={styles.ruleWidth}
      heading={heading}
      align={align}
    />
  );

  const wrapperClass = `select-none ${align === 'center' ? 'text-center' : 'text-left'} ${className}`;

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
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
