import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, X, Zap } from 'lucide-react';
import type { GamificationReward } from '../types/gamification.ts';

interface GamificationRewardToastProps {
  reward: GamificationReward | null;
  onClose: () => void;
}

export default function GamificationRewardToast({ reward, onClose }: GamificationRewardToastProps) {
  return (
    <AnimatePresence>
      {reward && (reward.xp > 0 || reward.spotlight > 0 || reward.achievements.length > 0 || reward.levelUp || (reward.unlockedItems?.length ?? 0) > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-[200] max-w-sm w-full"
        >
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-zinc-950/95 backdrop-blur-xl shadow-[0_0_40px_rgba(245,158,11,0.15)] p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/5 pointer-events-none" />
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-lg text-zinc-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {reward.levelUp && (
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-black text-amber-300 uppercase tracking-wider">
                  Novo nível: {reward.levelUp.tier}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-2">
              {reward.xp > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
                  +{reward.xp} XP
                </span>
              )}
              {reward.spotlight > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  +{reward.spotlight}
                </span>
              )}
            </div>

            {reward.unlockedItems?.map((item) => (
              <div key={item.id} className="flex items-start gap-2 mt-2 p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/20">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">Novo item: {item.name}</p>
                  <p className="text-[10px] text-zinc-500">{item.description}</p>
                </div>
              </div>
            ))}

            {reward.achievements.map((a) => (
              <div key={a.id} className="flex items-start gap-2 mt-2 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">{a.name}</p>
                  <p className="text-[10px] text-zinc-500">{a.description}</p>
                </div>
              </div>
            ))}

            {reward.message && (
              <p className="text-[11px] text-zinc-400 mt-2">{reward.message}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
