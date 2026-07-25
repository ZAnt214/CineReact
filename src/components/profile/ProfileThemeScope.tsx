import React, { useMemo } from 'react';
import { getVisualStyle } from '../../data/rewardVisualStyles.ts';
import { resolvePublicProfileDisplay } from '../../gamification/profileDisplay.ts';
import type { ProfileLoadout, PublicProfileDisplay } from '../../types/gamification.ts';

export type ProfileThemeTone = 'dark' | 'light';

export const ProfileThemeContext = React.createContext<ProfileThemeTone>('dark');

export function useProfileThemeTone() {
  return React.useContext(ProfileThemeContext);
}

export interface ProfileThemeScopeProps {
  loadout?: ProfileLoadout | null;
  profileDisplay?: PublicProfileDisplay | null;
  className?: string;
  children: React.ReactNode;
}

export default function ProfileThemeScope({
  loadout,
  profileDisplay,
  className = '',
  children,
}: ProfileThemeScopeProps) {
  const display = useMemo(
    () => profileDisplay || resolvePublicProfileDisplay(loadout),
    [profileDisplay, loadout]
  );

  const tone = display.themeTone ?? 'dark';
  const themeStyle = display.themeVisualStyle ? getVisualStyle(display.themeVisualStyle) : null;
  const useCss = !!themeStyle?.gradientCss;

  return (
    <ProfileThemeContext.Provider value={tone}>
      <div data-theme-tone={tone} className={`profile-themed-scope relative ${className}`}>
        {themeStyle && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
            <div
              className={`absolute inset-0 ${useCss && themeStyle.animated ? 'profile-surface-gradient' : ''} ${themeStyle.shimmer ? 'profile-surface-shimmer' : ''}`}
              style={useCss ? { background: themeStyle.gradientCss } : undefined}
            >
              {!useCss && (
                <div className={`absolute inset-0 bg-gradient-to-br ${themeStyle.gradient}`} />
              )}
            </div>
            <div className="absolute inset-0 profile-theme-scrim pointer-events-none" />
          </div>
        )}
        <div className="relative z-10">{children}</div>
      </div>
    </ProfileThemeContext.Provider>
  );
}
