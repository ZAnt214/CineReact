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
  variant?: 'default' | 'fullscreen';
  className?: string;
  children: React.ReactNode;
}

export default function ProfileThemeScope({
  loadout,
  profileDisplay,
  variant = 'default',
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

  const isFullscreen = variant === 'fullscreen';
  const isAtelier = display.themeVisualStyle === 'atelier';

  return (
    <ProfileThemeContext.Provider value={tone}>
      <div
        data-theme-tone={tone}
        data-visual-style={display.themeVisualStyle}
        className={`profile-themed-scope relative ${isFullscreen ? 'profile-themed-scope-fullscreen' : ''} ${isAtelier ? 'profile-theme-atelier' : ''} ${className}`}
      >
        {themeStyle && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
            {isFullscreen && <div className="absolute inset-0 bg-zinc-950" />}
            {isAtelier && (
              <>
                <div className="profile-atelier-beam absolute inset-x-0 top-0 h-[55%]" />
                <div className="profile-atelier-orb profile-atelier-orb-teal absolute w-56 h-56 -right-16 top-[38%]" />
                <div className="profile-atelier-orb profile-atelier-orb-amber absolute w-44 h-44 -left-12 bottom-[18%]" />
                <div className="profile-atelier-grain absolute inset-0" />
              </>
            )}
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
