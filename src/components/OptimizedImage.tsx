import React from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
  /** Sem estado React — melhor para listas grandes (catálogo) */
  lite?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  fallbackSrc = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600',
  loading = 'lazy',
  lite = false,
  onLoad,
  onError,
  ...props
}) => {
  const activeSrc = src || fallbackSrc;

  if (lite) {
    return (
      <img
        src={activeSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        draggable={false}
        referrerPolicy="no-referrer"
        onDragStart={(e) => e.preventDefault()}
        onError={onError}
        onLoad={onLoad}
        className={`w-full h-full object-cover bg-neutral-950 ${className}`}
        {...props}
      />
    );
  }

  return <OptimizedImageStateful {...{ src, alt, className, containerClassName, fallbackSrc, loading, onLoad, onError, ...props }} />;
};

function OptimizedImageStateful({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  fallbackSrc = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600',
  loading = 'lazy',
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

  const activeSrc = imgError ? fallbackSrc : (src || fallbackSrc);

  return (
    <div className={`relative overflow-hidden bg-neutral-950 ${containerClassName || 'w-full h-full'}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-neutral-900 pointer-events-none z-0" />
      )}
      <img
        src={activeSrc}
        alt={alt}
        loading={loading}
        onLoad={(e) => {
          setIsLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setImgError(true);
          onError?.(e);
        }}
        draggable={false}
        decoding="async"
        onDragStart={(e) => e.preventDefault()}
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover transition-opacity duration-300 ease-in-out relative z-10 pointer-events-none ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
}

export default OptimizedImage;
