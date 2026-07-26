import { motion } from 'motion/react';

export type CineReactLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeStyles: Record<
  CineReactLogoSize,
  { scale: string; showGlow: boolean; ornate: boolean }
> = {
  xs: { scale: 'cine-lettermark--xs', showGlow: false, ornate: false },
  sm: { scale: 'cine-lettermark--sm', showGlow: false, ornate: false },
  md: { scale: 'cine-lettermark--md', showGlow: false, ornate: true },
  lg: { scale: 'cine-lettermark--lg', showGlow: true, ornate: true },
  xl: { scale: 'cine-lettermark--xl', showGlow: true, ornate: true },
};

interface CineReactLogoProps {
  size?: CineReactLogoSize;
  align?: 'left' | 'center';
  animated?: boolean;
  showGlow?: boolean;
  className?: string;
  heading?: boolean;
}

function Perforations() {
  return (
    <div className="cine-lettermark-perfs" aria-hidden>
      {Array.from({ length: 11 }).map((_, i) => (
        <span key={i} className="cine-lettermark-perf" />
      ))}
    </div>
  );
}

function Ornament() {
  return (
    <div className="cine-lettermark-ornament" aria-hidden>
      <span className="cine-lettermark-line" />
      <span className="cine-lettermark-gem">✦</span>
      <span className="cine-lettermark-cine-top">Cine</span>
      <span className="cine-lettermark-gem">✦</span>
      <span className="cine-lettermark-line" />
    </div>
  );
}

function Lettermark({
  scale,
  showGlow,
  ornate,
  heading,
  align,
}: {
  scale: string;
  showGlow: boolean;
  ornate: boolean;
  heading: boolean;
  align: 'left' | 'center';
}) {
  const frameClass = `cine-lettermark-frame ${scale} ${
    align === 'center' ? 'cine-lettermark-frame--center' : ''
  }`;

  const stack = ornate ? (
    <div className="cine-lettermark-stack">
      <span className="cine-lettermark-react" data-text="React">
        React
      </span>
    </div>
  ) : (
    <div className="cine-lettermark-inline">
      <span className="cine-lettermark-cine-compact">Cine</span>
      <span className="cine-lettermark-dot" aria-hidden />
      <span className="cine-lettermark-react-compact">React</span>
    </div>
  );

  const content = (
    <div className={frameClass}>
      {showGlow && <span className="cine-lettermark-aura" aria-hidden />}
      {ornate && (
        <>
          <Perforations />
          <Ornament />
        </>
      )}
      {stack}
      {ornate && <span className="cine-lettermark-rail" aria-hidden />}
    </div>
  );

  if (heading) {
    return <h1 className="cine-lettermark-root">{content}</h1>;
  }

  return <div className="cine-lettermark-root">{content}</div>;
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
      ornate={styles.ornate}
      heading={heading}
      align={align}
    />
  );

  const wrapperClass = `select-none ${align === 'center' ? 'text-center' : 'text-left'} ${className}`;

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
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
