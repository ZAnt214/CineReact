import React, { useState } from 'react';
import { BadgeCheck, Heart } from 'lucide-react';
import type { PublicUserProfile } from '../../types.ts';
import { DEMO_CREATOR_REACT_GOALS } from '../../constants/demoCreatorShowcase.ts';
import ProfileAvatar from './ProfileAvatar.tsx';
import ProfileSocialLinks from './ProfileSocialLinks.tsx';
import TitleRewardVisual from '../rewards/TitleRewardVisual.tsx';
import CreatorShowcaseFeatured from './CreatorShowcaseFeatured.tsx';
import CreatorShowcaseGoals from './CreatorShowcaseGoals.tsx';

export interface CreatorProfileShowcaseProps {
  profile: PublicUserProfile;
}

export default function CreatorProfileShowcase({ profile }: CreatorProfileShowcaseProps) {
  const display = profile.profileDisplay;
  const [supportSent, setSupportSent] = useState(false);

  return (
    <div className="space-y-0">
      <section className="rounded-2xl border border-neutral-800/70 bg-neutral-950/40 p-5 sm:p-6 md:p-7">
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
          <ProfileAvatar
            photoUrl={profile.avatar}
            alt={profile.nome}
            size="xl"
            profileDisplay={display}
            isDonor={!!profile.isDonor}
            lite
            showEffect={false}
            className="shrink-0 mx-auto sm:mx-0"
          />

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {profile.nome}
              </h1>
              {display.verifiedBadge && (
                <span
                  className="inline-flex items-center gap-1 text-cine-accent-light"
                  title={display.verifiedBadge.description}
                >
                  <BadgeCheck className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                    Verificado
                  </span>
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
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-xl mx-auto sm:mx-0">
                {profile.descricao}
              </p>
            )}

            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSupportSent(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cine-accent text-white text-xs font-bold uppercase tracking-wider hover:bg-cine-accent-dark transition-colors cursor-pointer"
              >
                <Heart className="w-4 h-4" strokeWidth={2.25} />
                Apoiar criador
              </button>
              {supportSent && (
                <p className="text-xs text-zinc-500 sm:pl-1" role="status">
                  Apoio registrado.
                </p>
              )}
            </div>
          </div>
        </div>

        {profile.isVerifiedCreator && profile.socialLinks && (
          <div className="mt-6 pt-6 border-t border-neutral-800/60">
            <ProfileSocialLinks links={profile.socialLinks} size="md" align="start" className="max-w-none" />
          </div>
        )}
      </section>

      <CreatorShowcaseFeatured />
      <CreatorShowcaseGoals goals={DEMO_CREATOR_REACT_GOALS} />
    </div>
  );
}
