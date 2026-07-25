import React from 'react';
import ProfileThemeScope from './ProfileThemeScope.tsx';
import type { ProfileLoadout, PublicProfileDisplay } from '../../types/gamification.ts';

export interface ProfileSurfaceProps {
  loadout?: ProfileLoadout | null;
  profileDisplay?: PublicProfileDisplay | null;
  variant?: 'hero' | 'panel' | 'preview';
  themed?: boolean;
  rounded?: string;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
}

export default function ProfileSurface({
  loadout,
  profileDisplay,
  variant = 'preview',
  themed = true,
  rounded = 'rounded-3xl',
  className = '',
  innerClassName = '',
  children,
}: ProfileSurfaceProps) {
  const pad = variant === 'hero' ? 'p-6 md:p-10' : variant === 'panel' ? 'p-8' : 'p-8';

  const card = (
    <div
      className={`profile-surface-root relative overflow-hidden border border-white/10 bg-zinc-950/30 ${rounded} ${pad} min-h-0 ${className}`}
    >
      <div className={`relative z-10 ${innerClassName}`}>{children}</div>
    </div>
  );

  if (!themed) return card;

  return (
    <ProfileThemeScope loadout={loadout} profileDisplay={profileDisplay}>
      {card}
    </ProfileThemeScope>
  );
}
