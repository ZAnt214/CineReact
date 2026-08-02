import React, { useMemo, useState } from 'react';
import { BadgeCheck, Frame, Heart, Palette } from 'lucide-react';
import type { PublicUserProfile, ReactVideo } from '../../types.ts';
import { getRewardById } from '../../data/rewardsCatalog.ts';
import {
  DEMO_CREATOR_REACT_GOALS,
  pickDemoFeaturedReacts,
} from '../../constants/demoCreatorShowcase.ts';
import ProfileVerifiedSeal from './ProfileVerifiedSeal.tsx';
import ProfileSocialLinks from './ProfileSocialLinks.tsx';
import TitleRewardVisual from '../rewards/TitleRewardVisual.tsx';
import CreatorShowcaseFeatured from './CreatorShowcaseFeatured.tsx';
import CreatorShowcaseGoals from './CreatorShowcaseGoals.tsx';

export interface CreatorProfileShowcaseProps {
  profile: PublicUserProfile;
  reacts?: ReactVideo[];
  onPlayVideo?: (reactId: string, obraId: string) => void;
}

function ShowcasePerk({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="creator-showcase-perk">
      <Icon className="w-3 h-3 shrink-0 text-cine-accent-light/80" strokeWidth={2.25} />
      {label}
    </span>
  );
}

export default function CreatorProfileShowcase({
  profile,
  reacts = [],
  onPlayVideo,
}: CreatorProfileShowcaseProps) {
  const display = profile.profileDisplay;
  const loadout = display.loadout;
  const [supportAck, setSupportAck] = useState(false);

  const frameName = useMemo(() => {
    if (!loadout.frame) return null;
    return getRewardById(loadout.frame)?.name ?? null;
  }, [loadout.frame]);

  const themeName = useMemo(() => {
    if (!loadout.theme) return null;
    return getRewardById(loadout.theme)?.name ?? null;
  }, [loadout.theme]);

  const featuredVideos = useMemo(() => pickDemoFeaturedReacts(reacts, 3), [reacts]);

  return (
    <article className="creator-showcase">
      <div className="creator-showcase-bg" aria-hidden />

      <div className="creator-showcase-frame">
        <div className="creator-showcase-card">
          <div className="creator-showcase-hero">
            <div className="creator-showcase-identity">
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
                <BadgeCheck
                  className="creator-showcase-avatar-badge"
                  strokeWidth={2.5}
                  aria-hidden
                />
              </div>

              {display.verifiedBadge && (
                <ProfileVerifiedSeal
                  name={display.verifiedBadge.name}
                  description={display.verifiedBadge.description}
                  size="md"
                  align="start"
                  layout="beside"
                />
              )}
            </div>

            <div className="creator-showcase-copy">
              <div className="creator-showcase-name-row">
                <h1 className="creator-showcase-name">{profile.nome}</h1>
                <button
                  type="button"
                  onClick={() => setSupportAck(true)}
                  className="creator-showcase-support-btn"
                >
                  <Heart className="w-4 h-4" strokeWidth={2.25} />
                  Apoiar criador
                </button>
              </div>

              {supportAck && (
                <p className="creator-showcase-support-note" role="status">
                  Obrigado pelo apoio! Em breve criadores receberão contribuições diretas na plataforma.
                </p>
              )}

              {display.title && (
                <TitleRewardVisual
                  name={display.title.name}
                  rarity={display.title.rarity}
                  item={{ id: display.title.id, rarity: display.title.rarity, category: 'title' }}
                  size="md"
                />
              )}

              {profile.descricao && <p className="creator-showcase-bio">{profile.descricao}</p>}
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

      <CreatorShowcaseFeatured videos={featuredVideos} onPlay={onPlayVideo} />
      <CreatorShowcaseGoals goals={DEMO_CREATOR_REACT_GOALS} />

      <footer className="creator-showcase-foot">
        <p className="creator-showcase-foot-note">
          <BadgeCheck className="w-3.5 h-3.5 text-cine-accent-light shrink-0" strokeWidth={2.5} />
          Identidade confirmada pela equipe CineReact
        </p>
        <p className="creator-showcase-foot-cta">
          Selo, moldura, destaques, metas e apoio — tudo que um canal verificado pode ter.
        </p>
      </footer>
    </article>
  );
}
