import React, { useMemo } from 'react';
import { getVisualStyle } from '../../data/rewardVisualStyles.ts';
import { resolvePublicProfileDisplay, resolveUserProfileDisplay } from '../../gamification/profileDisplay.ts';
import type { ProfileLoadout, PublicProfileDisplay } from '../../types/gamification.ts';

export type ProfileThemeTone = 'dark' | 'light';

export const ProfileThemeContext = React.createContext<ProfileThemeTone>('dark');

export function useProfileThemeTone() {
  return React.useContext(ProfileThemeContext);
}

export interface ProfileThemeScopeProps {
  loadout?: ProfileLoadout | null;
  profileDisplay?: PublicProfileDisplay | null;
  isDonor?: boolean;
  variant?: 'default' | 'fullscreen' | 'lite';
  className?: string;
  children: React.ReactNode;
}

export default function ProfileThemeScope({
  loadout,
  profileDisplay,
  isDonor = false,
  variant = 'default',
  className = '',
  children,
}: ProfileThemeScopeProps) {
  const display = useMemo(
    () => profileDisplay || resolveUserProfileDisplay(loadout, isDonor),
    [profileDisplay, loadout, isDonor]
  );

  const tone = display.themeTone ?? 'dark';
  const themeStyle = display.themeVisualStyle ? getVisualStyle(display.themeVisualStyle) : null;
  const useCss = !!themeStyle?.gradientCss;

  const isFullscreen = variant === 'fullscreen';
  const isLite = variant === 'lite';
  const isAtelier = display.themeVisualStyle === 'atelier' && !isLite && !isFullscreen;
  const useAnimation = themeStyle?.animated && !isLite && !isFullscreen;
  const useShimmer = themeStyle?.shimmer && !isLite && !isFullscreen;

  return (
    <ProfileThemeContext.Provider value={tone}>
      <div
        data-theme-tone={tone}
        data-visual-style={display.themeVisualStyle}
        className={`profile-themed-scope relative ${isFullscreen ? 'profile-themed-scope-fullscreen' : ''} ${isLite ? 'profile-themed-scope-lite' : ''} ${isAtelier ? 'profile-theme-atelier' : ''} ${className}`}
      >
        {themeStyle && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
            {isFullscreen && <div className="absolute inset-0 bg-neutral-950" />}
            {isAtelier && (
              <div className="profile-atelier-beam absolute inset-x-0 top-0 h-[50%]" />
            )}
            <div
              className={`absolute inset-0 ${useCss && useAnimation ? 'profile-surface-gradient' : ''} ${useShimmer ? 'profile-surface-shimmer' : ''}`}
              style={useCss ? { background: themeStyle.gradientCss } : undefined}
            >
              {!useCss && (
                <div className={`absolute inset-0 bg-gradient-to-br ${themeStyle.gradient}`} />
              )}
            </div>
            <div className="absolute inset-0 profile-theme-scrim pointer-events-none" />
          </div>
        )}
        <div className={`relative z-10 ${isFullscreen ? 'flex flex-col flex-1 min-h-0 h-full w-full' : ''}`}>{children}</div>
      </div>
    </ProfileThemeContext.Provider>
  );
}
