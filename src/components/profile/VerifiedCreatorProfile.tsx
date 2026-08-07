import React, { useState } from 'react';
import { BadgeCheck, Heart } from 'lucide-react';
import type { PublicUserProfile } from '../../types.ts';
import { DEMO_CREATOR_FUNDING_GOALS } from '../../constants/demoCreatorShowcase.ts';
import VerifiedCreatorAvatar from './VerifiedCreatorAvatar.tsx';
import ProfileSocialLinks from './ProfileSocialLinks.tsx';
import TitleRewardVisual from '../rewards/TitleRewardVisual.tsx';
import CreatorShowcaseFeatured from './CreatorShowcaseFeatured.tsx';
import CreatorShowcaseGoals from './CreatorShowcaseGoals.tsx';
import CreatorSubscriptionExplainer from '../creator/CreatorSubscriptionExplainer.tsx';

export interface VerifiedCreatorProfileProps {
  profile: PublicUserProfile;
  /** Exibe seções de exemplo (destaques skeleton + metas demo). */
  showDemoExtras?: boolean;
  /** Exibe CTA para o visitante iniciar verificação do próprio perfil (perfil demo). */
  showVerifyCta?: boolean;
  onVerifyProfile?: () => void;
  /** CTA para assinar este criador (visitantes). */
  onSubscribe?: () => void;
}

export default function VerifiedCreatorProfile({
  profile,
  showDemoExtras = false,
  showVerifyCta = false,
  onVerifyProfile,
  onSubscribe,
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
              {onSubscribe && (
                <button
                  type="button"
                  onClick={onSubscribe}
                  className="creator-premium-btn-secondary"
                >
                  <BadgeCheck className="w-4 h-4" strokeWidth={2.25} />
                  Assinar exclusiva
                </button>
              )}
              {showDemoExtras && showVerifyCta && onVerifyProfile && (
                <button
                  type="button"
                  onClick={onVerifyProfile}
                  className="creator-premium-btn-secondary"
                >
                  <BadgeCheck className="w-4 h-4" strokeWidth={2.25} />
                  Verificar perfil
                </button>
              )}
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
          <CreatorSubscriptionExplainer variant="premium" className="mt-2" />
          {showVerifyCta && onVerifyProfile && (
            <section className="creator-premium-section mt-2">
              <div className="creator-premium-card p-5 sm:p-6 text-center sm:text-left">
                <p className="text-[11px] uppercase tracking-[0.28em] font-semibold creator-premium-label">
                  Seu canal também
                </p>
                <h2 className="font-display text-lg sm:text-xl font-bold text-[var(--premium-cream)] mt-2">
                  Quer um perfil verificado como este?
                </h2>
                <p className="text-sm text-[var(--premium-muted)] mt-2 max-w-xl leading-relaxed mx-auto sm:mx-0">
                  Adicione um código na descrição do seu canal no YouTube e seja verificado na CineReact em até 24 horas.
                </p>
                <button
                  type="button"
                  onClick={onVerifyProfile}
                  className="creator-premium-btn-primary mt-4 w-full sm:w-auto"
                >
                  <BadgeCheck className="w-4 h-4" strokeWidth={2.25} />
                  Verificar perfil
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
