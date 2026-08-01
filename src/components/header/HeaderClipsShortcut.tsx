import React, { memo } from 'react';
import { Zap } from 'lucide-react';

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
      className={`header-clips-entry group ${active ? 'header-clips-entry--active' : ''}`}
      aria-label="Abrir CineClips"
    >
      <span className="header-clips-entry-frame" aria-hidden="true">
        <span className="header-clips-entry-notch" />
        <Zap className="header-clips-entry-icon" strokeWidth={2.25} />
      </span>
      <span className="header-clips-entry-copy">
        <span className="header-clips-entry-title">CineClips</span>
        <span className="header-clips-entry-sub">Feed vertical</span>
      </span>
    </button>
  );
}

export default memo(HeaderClipsShortcut);
