import React from 'react';
import { motion } from 'motion/react';
import { Heart, Users, Crown, Radio } from 'lucide-react';

type TagTier = 'fan' | 'squad' | 'vip' | 'community';

function getTagTier(id?: string, name?: string): TagTier {
  if (id?.includes('vip')) return 'vip';
  if (id?.includes('squad')) return 'squad';
  if (name?.toLowerCase().includes('comunidade')) return 'community';
  return 'fan';
}

const TIER_CONFIG: Record<TagTier, { label: string; Icon: React.ElementType }> = {
  fan: { label: 'FÃ', Icon: Heart },
  squad: { label: 'SQUAD', Icon: Users },
  vip: { label: 'VIP', Icon: Crown },
  community: { label: 'COMUNIDADE', Icon: Radio },
};

interface CreatorTagVisualProps {
  id?: string;
  name: string;
  creatorName?: string;
  creatorColors?: { from: string; to: string; text: string };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function CreatorTagVisual({
  id,
  name,
  creatorName,
  creatorColors,
  size = 'md',
  className = '',
}: CreatorTagVisualProps) {
  const tier = getTagTier(id, name);
  const tierCfg = TIER_CONFIG[tier];
  const TierIcon = tierCfg.Icon;
  const displayName = creatorName || name.replace(/^(Fã|Comunidade|Squad|VIP)\s*/i, '');

  const sizes = {
    sm: { box: 'min-w-[3rem] max-w-[4.5rem]', pad: 'px-1.5 py-1', title: 'text-[6px]', sub: 'text-[5px]', icon: 'w-2.5 h-2.5' },
    md: { box: 'min-w-[5rem] max-w-[7rem]', pad: 'px-2.5 py-1.5', title: 'text-[8px]', sub: 'text-[6px]', icon: 'w-3 h-3' },
    lg: { box: 'min-w-[8rem] max-w-[12rem]', pad: 'px-4 py-2.5', title: 'text-xs', sub: 'text-[9px]', icon: 'w-4 h-4' },
  };
  const s = sizes[size];

  const from = creatorColors?.from || '#f59e0b';
  const to = creatorColors?.to || '#d97706';
  const text = creatorColors?.text || '#fffbeb';

  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ scale: 1.04, y: -1 }}
    >
      {/* Shield shape via clip or rounded design */}
      <div
        className={`relative ${s.box} ${s.pad} rounded-xl border border-white/25 overflow-hidden`}
        style={{
          background: `linear-gradient(145deg, ${from}, ${to})`,
          boxShadow: `0 4px 20px ${from}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
          color: text,
        }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent"
          animate={{ opacity: [0.2, 0.45, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <div className="relative flex flex-col items-center text-center gap-0.5">
          <motion.div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/20 border border-white/20"
            animate={tier === 'vip' ? { boxShadow: ['0 0 0 rgba(255,255,255,0)', '0 0 12px rgba(255,255,255,0.4)', '0 0 0 rgba(255,255,255,0)'] } : undefined}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <TierIcon className={s.icon} strokeWidth={2.5} />
            <span className={`font-black tracking-widest ${s.sub}`}>{tierCfg.label}</span>
          </motion.div>
          <span className={`font-black leading-tight ${s.title}`}>{displayName}</span>
        </div>
      </div>
      {/* Pin accent */}
      <div
        className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border border-white/30"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      />
    </motion.div>
  );
}
