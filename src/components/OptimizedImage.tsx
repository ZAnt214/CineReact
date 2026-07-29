import React, { useState } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  fallbackSrc = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600',
  loading = 'lazy',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImgError(true);
    if (onError) onError(e);
  };

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
        onLoad={handleLoad}
        onError={handleError}
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
};

export default OptimizedImage;
