import React, { memo } from 'react';

interface HeaderClipsShortcutProps {
  active?: boolean;
  onClick: () => void;
  className?: string;
  id?: string;
}

function HeaderClipsShortcut({
  active = false,
  onClick,
  className = '',
  id = 'nav-cineclips',
}: HeaderClipsShortcutProps) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      className={`header-clips-mark group ${active ? 'header-clips-mark--active' : ''} ${className}`}
      aria-label="Abrir CineClips"
    >
      <span className="header-clips-mark-cine">Cine</span>
      <span className="header-clips-mark-script">Clips</span>
    </button>
  );
}

export default memo(HeaderClipsShortcut);
