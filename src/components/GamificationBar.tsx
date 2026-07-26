import React from 'react';
import { motion } from 'motion/react';
import { Flame, Sparkles, Zap } from 'lucide-react';
import { getXpProgress, getTierFromXp } from '../data/gamification.ts';
import type { GamificationMeResponse } from '../types/gamification.ts';

interface GamificationBarProps {
  data: GamificationMeResponse | null;
  compact?: boolean;
  onClick?: () => void;
}

export default function GamificationBar({ data, compact = false, onClick }: GamificationBarProps) {
  if (!data?.profile) return null;

  const { profile, tier } = data;
  const progress = getXpProgress(profile.xp);
  const tierDef = getTierFromXp(profile.xp);

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-stone-400/30 transition-all cursor-pointer group"
      >
        <div className="flex flex-col items-end min-w-[72px]">
          <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400/80">{tier}</span>
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-0.5">
            <motion.div
              className="h-full bg-gradient-to-r from-stone-500 to-stone-300"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
        {profile.currentStreak > 0 && (
          <span className="flex items-center gap-0.5 text-stone-400 text-xs font-bold">
            <Flame className="w-3.5 h-3.5" />
            {profile.currentStreak}
          </span>
        )}
        <span className="flex items-center gap-1 text-stone-200 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          {profile.spotlight}
        </span>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-zinc-800/70 bg-zinc-900/30 p-4"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Índice de Influência</p>
          <p className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-stone-100 to-stone-400">
            {tier}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-stone-300">{profile.influenceIndex}</p>
          <p className="text-[10px] text-zinc-500">influência</p>
        </div>
      </div>

      <div className="mb-2 flex justify-between text-[10px] text-zinc-500 font-mono">
        <span>{profile.xp} XP</span>
        <span>{progress.percent}%</span>
      </div>
      <div className="h-2 bg-zinc-800/80 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full bg-gradient-to-r from-stone-500 via-stone-300 to-stone-200 shadow-[0_0_12px_rgba(168,162,158,0.4)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress.percent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center gap-4 text-xs">
        {profile.currentStreak > 0 && (
          <span className="flex items-center gap-1.5 text-stone-400 font-bold">
            <Flame className="w-4 h-4" />
            {profile.currentStreak} dias
          </span>
        )}
        <span className="flex items-center gap-1.5 text-stone-200 font-bold">
          <Sparkles className="w-4 h-4" />
          {profile.spotlight} Spotlight
        </span>
        {profile.featuredInfluencer && (
          <span className="flex items-center gap-1 text-purple-400 font-bold ml-auto">
            <Zap className="w-3.5 h-3.5" />
            Influente
          </span>
        )}
      </div>
      <p className="text-[10px] text-zinc-600 mt-2 leading-snug">{tierDef.description}</p>
    </motion.div>
  );
}
