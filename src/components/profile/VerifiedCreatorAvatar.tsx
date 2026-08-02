import React from 'react';

const SIZE_CLASS = {
  lg: 'creator-premium-avatar--lg',
  xl: 'creator-premium-avatar--xl',
} as const;

export interface VerifiedCreatorAvatarProps {
  photoUrl?: string;
  alt?: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}

export default function VerifiedCreatorAvatar({
  photoUrl,
  alt = '',
  size = 'xl',
  className = '',
}: VerifiedCreatorAvatarProps) {
  return (
    <div className={`creator-premium-avatar ${SIZE_CLASS[size]} ${className}`}>
      <div className="creator-premium-avatar-ring">
        <div className="creator-premium-avatar-inner">
          {photoUrl ? (
            <img src={photoUrl} alt={alt} loading="lazy" decoding="async" />
          ) : (
            <span className="creator-premium-avatar-fallback" aria-hidden />
          )}
        </div>
      </div>
    </div>
  );
}
