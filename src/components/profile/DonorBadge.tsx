import React, { memo } from 'react';
import { Heart } from 'lucide-react';

const SIZES = {
  sm: {
    wrap: 'gap-1 px-2 py-0.5 text-[9px] rounded-md',
    icon: 'w-2.5 h-2.5',
  },
  md: {
    wrap: 'gap-1.5 px-2.5 py-1 text-[10px] rounded-md',
    icon: 'w-3 h-3',
  },
} as const;

export interface DonorBadgeProps {
  size?: keyof typeof SIZES;
  className?: string;
}

function DonorBadge({ size = 'sm', className = '' }: DonorBadgeProps) {
  const s = SIZES[size];

  return (
    <span
      className={`inline-flex items-center ${s.wrap} shrink-0 border border-amber-400/40 bg-neutral-950/80 text-white font-black uppercase tracking-wider ${className}`}
      title="Apoiador VIP CineReact"
    >
      <Heart className={`${s.icon} fill-amber-300 text-amber-300`} strokeWidth={2} aria-hidden />
      Apoiador
    </span>
  );
}

export default memo(DonorBadge);
