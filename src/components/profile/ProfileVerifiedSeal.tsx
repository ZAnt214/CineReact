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
        className={`inline-flex items-center gap-1.5 rounded-full border border-cine-accent/45 bg-cine-accent/10 text-cine-brand shadow-[0_0_20px_rgba(255,184,0,0.18)] ${
          isMd ? 'px-3 py-1.5' : 'px-2 py-1'
        }`}
      >
        <BadgeCheck className={isMd ? 'w-3.5 h-3.5 text-cine-accent shrink-0' : 'w-3 h-3 text-cine-accent shrink-0'} strokeWidth={2.25} />
        <span className={`font-bold uppercase tracking-[0.12em] whitespace-nowrap ${isMd ? 'text-[10px]' : 'text-[8px]'}`}>
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
