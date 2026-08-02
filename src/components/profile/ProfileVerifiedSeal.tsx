import React from 'react';
import { BadgeCheck } from 'lucide-react';

export interface ProfileVerifiedSealProps {
  name?: string;
  description?: string;
  size?: 'sm' | 'md';
  align?: 'center' | 'start';
  layout?: 'default' | 'beside';
  className?: string;
}

export default function ProfileVerifiedSeal({
  name = 'Criador verificado',
  description = 'Perfil oficial de criador na CineReact.',
  size = 'md',
  align = 'center',
  layout = 'default',
  className = '',
}: ProfileVerifiedSealProps) {
  const isMd = size === 'md';
  const isCenter = align === 'center';
  const isBeside = layout === 'beside';

  return (
    <div
      className={`flex flex-col gap-1 ${isBeside ? 'w-auto shrink-0' : 'w-full'} ${
        isCenter ? 'items-center text-center' : 'items-start text-left'
      } ${className}`}
      title={description}
    >
      <span
        className={`verified-creator-seal inline-flex items-center gap-1.5 rounded-full border border-cine-accent/25 bg-cine-surface/90 text-cine-accent-light ${
          isBeside ? 'flex-col px-2 py-2 text-center' : ''
        } ${isMd ? (isBeside ? '' : 'px-3 py-1') : 'px-2.5 py-0.5'}`}
      >
        <span className="verified-creator-seal-icon inline-flex items-center justify-center rounded-full bg-cine-accent/10 border border-cine-accent/30 p-0.5">
          <BadgeCheck
            className={isMd ? 'w-3.5 h-3.5 text-cine-accent-light shrink-0' : 'w-3 h-3 text-cine-accent-light shrink-0'}
            strokeWidth={2.5}
          />
        </span>
        <span
          className={`font-semibold uppercase tracking-[0.14em] ${
            isBeside ? 'text-[7px] leading-tight max-w-[3.25rem]' : 'whitespace-nowrap'
          } ${isMd ? 'text-[9px]' : 'text-[8px]'}`}
        >
          {name}
        </span>
      </span>
      {description && isMd && !isBeside && (
        <p className="text-[10px] text-zinc-500 leading-snug max-w-[300px]">
          {description}
        </p>
      )}
    </div>
  );
}
