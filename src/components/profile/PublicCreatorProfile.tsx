import React, { useMemo } from 'react';
import { VERIFIED_PROFILE_BADGE_ID, getRewardById } from '../../data/rewardsCatalog.ts';
import { getVisualStyle } from '../../data/rewardVisualStyles.ts';
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
  const display = profile.profileDisplay;
  const isCenter = align === 'center';
  const isFull = !lite;
  const badgeItems = (loadout.badges || []).filter((id) => id !== VERIFIED_PROFILE_BADGE_ID);

  const frameBorderStyle = useMemo(() => {
    if (!isFull || !display.frameVisualStyle) return undefined;
    const style = getVisualStyle(display.frameVisualStyle);
    return style.gradientCss ? { background: style.gradientCss } : undefined;
  }, [display.frameVisualStyle, isFull]);

  const content = (
    <ProfileSurface
      loadout={loadout}
      profileDisplay={display}
      variant={isFull ? 'hero' : 'panel'}
      themed={isFull}
      lite={!isFull}
      rounded={isFull ? 'rounded-[1.3rem]' : 'rounded-2xl'}
      className={
        isFull
          ? 'public-creator-profile-card border-white/[0.07] bg-neutral-950/50 backdrop-blur-md'
          : 'border-neutral-800/60 bg-neutral-950/35'
      }
      innerClassName={`flex flex-col gap-4 ${isCenter ? 'items-center text-center' : 'items-start text-left'}`}
    >
      <div className={`flex w-full gap-5 ${isCenter ? 'flex-col items-center' : 'flex-row items-start'}`}>
        <ProfileAvatar
          photoUrl={profile.avatar}
          alt={profile.nome}
          size={size === 'sm' ? 'lg' : 'xl'}
          profileDisplay={display}
          isDonor={!!profile.isDonor}
          lite={!isFull}
          showEffect={isFull}
          className="shrink-0"
        />
        <div className={`flex-1 min-w-0 ${isCenter ? 'w-full' : 'pt-1'}`}>
          <ProfileNameRow
            name={profile.nome}
            isDonor={!!profile.isDonor}
            profileDisplay={display}
            nameSize={size === 'sm' ? 'md' : 'lg'}
            align={align}
            className="w-full"
          />
          {showBio && profile.descricao && (
            <p
              className={`text-sm profile-text-muted mt-3 leading-relaxed ${
                isCenter ? 'max-w-sm mx-auto' : 'max-w-lg'
              }`}
            >
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
          variant={isFull ? 'neutral' : 'default'}
          className="w-full max-w-none"
        />
      )}
    </ProfileSurface>
  );

  if (isFull) {
    return (
      <div className={`public-creator-profile-shell w-full ${className}`}>
        {frameBorderStyle ? (
          <div
            className="public-creator-profile-frame rounded-[1.35rem] p-[2px] shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
            style={frameBorderStyle}
          >
            {content}
          </div>
        ) : (
          content
        )}
      </div>
    );
  }

  return (
    <ProfileThemeScope loadout={loadout} profileDisplay={display} variant="lite" className={className}>
      {content}
    </ProfileThemeScope>
  );
}
