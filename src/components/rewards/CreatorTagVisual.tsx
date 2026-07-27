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
    sm: { pad: 'px-2 py-0.5', tier: 'text-[7px]', name: 'text-[8px]', icon: 'w-2.5 h-2.5', iconBox: 'w-4 h-4' },
    md: { pad: 'px-2.5 py-1', tier: 'text-[8px]', name: 'text-[9px]', icon: 'w-3 h-3', iconBox: 'w-5 h-5' },
    lg: { pad: 'px-3 py-1.5', tier: 'text-[9px]', name: 'text-[11px]', icon: 'w-3.5 h-3.5', iconBox: 'w-6 h-6' },
  };
  const s = sizes[size];

  const from = creatorColors?.from || '#38bdf8';
  const to = creatorColors?.to || '#7dd3fc';
  const accentText = creatorColors?.text || '#f5ebff';

  return (
    <span
      className={`creator-tag-visual inline-flex items-center gap-1.5 rounded-lg border overflow-hidden ${s.pad} ${className}`}
      title={name}
      style={{
        borderColor: `${from}55`,
        background: `linear-gradient(135deg, ${from}18 0%, rgba(9, 9, 11, 0.92) 55%, ${to}12 100%)`,
        boxShadow: `inset 0 1px 0 ${from}30, 0 4px 14px rgba(0, 0, 0, 0.35), 0 0 18px ${from}18`,
      }}
    >
      <span
        className={`inline-flex items-center justify-center rounded-md shrink-0 ${s.iconBox}`}
        style={{
          background: `linear-gradient(145deg, ${from}55, ${to}35)`,
          boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 12px ${from}40`,
        }}
      >
        <TierIcon className={s.icon} style={{ color: accentText }} strokeWidth={2.35} />
      </span>
      <span className="flex flex-col leading-none min-w-0">
        <span
          className={`font-black uppercase tracking-[0.14em] ${s.tier}`}
          style={{ color: `${from}cc` }}
        >
          {tierCfg.label}
        </span>
        <span
          className={`font-semibold truncate max-w-[5.5rem] ${s.name}`}
          style={{ color: accentText }}
        >
          {displayName}
        </span>
      </span>
    </span>
  );
}
