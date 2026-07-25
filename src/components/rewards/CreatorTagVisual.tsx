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
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/60 backdrop-blur-sm ${s.pad} ${className}`}
      title={name}
    >
      <span
        className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-white/90"
        style={{ background: `linear-gradient(135deg, ${from}cc, ${to}cc)` }}
      >
        <TierIcon className={s.icon} strokeWidth={2.5} />
        <span className={`font-bold uppercase tracking-wide ${s.tier}`}>{tierCfg.label}</span>
      </span>
      <span className={`font-medium text-zinc-300 truncate max-w-[5.5rem] ${s.name}`}>{displayName}</span>
    </span>
  );
}
