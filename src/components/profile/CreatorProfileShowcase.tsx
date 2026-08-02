import React, { useMemo } from 'react';
import { BadgeCheck, Frame, Palette } from 'lucide-react';
import type { PublicUserProfile } from '../../types.ts';
import { getRewardById } from '../../data/rewardsCatalog.ts';
import ProfileVerifiedSeal from './ProfileVerifiedSeal.tsx';
import ProfileSocialLinks from './ProfileSocialLinks.tsx';
import TitleRewardVisual from '../rewards/TitleRewardVisual.tsx';

export interface CreatorProfileShowcaseProps {
  profile: PublicUserProfile;
}

function ShowcasePerk({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="creator-showcase-perk">
      <Icon className="w-3 h-3 shrink-0 text-cine-accent-light/80" strokeWidth={2.25} />
      {label}
    </span>
  );
}

export default function CreatorProfileShowcase({ profile }: CreatorProfileShowcaseProps) {
  const display = profile.profileDisplay;
  const loadout = display.loadout;

  const frameName = useMemo(() => {
    if (!loadout.frame) return null;
    return getRewardById(loadout.frame)?.name ?? null;
  }, [loadout.frame]);

  const themeName = useMemo(() => {
    if (!loadout.theme) return null;
    return getRewardById(loadout.theme)?.name ?? null;
  }, [loadout.theme]);

  return (
    <article className="creator-showcase">
      <div className="creator-showcase-bg" aria-hidden />

      <div className="creator-showcase-frame">
        <div className="creator-showcase-card">
          {display.verifiedBadge && (
            <ProfileVerifiedSeal
              name={display.verifiedBadge.name}
              description={display.verifiedBadge.description}
              size="md"
              align="start"
            />
          )}

          <div className="creator-showcase-main">
            <div className="creator-showcase-avatar-wrap">
              <img
                src={profile.avatar}
                alt={profile.nome}
                width={88}
                height={88}
                loading="lazy"
                decoding="async"
                className="creator-showcase-avatar"
              />
            </div>

            <div className="creator-showcase-copy">
              <h1 className="creator-showcase-name">{profile.nome}</h1>

              {display.title && (
                <TitleRewardVisual
                  name={display.title.name}
                  rarity={display.title.rarity}
                  item={{ id: display.title.id, rarity: display.title.rarity, category: 'title' }}
                  size="md"
                />
              )}

              {profile.descricao && (
                <p className="creator-showcase-bio">{profile.descricao}</p>
              )}
            </div>
          </div>

          {(frameName || themeName) && (
            <div className="creator-showcase-perks" aria-label="Cosméticos equipados">
              {frameName && <ShowcasePerk icon={Frame} label={frameName} />}
              {themeName && <ShowcasePerk icon={Palette} label={`Tema ${themeName}`} />}
            </div>
          )}

          {profile.isVerifiedCreator && profile.socialLinks && (
            <ProfileSocialLinks
              links={profile.socialLinks}
              size="md"
              align="start"
              className="creator-showcase-social"
            />
          )}
        </div>
      </div>

      <footer className="creator-showcase-foot">
        <p className="creator-showcase-foot-note">
          <BadgeCheck className="w-3.5 h-3.5 text-cine-accent-light shrink-0" strokeWidth={2.5} />
          Identidade confirmada pela equipe CineReact
        </p>
        <p className="creator-showcase-foot-cta">
          Seu canal pode ter selo, moldura, tema e links oficiais — assim.
        </p>
      </footer>
    </article>
  );
}
