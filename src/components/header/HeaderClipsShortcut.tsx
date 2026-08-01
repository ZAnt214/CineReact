import React, { memo } from 'react';
import { GalleryVerticalEnd } from 'lucide-react';

interface HeaderClipsShortcutProps {
  active?: boolean;
  onClick: () => void;
}

function HeaderClipsShortcut({ active = false, onClick }: HeaderClipsShortcutProps) {
  return (
    <button
      type="button"
      id="nav-cineclips"
      onClick={onClick}
      className={`header-clips-pill ${active ? 'header-clips-pill--active' : ''}`}
      aria-label="Abrir CineClips"
    >
      <GalleryVerticalEnd className="header-clips-pill-icon" strokeWidth={2.25} aria-hidden="true" />
      <span className="header-clips-pill-label">CineClips</span>
    </button>
  );
}

export default memo(HeaderClipsShortcut);
