import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  Clapperboard,
  Crown,
  Ghost,
  Sparkles,
  Star,
  Flame,
  Compass,
  Medal,
  Award,
  Zap,
  Film,
  Eye,
  Palette,
  BadgeCheck,
} from 'lucide-react';
import { CATEGORY_LABELS, RARITY_STYLES } from '../../data/rewardsCatalog.ts';
import { getVisualStyle, resolveVisualStyle } from '../../data/rewardVisualStyles.ts';
import { PremiumFrameRing, PremiumFullPreview, PremiumRewardSurface } from './PremiumRewardSurface.tsx';
import RewardObtainInfo from './RewardObtainInfo.tsx';
import TitleRewardVisual from './TitleRewardVisual.tsx';
import CreatorTagVisual from './CreatorTagVisual.tsx';
import type { InventoryItemView, RewardItemDefinition } from '../../types/gamification.ts';

type RewardLike = Pick<
  InventoryItemView,
  | 'id'
  | 'name'
  | 'description'
  | 'category'
  | 'rarity'
  | 'previewClass'
  | 'previewGradient'
  | 'animated'
  | 'emojiChar'
  | 'avatarVisual'
  | 'visualStyle'
  | 'creatorColors'
  | 'creatorName'
  | 'owned'
  | 'unlockMethod'
  | 'obtainHint'
  | 'cost'
  | 'unlockedAt'
  | 'limited'
  | 'seasonalEvent'
>;

const BADGE_ICONS: Record<string, React.ElementType> = {
  'badge-explorador': Compass,
  'badge-curador': Star,
  'badge-lenda': Crown,
  'badge-spotlight': Sparkles,
  'badge-streak-30': Flame,
  'badge-atelie-visionario': Palette,
  'badge-perfil-verificado-oficial': BadgeCheck,
};

const SIZE_MAP = {
  sm: { box: 'w-12 h-12', icon: 'w-5 h-5', text: 'text-[10px]', avatar: 'w-10 h-10', inner: 'w-4 h-4' },
  md: { box: 'w-16 h-16', icon: 'w-7 h-7', text: 'text-xs', avatar: 'w-14 h-14', inner: 'w-6 h-6' },
  lg: { box: 'w-24 h-24', icon: 'w-10 h-10', text: 'text-sm', avatar: 'w-20 h-20', inner: 'w-9 h-9' },
};

function PopcornIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 32h28l-3 10H13l-3-10z" fill="currentColor" opacity="0.85" />
      <path d="M14 32V18c0-4 4-8 10-8s10 4 10 8v14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="18" cy="14" r="3" fill="#fde68a" />
      <circle cx="24" cy="10" r="3.5" fill="#fafafa" />
      <circle cx="30" cy="14" r="3" fill="#fafafa" />
      <circle cx="21" cy="18" r="2.5" fill="#fef3c7" />
      <circle cx="27" cy="17" r="2.5" fill="#fde68a" />
    </svg>
  );
}

const AVATAR_VISUALS: Record<
  NonNullable<RewardItemDefinition['avatarVisual']>,
  { gradient: string; accent: string; Icon?: React.ElementType; CustomIcon?: React.FC<{ className?: string }> }
> = {
  popcorn: {
    gradient: 'from-cine-accent-dark via-cine-accent-dark to-cine-accent-light',
    accent: 'text-cine-cream',
    CustomIcon: PopcornIcon,
  },
  clapperboard: {
    gradient: 'from-violet-700 via-purple-600 to-fuchsia-500',
    accent: 'text-purple-100',
    Icon: Clapperboard,
  },
  crown: {
    gradient: 'from-cine-accent-dark via-cine-accent to-cine-cream',
    accent: 'text-cine-cream',
    Icon: Crown,
  },
  ghost: {
    gradient: 'from-slate-600 via-zinc-500 to-purple-400',
    accent: 'text-slate-100',
    Icon: Ghost,
  },
  spotlight: {
    gradient: 'from-purple-700 via-fuchsia-600 to-cine-accent-light',
    accent: 'text-white',
    Icon: Sparkles,
  },
  legend: {
    gradient: 'from-rose-600 via-cine-accent to-cine-cream',
    accent: 'text-cine-cream',
    Icon: Star,
  },
  atelier: {
    gradient: 'from-fuchsia-500 via-cyan-400 to-cine-accent-light',
    accent: 'text-white',
    Icon: Palette,
  },
};

export function AvatarRewardVisual({
  visual,
  size = 'md',
  className = '',
  lite = false,
}: {
  visual: NonNullable<RewardItemDefinition['avatarVisual']>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  lite?: boolean;
}) {
  const cfg = AVATAR_VISUALS[visual];
  const s = SIZE_MAP[size];
  const Icon = cfg.Icon;
  const CustomIcon = cfg.CustomIcon;

  if (lite) {
    return (
      <div
        className={`relative rounded-full bg-gradient-to-br ${cfg.gradient} shadow-lg flex items-center justify-center overflow-hidden ${s.avatar} ${className}`}
      >
        <div className={`relative z-10 ${cfg.accent}`}>
          {CustomIcon ? <CustomIcon className={s.inner} /> : Icon ? <Icon className={s.inner} strokeWidth={1.75} /> : null}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`relative rounded-full bg-gradient-to-br ${cfg.gradient} shadow-lg flex items-center justify-center overflow-hidden ${s.avatar} ${className}`}
      whileHover={{ scale: 1.03 }}
    >
      <motion.div
        className="absolute inset-0 bg-white/10"
        animate={{ opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <div className={`relative z-10 ${cfg.accent}`}>
        {CustomIcon ? <CustomIcon className={s.inner} /> : Icon ? <Icon className={s.inner} strokeWidth={1.75} /> : null}
      </div>
      <motion.div
        className="absolute -inset-1 rounded-full border border-white/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
}

export function RewardPreviewThumb({
  item,
  size = 'sm',
  locked = false,
  lite = false,
}: {
  item: RewardLike;
  size?: 'sm' | 'md' | 'lg';
  locked?: boolean;
  lite?: boolean;
}) {
  const s = SIZE_MAP[size];
  const isLocked = locked || item.owned === false;
  const visual = resolveVisualStyle(item);
  const styleCfg = getVisualStyle(visual);

  if (isLocked) {
    return (
      <div className={`${s.box} rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-center shrink-0`}>
        <Lock className={`${s.icon} text-zinc-600`} />
      </div>
    );
  }

  switch (item.category) {
    case 'avatar':
      if (item.avatarVisual) {
        return <AvatarRewardVisual visual={item.avatarVisual} size={size} lite={lite} />;
      }
      return (
        <div className={`${s.box} rounded-full bg-neutral-800 flex items-center justify-center`}>
          <Film className={`${s.icon} text-zinc-400`} />
        </div>
      );

    case 'frame':
      return (
        <PremiumFrameRing visualStyle={visual} size={size} lite={lite}>
          <div className={`${size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-20 h-20' : 'w-14 h-14'} rounded-full bg-gradient-to-br ${styleCfg.gradient}`} />
        </PremiumFrameRing>
      );

    case 'background':
    case 'theme':
    case 'profile_card':
      return <PremiumRewardSurface visualStyle={visual} size={size} rounded="xl" lite={lite} />;

    case 'effect':
      return (
        <PremiumRewardSurface visualStyle={visual} size={size} rounded="xl" lite={lite}>
          <Zap className={`${s.icon} ${styleCfg.accent}`} />
        </PremiumRewardSurface>
      );

    case 'tag':
      return (
        <CreatorTagVisual
          id={item.id}
          name={item.name}
          creatorName={item.creatorName}
          creatorColors={item.creatorColors}
          size={size}
        />
      );

    case 'title':
      return (
        <TitleRewardVisual
          name={item.name}
          rarity={item.rarity}
          item={item}
          size={size}
        />
      );

    case 'badge': {
      const BadgeIcon = BADGE_ICONS[item.id] || Medal;
      return (
        <PremiumRewardSurface visualStyle={visual} size={size} rounded="xl" lite={lite}>
          <BadgeIcon className={`${s.icon} ${styleCfg.accent}`} />
        </PremiumRewardSurface>
      );
    }

    case 'reaction':
    case 'emoji':
      return (
        <PremiumRewardSurface visualStyle={visual} size={size} rounded="2xl" lite={lite}>
          <span className={size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-4xl'}>
            {item.emojiChar || '✨'}
          </span>
        </PremiumRewardSurface>
      );

    default:
      return (
        <PremiumRewardSurface visualStyle={visual} size={size} rounded="xl" lite={lite}>
          <Sparkles className={`${s.icon} ${styleCfg.accent}`} />
        </PremiumRewardSurface>
      );
  }
}

export function RewardProfileContextPreview({
  item,
  userName = 'Seu Nome',
  userAvatar,
}: {
  item: RewardLike;
  userName?: string;
  userAvatar?: string;
}) {
  const rarityStyle = RARITY_STYLES[item.rarity];
  const visual = resolveVisualStyle(item);
  const styleCfg = getVisualStyle(visual);

  const renderInContext = () => {
    switch (item.category) {
      case 'avatar':
        return (
          <motion.div className="flex flex-col items-center gap-3">
            <motion.div
              className={`rounded-full p-1 ${item.previewClass || 'ring-2 ring-cine-accent/50'}`}
              animate={item.animated ? { boxShadow: ['0 0 12px rgba(255,255,255,0.2)', '0 0 28px rgba(255,255,255,0.45)', '0 0 12px rgba(255,255,255,0.2)'] } : undefined}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              {item.avatarVisual ? (
                <AvatarRewardVisual visual={item.avatarVisual} size="lg" />
              ) : (
                <img
                  src={userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover"
                />
              )}
            </motion.div>
            <p className="text-sm font-bold text-white">{userName}</p>
            <p className="text-[10px] text-zinc-500">Como aparece no seu perfil</p>
          </motion.div>
        );

      case 'frame':
        return (
          <motion.div className="flex flex-col items-center gap-3">
            <PremiumFrameRing visualStyle={visual} size="lg">
              <img
                src={userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                alt=""
                className="w-20 h-20 rounded-full object-cover"
              />
            </PremiumFrameRing>
            <p className="text-[10px] text-zinc-500">Moldura ao redor da foto de perfil</p>
          </motion.div>
        );

      case 'title':
        return (
          <motion.div className="flex flex-col items-center gap-4 w-full">
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 w-full max-w-[280px]">
              <p className="text-center text-lg font-black text-white mb-3">{userName}</p>
              <div className="flex justify-center">
                <TitleRewardVisual name={item.name} rarity={item.rarity} item={item} size="lg" />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 text-center max-w-[220px]">
              O título aparece em destaque logo abaixo do seu nome no perfil público
            </p>
          </motion.div>
        );

      case 'tag':
        return (
          <motion.div className="flex flex-col items-center gap-4 w-full">
            <motion.div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 w-full max-w-[280px] flex flex-col items-center gap-3">
              <p className="text-sm font-bold text-white">{userName}</p>
              <CreatorTagVisual
                id={item.id}
                name={item.name}
                creatorName={item.creatorName}
                creatorColors={item.creatorColors}
                size="lg"
              />
            </motion.div>
            <p className="text-[10px] text-zinc-500 text-center max-w-[240px]">
              Tags de criador ficam visíveis no seu perfil para mostrar sua comunidade favorita
            </p>
          </motion.div>
        );

      case 'badge': {
        const BadgeIcon = BADGE_ICONS[item.id] || Medal;
        return (
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-3">
              <BadgeIcon className="w-10 h-10 text-cine-accent-light" />
              <BadgeIcon className="w-10 h-10 text-cine-accent-light/60" />
            </div>
            <p className="text-sm font-bold text-white">{item.name}</p>
            <p className="text-[10px] text-zinc-500">Emblemas ao lado do perfil (máx. 2)</p>
          </div>
        );
      }

      case 'background':
      case 'theme':
        return (
          <motion.div className="flex flex-col items-center gap-3 w-full">
            <PremiumFullPreview visualStyle={visual} />
            <p className="text-[10px] text-zinc-500">Estilo {styleCfg.label} aplicado ao perfil</p>
          </motion.div>
        );

      case 'profile_card':
        return (
          <motion.div
            className={`w-full max-w-[260px] rounded-2xl border border-zinc-700/60 p-5 bg-gradient-to-br ${item.previewGradient || 'from-neutral-900 to-neutral-950'}`}
            animate={item.animated ? { boxShadow: ['0 0 0 rgba(255,255,255,0)', '0 0 30px rgba(255,255,255,0.15)', '0 0 0 rgba(255,255,255,0)'] } : undefined}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-neutral-800 mb-2" />
              <p className="text-sm font-bold text-white">{userName}</p>
              <p className="text-[10px] text-zinc-500 mt-2">Cartão de perfil personalizado</p>
            </div>
          </motion.div>
        );

      case 'effect':
        return (
          <motion.div className="relative flex flex-col items-center gap-3">
            <motion.div
              className="absolute w-28 h-28 rounded-full bg-cine-accent/20 blur-xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <div className="relative w-20 h-20 rounded-full ring-2 ring-cine-accent/40 flex items-center justify-center bg-neutral-900">
              <Zap className="w-8 h-8 text-cine-accent-light" />
            </div>
            <p className="text-[10px] text-zinc-500">Efeito animado no perfil</p>
          </motion.div>
        );

      case 'reaction':
      case 'emoji':
        return (
          <motion.div className="flex flex-col items-center gap-4">
            <motion.div
              className="text-6xl"
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {item.emojiChar || '✨'}
            </motion.div>
            <div className="px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-zinc-400">
              Usado em comentários e reações
            </div>
          </motion.div>
        );

      default:
        return <RewardPreviewThumb item={item} size="lg" />;
    }
  };

  return (
    <div className="flex flex-col items-center py-6 px-4">
      <div className={`mb-4 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider ${rarityStyle.text} ${rarityStyle.bg} border ${rarityStyle.border}`}>
        {CATEGORY_LABELS[item.category]} · {rarityStyle.label}
      </div>
      {renderInContext()}
    </div>
  );
}

export function RewardPreviewModal({
  item,
  userName,
  userAvatar,
  onClose,
}: {
  item: InventoryItemView;
  userName?: string;
  userAvatar?: string;
  onClose: () => void;
}) {
  const rarityStyle = RARITY_STYLES[item.rarity];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className={`relative w-full max-w-sm rounded-2xl border ${rarityStyle.border} bg-neutral-950 shadow-2xl overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div className={`absolute inset-0 opacity-30 ${rarityStyle.bg} pointer-events-none`} />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <motion.div className="relative border-b border-neutral-800/80 px-5 pt-5 pb-4">
            <div className="flex items-start gap-3 pr-8">
              <RewardPreviewThumb item={item} size="md" locked={!item.owned} />
              <motion.div className="min-w-0 flex-1">
                <h3 className="font-black text-white text-base leading-tight">{item.name}</h3>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">{item.description}</p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div className="relative bg-neutral-900/40 min-h-[200px] flex items-center justify-center">
            <RewardProfileContextPreview item={item} userName={userName} userAvatar={userAvatar} />
          </motion.div>

          <motion.div className="relative px-5 py-4 border-t border-neutral-800/80 space-y-3">
            <RewardObtainInfo item={item} variant="modal" />
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-neutral-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
            >
              Fechar
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
