import React from 'react';
import { BadgeCheck } from 'lucide-react';

export interface ProfileVerifiedSealProps {
  name?: string;
  description?: string;
  size?: 'sm' | 'md';
  align?: 'center' | 'start';
  className?: string;
}

export default function ProfileVerifiedSeal({
  name = 'Perfil Verificado Oficial',
  description = 'Este é um perfil verificado oficial do criador na plataforma CineReact.',
  size = 'md',
  align = 'center',
  className = '',
}: ProfileVerifiedSealProps) {
  const isMd = size === 'md';
  const isCenter = align === 'center';

  return (
    <div
      className={`flex flex-col gap-1.5 w-full ${isCenter ? 'items-center text-center' : 'items-start text-left'} ${className}`}
      title={description}
    >
      <span
        className={`verified-creator-seal inline-flex items-center gap-1.5 rounded-full border border-cine-accent/55 bg-gradient-to-r from-cine-accent/20 via-cine-accent/10 to-cine-accent/20 text-cine-accent-light ${
          isMd ? 'px-3.5 py-1.5' : 'px-2.5 py-1'
        }`}
      >
        <span className="verified-creator-seal-icon inline-flex items-center justify-center rounded-full bg-cine-accent/20 border border-cine-accent/40 p-0.5">
          <BadgeCheck
            className={isMd ? 'w-3.5 h-3.5 text-cine-accent shrink-0' : 'w-3 h-3 text-cine-accent shrink-0'}
            strokeWidth={2.5}
          />
        </span>
        <span className={`font-black uppercase tracking-[0.14em] whitespace-nowrap ${isMd ? 'text-[10px]' : 'text-[8px]'}`}>
          {name}
        </span>
      </span>
      {description && (
        <p className={`profile-text-muted leading-snug max-w-[280px] ${isMd ? 'text-[10px]' : 'text-[9px]'}`}>
          {description}
        </p>
      )}
    </div>
  );
}
