import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { resolvePublicProfileDisplay } from '../../gamification/profileDisplay.ts';
import TitleRewardVisual from '../rewards/TitleRewardVisual.tsx';
import CreatorTagVisual from '../rewards/CreatorTagVisual.tsx';
import type { ProfileLoadout, PublicProfileDisplay } from '../../types/gamification.ts';

export interface ProfileNameRowProps {
  name: string;
  isDonor?: boolean;
  profileDisplay?: PublicProfileDisplay | null;
  loadout?: ProfileLoadout | null;
  timestamp?: string;
  donorBadgeSize?: 'sm' | 'md';
  className?: string;
}

export default function ProfileNameRow({
  name,
  isDonor = false,
  profileDisplay,
  loadout,
  timestamp,
  donorBadgeSize = 'sm',
  className = '',
}: ProfileNameRowProps) {
  const display = useMemo(
    () => profileDisplay || resolvePublicProfileDisplay(loadout),
    [profileDisplay, loadout]
  );

  const hasCosmetics = !!display.title || display.tags.length > 0;
  const donorClass =
    donorBadgeSize === 'md'
      ? 'text-[6px] px-1.5 py-0.5'
      : 'text-[7px] px-1.5 py-0.5';

  return (
    <div className={`min-w-0 space-y-1 ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        {isDonor ? (
          <span className="font-extrabold text-xs bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(245,158,11,0.4)] flex items-center gap-1.5">
            {name}
            <span
              className={`rounded bg-gradient-to-r from-amber-500 to-yellow-400 uppercase font-black text-black tracking-widest flex items-center gap-0.5 ${donorClass}`}
            >
              <Sparkles className="w-1.5 h-1.5 text-black fill-current" /> APOIADOR
            </span>
          </span>
        ) : (
          <span className="font-bold text-xs text-zinc-200">{name}</span>
        )}

        {timestamp && (
          <span className="text-[10px] text-zinc-500 font-mono">{timestamp}</span>
        )}
      </div>

      {hasCosmetics && (
        <div className="flex flex-wrap items-center gap-1.5">
          {display.title && (
            <TitleRewardVisual
              name={display.title.name}
              rarity={display.title.rarity}
              item={{ id: display.title.id, rarity: display.title.rarity, category: 'title' }}
              size="sm"
            />
          )}
          {display.tags.map((tag) => (
            <CreatorTagVisual
              key={tag.id}
              id={tag.id}
              name={tag.name}
              creatorName={tag.creatorName}
              creatorColors={tag.creatorColors}
              size="sm"
            />
          ))}
        </div>
      )}
    </div>
  );
}
