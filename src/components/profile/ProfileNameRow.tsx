import React, { useMemo } from 'react';
import { resolvePublicProfileDisplay } from '../../gamification/profileDisplay.ts';
import TitleRewardVisual from '../rewards/TitleRewardVisual.tsx';
import CreatorTagVisual from '../rewards/CreatorTagVisual.tsx';
import ProfileVerifiedSeal from './ProfileVerifiedSeal.tsx';
import DonorBadge from './DonorBadge.tsx';
import type { ProfileLoadout, PublicProfileDisplay } from '../../types/gamification.ts';

export interface ProfileNameRowProps {
  name: string;
  isDonor?: boolean;
  profileDisplay?: PublicProfileDisplay | null;
  loadout?: ProfileLoadout | null;
  timestamp?: string;
  donorBadgeSize?: 'sm' | 'md';
  nameSize?: 'sm' | 'md' | 'lg';
  align?: 'center' | 'start';
  className?: string;
}

export default function ProfileNameRow({
  name,
  isDonor = false,
  profileDisplay,
  loadout,
  timestamp,
  donorBadgeSize = 'sm',
  nameSize = 'sm',
  align = 'center',
  className = '',
}: ProfileNameRowProps) {
  const display = useMemo(
    () => profileDisplay || resolvePublicProfileDisplay(loadout),
    [profileDisplay, loadout]
  );

  const isCenter = align === 'center';
  const alignClass = isCenter ? 'items-center text-center' : 'items-start text-left';
  const rowJustify = isCenter ? 'justify-center' : 'justify-start';

  const donorBadgeVariant = donorBadgeSize === 'md' ? 'md' : 'sm';

  const nameClass =
    nameSize === 'lg'
      ? 'text-2xl md:text-3xl font-black profile-text'
      : nameSize === 'md'
        ? 'text-sm font-bold profile-text'
        : 'text-xs font-bold profile-text';

  const sealSize = nameSize === 'lg' ? 'md' : 'sm';

  return (
    <div className={`flex flex-col w-full min-w-0 gap-3 ${alignClass} ${className}`}>
      {display.verifiedBadge && (
        <ProfileVerifiedSeal
          name={display.verifiedBadge.name}
          description={display.verifiedBadge.description}
          size={sealSize}
          align={align}
          className="w-full"
        />
      )}

      <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 w-full ${rowJustify}`}>
        <span className={nameClass}>{name}</span>
        {isDonor && <DonorBadge size={donorBadgeVariant} />}
        {timestamp && (
          <span className="text-[10px] profile-text-muted font-mono shrink-0">{timestamp}</span>
        )}
      </div>

      {display.title && (
        <div className={`flex flex-col gap-1 w-full ${alignClass}`}>
          <TitleRewardVisual
            name={display.title.name}
            rarity={display.title.rarity}
            item={{ id: display.title.id, rarity: display.title.rarity, category: 'title' }}
            size={nameSize === 'lg' ? 'md' : 'sm'}
          />
          {display.title.description && (
            <p className={`text-[10px] profile-text-muted italic leading-snug max-w-[280px] ${isCenter ? 'mx-auto' : ''}`}>
              {display.title.description}
            </p>
          )}
        </div>
      )}

      {display.tags.length > 0 && (
        <div className={`flex flex-wrap gap-1.5 w-full ${rowJustify}`}>
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
