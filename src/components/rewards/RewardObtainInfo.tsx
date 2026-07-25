import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  TrendingUp,
  Trophy,
  UserPlus,
  Play,
  Calendar,
  Ticket,
  Zap,
  Flame,
  Gift,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { UNLOCK_METHOD_INFO, formatObtainText } from '../../data/rewardVisualStyles.ts';
import type { InventoryItemView, UnlockMethod } from '../../types/gamification.ts';

const METHOD_ICONS: Record<UnlockMethod, React.ElementType> = {
  default: Gift,
  shop: Sparkles,
  level: TrendingUp,
  achievement: Trophy,
  follow_creator: UserPlus,
  watch_creator: Play,
  seasonal: Calendar,
  promo_code: Ticket,
  event: Zap,
  streak: Flame,
  legacy: Gift,
};

interface RewardObtainInfoProps {
  item: Pick<
    InventoryItemView,
    'owned' | 'unlockMethod' | 'obtainHint' | 'cost' | 'unlockedAt' | 'limited' | 'seasonalEvent'
  >;
  variant?: 'card' | 'modal' | 'compact';
}

export default function RewardObtainInfo({ item, variant = 'card' }: RewardObtainInfoProps) {
  const method = item.unlockMethod || 'shop';
  const Icon = item.owned ? CheckCircle2 : METHOD_ICONS[method];
  const info = UNLOCK_METHOD_INFO[method];
  const obtainText = formatObtainText({
    unlockMethod: method,
    obtainHint: item.obtainHint,
    cost: item.cost,
    owned: item.owned,
  });

  if (variant === 'compact') {
    const ownedCollectible = item.owned && (item as InventoryItemView).category;
    const showReason = item.owned && (ownedCollectible === 'badge' || ownedCollectible === 'tag');
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
        <Icon className={`w-3 h-3 shrink-0 ${item.owned ? 'text-emerald-400' : 'text-amber-500/70'}`} />
        {showReason
          ? `Por: ${item.obtainHint}`
          : item.owned && item.unlockedAt
            ? `Desbloqueado em ${new Date(item.unlockedAt).toLocaleDateString('pt-BR')}`
            : obtainText}
      </span>
    );
  }

  const isModal = variant === 'modal';

  return (
    <motion.div
      className={`rounded-xl border ${
        item.owned
          ? 'border-emerald-500/25 bg-emerald-950/20'
          : 'border-amber-500/20 bg-amber-950/10'
      } ${isModal ? 'p-4' : 'p-2.5'}`}
    >
      <div className="flex items-start gap-2.5">
        <motion.div
          className={`shrink-0 rounded-lg flex items-center justify-center ${
            isModal ? 'w-9 h-9' : 'w-7 h-7'
          } ${
            item.owned
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-amber-500/10 text-amber-400'
          }`}
        >
          <Icon className={isModal ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        </motion.div>
        <div className="min-w-0 flex-1">
          <p className={`font-bold uppercase tracking-wider text-zinc-500 ${isModal ? 'text-[10px]' : 'text-[9px]'}`}>
            {item.owned ? 'Como obteve' : 'Como obter'}
          </p>
          <p className={`font-semibold text-zinc-200 leading-snug mt-0.5 ${isModal ? 'text-sm' : 'text-[11px]'}`}>
            {item.owned && (item as InventoryItemView).category && ['badge', 'tag'].includes((item as InventoryItemView).category)
              ? item.obtainHint
              : item.owned && item.unlockedAt
                ? `Desbloqueado em ${new Date(item.unlockedAt).toLocaleDateString('pt-BR')}`
                : obtainText}
          </p>
          {!item.owned && (
            <p className={`text-zinc-500 mt-1 ${isModal ? 'text-xs' : 'text-[10px]'}`}>
              <span className="text-amber-500/80 font-medium">{info.shortLabel}</span>
              {item.limited && (
                <span className="ml-2 text-rose-400 font-bold">· Edição limitada</span>
              )}
              {item.seasonalEvent && (
                <span className="ml-2 text-purple-400">· Evento sazonal</span>
              )}
            </p>
          )}
          {!item.owned && method === 'shop' && item.cost > 0 && (
            <p className={`flex items-center gap-1 mt-1.5 text-amber-400 font-bold ${isModal ? 'text-xs' : 'text-[10px]'}`}>
              <Sparkles className="w-3 h-3" />
              Custa {item.cost} Spotlight
            </p>
          )}
          {!item.owned && method !== 'shop' && item.cost === 0 && (
            <p className={`flex items-center gap-1 mt-1.5 text-zinc-500 ${isModal ? 'text-xs' : 'text-[10px]'}`}>
              <Lock className="w-3 h-3" />
              Não disponível na loja
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
