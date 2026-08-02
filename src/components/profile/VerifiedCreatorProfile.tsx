import React, { useState } from 'react';
import { BadgeCheck, Heart } from 'lucide-react';
import type { PublicUserProfile } from '../../types.ts';
import { DEMO_CREATOR_FUNDING_GOALS } from '../../constants/demoCreatorShowcase.ts';
import VerifiedCreatorAvatar from './VerifiedCreatorAvatar.tsx';
import ProfileSocialLinks from './ProfileSocialLinks.tsx';
import TitleRewardVisual from '../rewards/TitleRewardVisual.tsx';
import CreatorShowcaseFeatured from './CreatorShowcaseFeatured.tsx';
import CreatorShowcaseGoals from './CreatorShowcaseGoals.tsx';

export interface VerifiedCreatorProfileProps {
  profile: PublicUserProfile;
  /** Exibe seções de exemplo (destaques skeleton + metas demo). */
  showDemoExtras?: boolean;
}

export default function VerifiedCreatorProfile({
  profile,
  showDemoExtras = false,
}: VerifiedCreatorProfileProps) {
  const display = profile.profileDisplay;
  const [supportSent, setSupportSent] = useState(false);

  return (
    <div className="space-y-0">
      <section className="creator-premium-card p-5 sm:p-6 md:p-7">
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
          <VerifiedCreatorAvatar
            photoUrl={profile.avatar}
            alt={profile.nome}
            size="xl"
            className="shrink-0 mx-auto sm:mx-0"
          />

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--premium-cream)]">
                {profile.nome}
              </h1>
              {display.verifiedBadge && (
                <span
                  className="creator-premium-verified"
                  title={display.verifiedBadge.description}
                >
                  <BadgeCheck className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                  <span>Verificado</span>
                </span>
              )}
            </div>

            {display.title && (
              <div className="mt-2 flex justify-center sm:justify-start">
                <TitleRewardVisual
                  name={display.title.name}
                  rarity={display.title.rarity}
                  item={{ id: display.title.id, rarity: display.title.rarity, category: 'title' }}
                  size="md"
                />
              </div>
            )}

            {profile.descricao && (
              <p className="mt-3 text-sm text-[var(--premium-muted)] leading-relaxed max-w-xl mx-auto sm:mx-0">
                {profile.descricao}
              </p>
            )}

            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSupportSent(true)}
                className="creator-premium-btn-primary"
              >
                <Heart className="w-4 h-4" strokeWidth={2.25} />
                Apoiar criador
              </button>
              {supportSent && (
                <p className="text-xs text-[var(--premium-muted)] sm:pl-1" role="status">
                  Apoio registrado.
                </p>
              )}
            </div>
          </div>
        </div>

        {profile.socialLinks && (
          <div className="creator-premium-divider creator-premium-social mt-6 pt-6">
            <ProfileSocialLinks links={profile.socialLinks} size="md" align="start" className="max-w-none" />
          </div>
        )}
      </section>

      {showDemoExtras && (
        <>
          <CreatorShowcaseFeatured />
          <CreatorShowcaseGoals goals={DEMO_CREATOR_FUNDING_GOALS} />
        </>
      )}
    </div>
  );
}
