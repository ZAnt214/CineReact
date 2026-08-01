import React, { memo } from 'react';
import { Clapperboard } from 'lucide-react';

interface HeaderClipsButtonProps {
  active?: boolean;
  onClick: () => void;
  variant?: 'full' | 'icon';
  id?: string;
  className?: string;
}

function HeaderClipsButton({
  active = false,
  onClick,
  variant = 'full',
  id = 'nav-cineclips',
  className = '',
}: HeaderClipsButtonProps) {
  if (variant === 'icon') {
    return (
      <button
        type="button"
        id={id}
        onClick={onClick}
        className={`header-clips-icon-btn group ${active ? 'header-clips-icon-btn--active' : ''} ${className}`}
        aria-label="Abrir CineClips"
      >
        <span className="header-clips-icon-btn-glow" aria-hidden="true" />
        <span className="header-clips-icon-btn-surface">
          <Clapperboard className="header-clips-icon-btn-svg" strokeWidth={2} />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      className={`header-clips-btn group ${active ? 'header-clips-btn--active' : ''} ${className}`}
      aria-label="Abrir CineClips"
    >
      <span className="header-clips-btn-icon-wrap" aria-hidden="true">
        <Clapperboard className="header-clips-btn-icon" strokeWidth={2.15} />
      </span>
      <span className="header-clips-btn-copy">
        <span className="header-clips-btn-cine">Cine</span>
        <span className="header-clips-btn-script">Clips</span>
      </span>
    </button>
  );
}

export default memo(HeaderClipsButton);
