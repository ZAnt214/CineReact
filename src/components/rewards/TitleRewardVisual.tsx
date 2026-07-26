import React from 'react';
import { Award } from 'lucide-react';
import { getVisualStyle, resolveVisualStyle } from '../../data/rewardVisualStyles.ts';
import type { RewardRarity } from '../../types/gamification.ts';

const RARITY_BORDER: Record<string, string> = {
  comum: 'from-zinc-500 to-zinc-600',
  incomum: 'from-sky-400 to-cyan-500',
  raro: 'from-violet-400 to-purple-500',
  épico: 'from-fuchsia-400 to-purple-600',
  lendário: 'from-stone-200 to-stone-400',
  mítico: 'from-cyan-400 via-purple-400 to-pink-400',
  exclusivo: 'from-rose-400 via-stone-200 to-violet-500',
};

const RARITY_TEXT: Record<string, string> = {
  comum: 'text-zinc-300',
  incomum: 'text-sky-200',
  raro: 'text-violet-200',
  épico: 'text-fuchsia-200',
  lendário: 'text-stone-50',
  mítico: 'text-cyan-100',
  exclusivo: 'text-rose-100',
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
  const border = RARITY_BORDER[rarity] || RARITY_BORDER.comum;
  const textColor = RARITY_TEXT[rarity] || RARITY_TEXT.comum;

  const sizes = {
    sm: { pad: 'pl-2 pr-2.5 py-0.5', text: 'text-[8px]', icon: 'w-2.5 h-2.5', bar: 'w-0.5' },
    md: { pad: 'pl-2.5 pr-3 py-1', text: 'text-[9px]', icon: 'w-3 h-3', bar: 'w-0.5' },
    lg: { pad: 'pl-3 pr-3.5 py-1.5', text: 'text-[11px]', icon: 'w-3.5 h-3.5', bar: 'w-1' },
  };
  const s = sizes[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-zinc-950/60 ${s.pad} ${className}`}
      title={name}
    >
      <span className={`self-stretch rounded-full bg-gradient-to-b ${border} ${s.bar} shrink-0 ${style.glow}`} />
      <Award className={`${s.icon} text-stone-300/80 shrink-0`} strokeWidth={2.25} />
      <span className={`font-semibold uppercase tracking-[0.14em] whitespace-nowrap ${s.text} ${textColor}`}>
        {name}
      </span>
    </span>
  );
}
