import React from 'react';
import { getVisualStyle, resolveVisualStyle } from '../../data/rewardVisualStyles.ts';
import type { RewardRarity } from '../../types/gamification.ts';

const RARITY_ACCENT: Record<string, string> = {
  comum: 'from-zinc-500/80 to-zinc-600/80',
  incomum: 'from-sky-500/80 to-cyan-500/80',
  raro: 'from-violet-500/80 to-purple-500/80',
  épico: 'from-fuchsia-500/80 to-purple-600/80',
  lendário: 'from-amber-400/90 to-yellow-500/90',
  mítico: 'from-cyan-400/80 via-purple-400/80 to-pink-400/80',
  exclusivo: 'from-rose-500/80 via-amber-400/80 to-violet-500/80',
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
  const accent = RARITY_ACCENT[rarity] || RARITY_ACCENT.comum;

  const sizes = {
    sm: { pad: 'px-2 py-0.5', text: 'text-[8px]', dot: 'w-1 h-1' },
    md: { pad: 'px-2.5 py-1', text: 'text-[9px]', dot: 'w-1.5 h-1.5' },
    lg: { pad: 'px-3 py-1.5', text: 'text-[11px]', dot: 'w-2 h-2' },
  };
  const s = sizes[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/70 backdrop-blur-sm ${s.pad} ${className}`}
      title={name}
    >
      <span className={`rounded-full bg-gradient-to-br ${accent} ${s.dot} shrink-0 ${style.glow}`} />
      <span className={`font-semibold uppercase tracking-[0.12em] text-zinc-200 whitespace-nowrap ${s.text}`}>
        {name}
      </span>
    </span>
  );
}
