import React from 'react';
import { VERIFIED_PROFILE_BADGE_ID, getRewardById } from '../../data/rewardsCatalog.ts';
import type { PublicUserProfile } from '../../types.ts';
import ProfileAvatar from './ProfileAvatar.tsx';
import ProfileNameRow from './ProfileNameRow.tsx';
import ProfileSocialLinks from './ProfileSocialLinks.tsx';
import ProfileSurface from './ProfileSurface.tsx';
import ProfileThemeScope from './ProfileThemeScope.tsx';
import { RewardPreviewThumb } from '../rewards/RewardPreview.tsx';

export interface PublicCreatorProfileProps {
  profile: PublicUserProfile;
  size?: 'sm' | 'md';
  align?: 'center' | 'start';
  showBio?: boolean;
  lite?: boolean;
  className?: string;
}

export default function PublicCreatorProfile({
  profile,
  size = 'md',
  align = 'start',
  showBio = true,
  lite = true,
  className = '',
}: PublicCreatorProfileProps) {
  const loadout = profile.profileDisplay.loadout;
  const isCenter = align === 'center';
  const badgeItems = (loadout.badges || []).filter((id) => id !== VERIFIED_PROFILE_BADGE_ID);

  return (
    <ProfileThemeScope loadout={loadout} profileDisplay={profile.profileDisplay} variant="lite" className={className}>
      <ProfileSurface
        loadout={loadout}
        profileDisplay={profile.profileDisplay}
        variant="panel"
        themed={false}
        lite
        rounded="rounded-2xl"
        className="border-neutral-800/60 bg-neutral-950/35"
        innerClassName={`flex flex-col gap-3 ${isCenter ? 'items-center text-center' : 'items-start text-left'}`}
      >
        <div className={`flex w-full gap-4 ${isCenter ? 'flex-col items-center' : 'flex-row items-center'}`}>
          <ProfileAvatar
            photoUrl={profile.avatar}
            alt={profile.nome}
            size={size === 'sm' ? 'lg' : 'xl'}
            profileDisplay={profile.profileDisplay}
            isDonor={!!profile.isDonor}
            lite={lite}
            className="shrink-0"
          />
          <div className={`flex-1 min-w-0 ${isCenter ? 'w-full' : ''}`}>
            <ProfileNameRow
              name={profile.nome}
              isDonor={!!profile.isDonor}
              profileDisplay={profile.profileDisplay}
              nameSize={size === 'sm' ? 'md' : 'lg'}
              align={align}
              className="w-full"
            />
            {showBio && profile.descricao && (
              <p className={`text-sm text-zinc-400 mt-2 leading-relaxed ${isCenter ? 'max-w-sm mx-auto' : 'max-w-md'}`}>
                {profile.descricao}
              </p>
            )}
          </div>
        </div>

        {badgeItems.length > 0 && (
          <div className={`flex flex-wrap gap-2 ${isCenter ? 'justify-center' : 'justify-start'}`}>
            {badgeItems.map((id) => {
              const item = getRewardById(id);
              if (!item) return null;
              return (
                <span key={id} title={item.name}>
                  <RewardPreviewThumb item={{ ...item, owned: true, equipped: true }} size="sm" lite />
                </span>
              );
            })}
          </div>
        )}

        {profile.isVerifiedCreator && profile.socialLinks && (
          <ProfileSocialLinks
            links={profile.socialLinks}
            size={size}
            align={align}
            className="w-full max-w-none"
          />
        )}
      </ProfileSurface>
    </ProfileThemeScope>
  );
}
