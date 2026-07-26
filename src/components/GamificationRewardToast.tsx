import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, X, Zap } from 'lucide-react';
import { RewardPreviewThumb } from './rewards/RewardPreview.tsx';
import type { GamificationReward } from '../types/gamification.ts';

interface GamificationRewardToastProps {
  reward: GamificationReward | null;
  onClose: () => void;
}

export default function GamificationRewardToast({ reward, onClose }: GamificationRewardToastProps) {
  const hasContent =
    reward &&
    (reward.xp > 0 ||
      reward.spotlight > 0 ||
      reward.achievements.length > 0 ||
      reward.levelUp ||
      (reward.unlockedItems?.length ?? 0) > 0);

  return (
    <AnimatePresence>
      {hasContent && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ type: 'spring', damping: 28, stiffness: 360 }}
          className="fixed z-[200] left-3 right-3 bottom-3 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[min(100%,18rem)] pointer-events-none"
        >
          <div className="relative overflow-hidden rounded-xl border border-cine-accent/25 bg-zinc-950/95 backdrop-blur-xl shadow-lg shadow-black/40 p-3 sm:p-3.5 pointer-events-auto max-h-[min(70vh,20rem)] flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-cine-accent-light/8 via-transparent to-purple-500/5 pointer-events-none" />
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2 right-2 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800/80 cursor-pointer z-10"
              aria-label="Fechar"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <motion.div className="relative pr-6 shrink-0">
              {reward!.levelUp && (
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap className="w-4 h-4 text-cine-accent-light shrink-0" />
                  <span className="text-[11px] font-black text-cine-cream uppercase tracking-wide leading-tight">
                    Nível {reward!.levelUp.tier}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {reward!.xp > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-cine-accent/10 border border-cine-accent/20 text-cine-cream text-[10px] font-bold">
                    +{reward!.xp} XP
                  </span>
                )}
                {reward!.spotlight > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    +{reward!.spotlight}
                  </span>
                )}
              </div>
            </motion.div>

            <div className="relative mt-2 space-y-1.5 overflow-y-auto overscroll-contain min-h-0 flex-1">
              {reward!.unlockedItems?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-1.5 rounded-lg bg-cyan-950/30 border border-cyan-500/15"
                >
                  <RewardPreviewThumb item={item} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-white truncate">{item.name}</p>
                    <p className="text-[9px] text-zinc-500 truncate">{item.description}</p>
                  </div>
                </div>
              ))}

              {reward!.achievements.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/80"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-950/60 flex items-center justify-center shrink-0">
                    <Trophy className="w-3.5 h-3.5 text-cine-accent-light" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-white truncate">{a.name}</p>
                    <p className="text-[9px] text-zinc-500 truncate">{a.description}</p>
                  </div>
                </div>
              ))}

              {reward!.message && (
                <p className="text-[10px] text-zinc-400 leading-snug pt-0.5">{reward!.message}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
