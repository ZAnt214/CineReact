import React from 'react';
import { motion } from 'motion/react';
import { Crown, Star, Award, Sparkles, Gem } from 'lucide-react';
import { getVisualStyle, resolveVisualStyle } from '../../data/rewardVisualStyles.ts';
import type { RewardRarity } from '../../types/gamification.ts';

const RARITY_ICON: Partial<Record<RewardRarity, React.ElementType>> = {
  comum: Award,
  incomum: Star,
  raro: Star,
  épico: Gem,
  lendário: Crown,
  mítico: Sparkles,
  exclusivo: Crown,
};

interface TitleRewardVisualProps {
  name: string;
  rarity: RewardRarity;
  item?: { id?: string; visualStyle?: import('../../types/gamification.ts').RewardVisualStyle; rarity?: RewardRarity; category?: string };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function TitleRewardVisual({
  name,
  rarity,
  item,
  size = 'md',
  className = '',
}: TitleRewardVisualProps) {
  const visual = item ? resolveVisualStyle({ ...item, rarity, category: 'title' }) : 'amber';
  const style = getVisualStyle(visual);
  const Icon = RARITY_ICON[rarity] || Award;

  const sizes = {
    sm: { wrap: 'px-2 py-1', text: 'text-[7px]', icon: 'w-3 h-3', bar: 'h-0.5' },
    md: { wrap: 'px-4 py-2', text: 'text-[10px]', icon: 'w-4 h-4', bar: 'h-0.5' },
    lg: { wrap: 'px-6 py-3', text: 'text-sm', icon: 'w-5 h-5', bar: 'h-1' },
  };
  const s = sizes[size];

  return (
    <motion.div
      className={`relative inline-flex flex-col items-center ${className}`}
      whileHover={{ scale: 1.02 }}
    >
      <div
        className={`relative overflow-hidden rounded-lg border border-white/20 ${s.wrap} ${style.glow}`}
        style={
          style.gradientCss
            ? { background: style.gradientCss, backgroundSize: style.animated ? '200% 200%' : undefined }
            : undefined
        }
      >
        {!style.gradientCss && (
          <div className={`absolute inset-0 bg-gradient-to-r ${style.gradient}`} />
        )}
        {style.shimmer && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
          />
        )}
        <div className="relative flex items-center gap-2">
          <Icon className={`${s.icon} shrink-0 text-white/90 drop-shadow`} strokeWidth={2} />
          <span
            className={`font-black uppercase tracking-[0.15em] text-white drop-shadow-sm whitespace-nowrap ${s.text}`}
          >
            {name}
          </span>
          <Icon className={`${s.icon} shrink-0 text-white/90 drop-shadow scale-x-[-1]`} strokeWidth={2} />
        </div>
        <motion.div
          className={`absolute bottom-0 left-2 right-2 ${s.bar} rounded-full bg-white/40`}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      {/* Decorative flares */}
      <motion.div
        className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-amber-400/80"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.div
        className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-amber-400/80"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </motion.div>
  );
}
