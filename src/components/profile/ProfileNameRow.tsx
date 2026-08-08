import React, { useMemo } from 'react';
import { BadgeCheck } from 'lucide-react';
import { resolveUserProfileDisplay } from '../../gamification/profileDisplay.ts';
import TitleRewardVisual from '../rewards/TitleRewardVisual.tsx';
import CreatorTagVisual from '../rewards/CreatorTagVisual.tsx';
import ProfileVerifiedSeal from './ProfileVerifiedSeal.tsx';
import DonorBadge from './DonorBadge.tsx';
import { DONOR_TAG_ID } from '../../data/rewardsCatalog.ts';
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
  /** seal: selo completo (padrão). icon: apenas ícone ao lado do nome (comentários). */
  verifiedDisplay?: 'seal' | 'icon';
  /** Comentários / listas: só nome + selo ícone, sem título ou tags. */
  compact?: boolean;
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
  verifiedDisplay = 'seal',
  compact = false,
}: ProfileNameRowProps) {
  const display = useMemo(
    () => profileDisplay || resolveUserProfileDisplay(loadout, isDonor),
    [profileDisplay, loadout, isDonor]
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

  const donorTagEquipped = useMemo(
    () =>
      display.tags.some((tag) => tag.id === DONOR_TAG_ID) ||
      display.loadout.tags.includes(DONOR_TAG_ID),
    [display.tags, display.loadout.tags],
  );

  const visibleTags = useMemo(
    () => display.tags.filter((tag) => tag.id !== DONOR_TAG_ID),
    [display.tags],
  );

  const sealSize = nameSize === 'lg' ? 'md' : 'sm';

  return (
    <div className={`flex flex-col w-full min-w-0 ${compact ? 'gap-0' : 'gap-3'} ${alignClass} ${className}`}>
      {!compact && display.verifiedBadge && verifiedDisplay === 'seal' && (
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
        {display.verifiedBadge && verifiedDisplay === 'icon' && (
          <span title="Criador verificado" className="inline-flex shrink-0">
            <BadgeCheck className="w-3.5 h-3.5 text-cine-accent-light" strokeWidth={2.5} />
          </span>
        )}
        {donorTagEquipped && <DonorBadge size={donorBadgeVariant} />}
        {timestamp && (
          <span className="text-[10px] profile-text-muted font-mono shrink-0">{timestamp}</span>
        )}
      </div>

      {display.title && !compact && (
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

      {visibleTags.length > 0 && !compact && (
        <div className={`flex flex-wrap gap-1.5 w-full ${rowJustify}`}>
          {visibleTags.map((tag) => (
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
