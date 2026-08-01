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
      className={`px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer text-xs lg:text-[13px] font-semibold shrink-0 ${className} ${
        active
          ? 'text-white bg-neutral-900 shadow-sm border border-neutral-800/60'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-neutral-900/30'
      }`}
      aria-label="Abrir CineClips"
    >
      Clips
    </button>
  );
}

export default memo(HeaderClipsShortcut);
