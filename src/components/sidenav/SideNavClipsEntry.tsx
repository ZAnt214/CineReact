import React, { memo } from 'react';
import { Clapperboard } from 'lucide-react';

interface SideNavClipsEntryProps {
  active?: boolean;
  onClick: () => void;
}

function SideNavClipsEntry({ active = false, onClick }: SideNavClipsEntryProps) {
  return (
    <button
      type="button"
      id="side-nav-cineclips"
      onClick={onClick}
      className={`side-nav-clips-entry ${active ? 'side-nav-clips-entry--active' : ''}`}
      aria-label="Abrir CineClips"
    >
      <span className="side-nav-clips-entry-icon" aria-hidden="true">
        <Clapperboard className="w-4 h-4" strokeWidth={2} />
      </span>
      <span className="side-nav-clips-entry-copy">
        <span className="side-nav-clips-entry-word">
          <span className="side-nav-clips-entry-cine">Cine</span>
          <span className="side-nav-clips-entry-script">Clips</span>
        </span>
        <span className="side-nav-clips-entry-sub">Feed vertical de reacts</span>
      </span>
    </button>
  );
}

export default memo(SideNavClipsEntry);
