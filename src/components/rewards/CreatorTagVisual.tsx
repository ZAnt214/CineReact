import React from 'react';
import { Heart, Users, Crown, Radio } from 'lucide-react';

type TagTier = 'fan' | 'squad' | 'vip' | 'community';

function getTagTier(id?: string, name?: string): TagTier {
  if (id?.includes('vip')) return 'vip';
  if (id?.includes('squad')) return 'squad';
  if (name?.toLowerCase().includes('comunidade')) return 'community';
  return 'fan';
}

const TIER_CONFIG: Record<TagTier, { label: string; Icon: React.ElementType }> = {
  fan: { label: 'Fã', Icon: Heart },
  squad: { label: 'Squad', Icon: Users },
  vip: { label: 'VIP', Icon: Crown },
  community: { label: 'Comunidade', Icon: Radio },
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
    sm: { pad: 'px-2 py-0.5', tier: 'text-[7px]', name: 'text-[8px]', icon: 'w-2.5 h-2.5' },
    md: { pad: 'px-2.5 py-1', tier: 'text-[8px]', name: 'text-[9px]', icon: 'w-3 h-3' },
    lg: { pad: 'px-3 py-1.5', tier: 'text-[9px]', name: 'text-[11px]', icon: 'w-3.5 h-3.5' },
  };
  const s = sizes[size];

  const from = creatorColors?.from || '#d97706';
  const to = creatorColors?.to || '#f59e0b';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-zinc-950/55 overflow-hidden ${s.pad} ${className}`}
      title={name}
      style={{ boxShadow: `inset 2px 0 0 0 ${from}` }}
    >
      <span
        className="inline-flex items-center justify-center rounded-md shrink-0"
        style={{ background: `linear-gradient(135deg, ${from}33, ${to}22)` }}
      >
        <TierIcon className={`${s.icon} m-0.5`} style={{ color: from }} strokeWidth={2.25} />
      </span>
      <span className="flex flex-col leading-none min-w-0">
        <span className={`font-bold uppercase tracking-[0.1em] text-zinc-500 ${s.tier}`}>{tierCfg.label}</span>
        <span className={`font-medium text-zinc-200 truncate max-w-[5rem] ${s.name}`}>{displayName}</span>
      </span>
    </span>
  );
}
