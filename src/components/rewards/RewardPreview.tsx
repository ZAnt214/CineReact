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
} from 'lucide-react';
import { CATEGORY_LABELS, RARITY_STYLES } from '../../data/rewardsCatalog.ts';
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
  | 'creatorColors'
  | 'creatorName'
  | 'owned'
>;

const BADGE_ICONS: Record<string, React.ElementType> = {
  'badge-explorador': Compass,
  'badge-curador': Star,
  'badge-lenda': Crown,
  'badge-spotlight': Sparkles,
  'badge-streak-30': Flame,
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
      <circle cx="24" cy="10" r="3.5" fill="#fbbf24" />
      <circle cx="30" cy="14" r="3" fill="#fcd34d" />
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
    gradient: 'from-amber-600 via-orange-500 to-yellow-400',
    accent: 'text-amber-100',
    CustomIcon: PopcornIcon,
  },
  clapperboard: {
    gradient: 'from-violet-700 via-purple-600 to-fuchsia-500',
    accent: 'text-purple-100',
    Icon: Clapperboard,
  },
  crown: {
    gradient: 'from-yellow-600 via-amber-500 to-yellow-300',
    accent: 'text-amber-50',
    Icon: Crown,
  },
  ghost: {
    gradient: 'from-slate-600 via-zinc-500 to-purple-400',
    accent: 'text-slate-100',
    Icon: Ghost,
  },
  spotlight: {
    gradient: 'from-purple-700 via-fuchsia-600 to-amber-400',
    accent: 'text-white',
    Icon: Sparkles,
  },
  legend: {
    gradient: 'from-rose-600 via-amber-500 to-yellow-300',
    accent: 'text-amber-50',
    Icon: Star,
  },
};

export function AvatarRewardVisual({
  visual,
  size = 'md',
  className = '',
}: {
  visual: NonNullable<RewardItemDefinition['avatarVisual']>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const cfg = AVATAR_VISUALS[visual];
  const s = SIZE_MAP[size];
  const Icon = cfg.Icon;
  const CustomIcon = cfg.CustomIcon;

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
}: {
  item: RewardLike;
  size?: 'sm' | 'md' | 'lg';
  locked?: boolean;
}) {
  const s = SIZE_MAP[size];
  const isLocked = locked || item.owned === false;

  if (isLocked) {
    return (
      <motion.div className={`${s.box} rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center shrink-0`}>
        <Lock className={`${s.icon} text-zinc-600`} />
      </motion.div>
    );
  }

  switch (item.category) {
    case 'avatar':
      if (item.avatarVisual) {
        return <AvatarRewardVisual visual={item.avatarVisual} size={size} />;
      }
      return (
        <div className={`${s.box} rounded-full bg-zinc-800 flex items-center justify-center`}>
          <Film className={`${s.icon} text-zinc-400`} />
        </div>
      );

    case 'frame':
      return (
        <div className={`${s.box} rounded-full flex items-center justify-center p-1 ${item.previewClass || 'ring-2 ring-amber-500/60'}`}>
          <motion.div
            className="w-full h-full rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900"
            animate={item.animated ? { opacity: [0.7, 1, 0.7] } : undefined}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      );

    case 'background':
    case 'theme':
    case 'profile_card':
      return (
        <motion.div
          className={`${s.box} rounded-xl border border-zinc-700/50 bg-gradient-to-br ${item.previewGradient || 'from-zinc-900 to-zinc-950'}`}
          animate={item.animated ? { scale: [1, 1.02, 1] } : undefined}
          transition={{ duration: 3, repeat: Infinity }}
        />
      );

    case 'effect':
      return (
        <motion.div
          className={`${s.box} rounded-xl bg-zinc-900 border border-purple-500/30 flex items-center justify-center relative overflow-hidden`}
          animate={{ boxShadow: ['0 0 8px rgba(168,85,247,0.2)', '0 0 20px rgba(245,158,11,0.35)', '0 0 8px rgba(168,85,247,0.2)'] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <Sparkles className={`${s.icon} text-purple-300`} />
        </motion.div>
      );

    case 'tag':
      return (
        <span
          className={`${s.box} rounded-full flex items-center justify-center px-2 text-center font-bold leading-tight ${s.text}`}
          style={
            item.creatorColors
              ? {
                  background: `linear-gradient(135deg, ${item.creatorColors.from}, ${item.creatorColors.to})`,
                  color: item.creatorColors.text,
                }
              : { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fffbeb' }
          }
        >
          {item.creatorName?.split(' ')[0] || item.name.split(' ')[0]}
        </span>
      );

    case 'title':
      return (
        <motion.div className={`${s.box} rounded-xl bg-zinc-900 border border-amber-500/30 flex flex-col items-center justify-center px-1`}>
          <Award className="w-4 h-4 text-amber-400 mb-0.5" />
          <span className="text-[8px] font-black uppercase tracking-wider text-amber-300 text-center leading-none">
            {item.name.slice(0, 8)}
          </span>
        </motion.div>
      );

    case 'badge': {
      const BadgeIcon = BADGE_ICONS[item.id] || Medal;
      return (
        <motion.div
          className={`${s.box} rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-amber-500/25 flex items-center justify-center`}
          whileHover={{ rotate: [0, -5, 5, 0] }}
        >
          <BadgeIcon className={`${s.icon} text-amber-400`} />
        </motion.div>
      );
    }

    case 'reaction':
    case 'emoji':
      return (
        <motion.div
          className={`${s.box} rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700 flex items-center justify-center text-2xl shadow-inner`}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className={size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-4xl'}>
            {item.emojiChar || '✨'}
          </span>
        </motion.div>
      );

    default:
      return (
        <div className={`${s.box} rounded-xl bg-zinc-900 flex items-center justify-center`}>
          <Sparkles className={`${s.icon} text-amber-400`} />
        </div>
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

  const renderInContext = () => {
    switch (item.category) {
      case 'avatar':
        return (
          <motion.div className="flex flex-col items-center gap-3">
            <motion.div
              className={`rounded-full p-1 ${item.previewClass || 'ring-2 ring-amber-500/50'}`}
              animate={item.animated ? { boxShadow: ['0 0 12px rgba(245,158,11,0.2)', '0 0 28px rgba(245,158,11,0.45)', '0 0 12px rgba(245,158,11,0.2)'] } : undefined}
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
          <div className="flex flex-col items-center gap-3">
            <motion.div className={`rounded-full p-1.5 ${item.previewClass || 'ring-2 ring-amber-500/60'}`}>
              <img
                src={userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                alt=""
                className="w-20 h-20 rounded-full object-cover"
              />
            </motion.div>
            <p className="text-[10px] text-zinc-500">Moldura ao redor da foto de perfil</p>
          </div>
        );

      case 'title':
        return (
          <motion.div className="text-center space-y-2">
            <p className="text-lg font-black text-white">{userName}</p>
            <motion.p
              className="text-sm font-bold text-amber-400 uppercase tracking-[0.2em]"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {item.name}
            </motion.p>
            <p className="text-[10px] text-zinc-500">Título exibido abaixo do nome</p>
          </motion.div>
        );

      case 'tag':
        return (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-bold text-white">{userName}</p>
            <span
              className="text-xs font-bold px-4 py-1.5 rounded-full"
              style={
                item.creatorColors
                  ? {
                      background: `linear-gradient(90deg, ${item.creatorColors.from}, ${item.creatorColors.to})`,
                      color: item.creatorColors.text,
                    }
                  : undefined
              }
            >
              {item.name}
            </span>
            <p className="text-[10px] text-zinc-500">Tag visível no perfil público</p>
          </div>
        );

      case 'badge': {
        const BadgeIcon = BADGE_ICONS[item.id] || Medal;
        return (
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-3">
              <BadgeIcon className="w-10 h-10 text-amber-400" />
              <BadgeIcon className="w-10 h-10 text-amber-400/60" />
            </div>
            <p className="text-sm font-bold text-white">{item.name}</p>
            <p className="text-[10px] text-zinc-500">Emblemas ao lado do perfil (máx. 2)</p>
          </div>
        );
      }

      case 'background':
      case 'theme':
        return (
          <motion.div
            className={`w-full max-w-[240px] h-32 rounded-2xl border border-zinc-700/50 bg-gradient-to-br ${item.previewGradient || 'from-zinc-900 to-zinc-950'} flex items-center justify-center`}
            animate={item.animated ? { opacity: [0.85, 1, 0.85] } : undefined}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Eye className="w-6 h-6 text-white/40" />
          </motion.div>
        );

      case 'profile_card':
        return (
          <motion.div
            className={`w-full max-w-[260px] rounded-2xl border border-zinc-700/60 p-5 bg-gradient-to-br ${item.previewGradient || 'from-zinc-900 to-zinc-950'}`}
            animate={item.animated ? { boxShadow: ['0 0 0 rgba(245,158,11,0)', '0 0 30px rgba(245,158,11,0.15)', '0 0 0 rgba(245,158,11,0)'] } : undefined}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800 mb-2" />
              <p className="text-sm font-bold text-white">{userName}</p>
              <p className="text-[10px] text-zinc-500 mt-2">Cartão de perfil personalizado</p>
            </div>
          </motion.div>
        );

      case 'effect':
        return (
          <motion.div className="relative flex flex-col items-center gap-3">
            <motion.div
              className="absolute w-28 h-28 rounded-full bg-amber-500/20 blur-xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <div className="relative w-20 h-20 rounded-full ring-2 ring-amber-500/40 flex items-center justify-center bg-zinc-900">
              <Zap className="w-8 h-8 text-amber-400" />
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
            <div className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
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
          className={`relative w-full max-w-sm rounded-2xl border ${rarityStyle.border} bg-zinc-950 shadow-2xl overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div className={`absolute inset-0 opacity-30 ${rarityStyle.bg} pointer-events-none`} />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <motion.div className="relative border-b border-zinc-800/80 px-5 pt-5 pb-4">
            <div className="flex items-start gap-3 pr-8">
              <RewardPreviewThumb item={item} size="md" locked={!item.owned} />
              <motion.div className="min-w-0 flex-1">
                <h3 className="font-black text-white text-base leading-tight">{item.name}</h3>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">{item.description}</p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div className="relative bg-zinc-900/40 min-h-[200px] flex items-center justify-center">
            <RewardProfileContextPreview item={item} userName={userName} userAvatar={userAvatar} />
          </motion.div>

          <motion.div className="relative px-5 py-4 border-t border-zinc-800/80 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
            >
              Fechar
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
