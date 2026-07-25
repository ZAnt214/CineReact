import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { User } from 'lucide-react';
import { PremiumFrameRing } from '../rewards/PremiumRewardSurface.tsx';
import { AvatarRewardVisual } from '../rewards/RewardPreview.tsx';
import { resolvePublicProfileDisplay } from '../../gamification/profileDisplay.ts';
import type { ProfileLoadout, PublicProfileDisplay } from '../../types/gamification.ts';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

const SIZE_MAP = {
  xs: { frame: 'sm' as const, img: 'w-7 h-7', avatarVisual: 'sm' as const },
  sm: { frame: 'sm' as const, img: 'w-8 h-8', avatarVisual: 'sm' as const },
  md: { frame: 'md' as const, img: 'w-10 h-10', avatarVisual: 'md' as const },
  lg: { frame: 'lg' as const, img: 'w-16 h-16 md:w-20 md:h-20', avatarVisual: 'lg' as const },
  xl: { frame: 'xl' as const, img: 'w-24 h-24 md:w-28 md:h-28', avatarVisual: 'lg' as const },
};

export interface ProfileAvatarProps {
  photoUrl?: string;
  alt?: string;
  size?: keyof typeof SIZE_MAP;
  loadout?: ProfileLoadout | null;
  profileDisplay?: PublicProfileDisplay | null;
  showFrame?: boolean;
  showEffect?: boolean;
  className?: string;
  donorBadge?: boolean;
}

function AvatarInner({
  photoUrl,
  alt,
  size,
  avatarVisual,
}: {
  photoUrl?: string;
  alt?: string;
  size: keyof typeof SIZE_MAP;
  avatarVisual?: PublicProfileDisplay['avatarVisual'];
}) {
  const cfg = SIZE_MAP[size];

  if (avatarVisual) {
    return <AvatarRewardVisual visual={avatarVisual} size={cfg.avatarVisual} />;
  }

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={alt || ''}
        className={`${cfg.img} rounded-full object-cover bg-zinc-900`}
      />
    );
  }

  return (
    <motion.div
      className={`${cfg.img} rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500`}
    >
      <User className={size === 'xs' || size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
    </motion.div>
  );
}

export default function ProfileAvatar({
  photoUrl,
  alt = '',
  size = 'md',
  loadout,
  profileDisplay,
  showFrame = true,
  showEffect = true,
  className = '',
  donorBadge = false,
}: ProfileAvatarProps) {
  const display = useMemo(
    () => profileDisplay || resolvePublicProfileDisplay(loadout),
    [profileDisplay, loadout]
  );

  const cfg = SIZE_MAP[size];
  const hasFrame = showFrame && !!display.frameVisualStyle;
  const src = photoUrl || DEFAULT_AVATAR;

  const avatarNode = (
    <AvatarInner
      photoUrl={src}
      alt={alt}
      size={size}
      avatarVisual={display.avatarVisual}
    />
  );

  return (
    <motion.div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {showEffect && display.effectAnimated && (
        <motion.div
          className="absolute -inset-1 rounded-full bg-gradient-to-tr from-amber-500/20 via-purple-500/20 to-cyan-500/20 blur-sm pointer-events-none"
          animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.98, 1.04, 0.98] }}
          transition={{ duration: 3.5, repeat: Infinity }}
        />
      )}

      {hasFrame ? (
        <PremiumFrameRing
          visualStyle={display.frameVisualStyle}
          size={cfg.frame}
          showOrnaments={size !== 'xs' && size !== 'sm'}
        >
          {avatarNode}
        </PremiumFrameRing>
      ) : (
        avatarNode
      )}

      {donorBadge && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full border border-zinc-950 flex items-center justify-center shadow-lg z-20">
          <span className="text-[8px] text-black font-black">★</span>
        </span>
      )}
    </motion.div>
  );
}
