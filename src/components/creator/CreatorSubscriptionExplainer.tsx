import React from 'react';
import { BadgeCheck, Globe, Heart, MessageCircle, Wallet } from 'lucide-react';
import {
  EXCLUSIVE_CREATOR_SHARE,
  EXCLUSIVE_PLATFORM_SHARE,
  EXCLUSIVE_SUBSCRIPTION_PRICE,
  GLOBAL_CREATOR_POOL_PERCENT,
  GLOBAL_CREATOR_POOL_SHARE,
  GLOBAL_PLATFORM_SHARE,
  GLOBAL_SUBSCRIPTION_PRICE,
  RANKING_POINTS_COMMENT,
  RANKING_POINTS_LIKE,
} from '../../finance/constants.ts';

export interface CreatorSubscriptionExplainerProps {
  /** Estilo do perfil premium (demo) ou páginas gerais do programa de criadores. */
  variant?: 'premium' | 'default';
  className?: string;
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CreatorSubscriptionExplainer({
  variant = 'default',
  className = '',
}: CreatorSubscriptionExplainerProps) {
  const isPremium = variant === 'premium';

  const shell = isPremium
    ? 'creator-premium-card p-5 sm:p-6'
    : 'rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 sm:p-6';

  const label = isPremium
    ? 'text-[11px] uppercase tracking-[0.28em] font-semibold creator-premium-label'
    : 'text-[10px] font-bold uppercase tracking-wider text-cyan-300/80';

  const title = isPremium
    ? 'font-display text-lg sm:text-xl font-bold text-[var(--premium-cream)]'
    : 'text-sm sm:text-base font-black text-white uppercase tracking-wide';

  const body = isPremium ? 'text-sm text-[var(--premium-muted)]' : 'text-xs sm:text-sm text-zinc-400';

  const planCard = (accent: 'amber' | 'cyan') =>
    isPremium
      ? 'rounded-xl border border-white/8 bg-black/20 p-4'
      : `rounded-xl border p-4 ${
          accent === 'amber'
            ? 'border-amber-500/20 bg-neutral-950/60'
            : 'border-cyan-500/20 bg-neutral-950/60'
        }`;

  const planTitle = (accent: 'amber' | 'cyan') =>
    `text-sm font-bold ${accent === 'amber' ? 'text-amber-200' : 'text-cyan-200'}`;

  const price = 'text-2xl font-black text-white';

  const splitRow = 'flex items-center justify-between gap-3 text-xs';

  return (
    <section className={`${shell} ${className}`.trim()}>
      <div className="flex items-start gap-3 mb-5">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isPremium
              ? 'bg-amber-400/10 border border-amber-400/20'
              : 'bg-cine-accent/10 border border-cine-accent/20'
          }`}
        >
          <Wallet className={`w-5 h-5 ${isPremium ? 'text-amber-300' : 'text-cine-accent-light'}`} />
        </span>
        <div>
          <p className={label}>Monetização</p>
          <h2 className={`${title} mt-1`}>Como funcionam as assinaturas e repasses</h2>
          <p className={`${body} mt-2 leading-relaxed max-w-2xl`}>
            Criadores verificados podem receber apoio mensal dos fãs. Os valores abaixo são automáticos —
            sem negociação manual — e entram no painel financeiro da plataforma.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className={planCard('amber')}>
          <div className="flex items-center gap-2 mb-3">
            <BadgeCheck className="w-4 h-4 text-amber-300" />
            <p className={planTitle('amber')}>Assinatura Exclusiva</p>
          </div>
          <p className={price}>
            {formatBRL(EXCLUSIVE_SUBSCRIPTION_PRICE)}
            <span className="text-sm font-medium text-zinc-500">/mês</span>
          </p>
          <p className={`${body} mt-2 leading-relaxed`}>
            O fã assina um criador específico e desbloqueia vídeos exclusivos dele no CineClips.
          </p>
          <div className={`mt-4 space-y-2 pt-4 border-t ${isPremium ? 'border-white/8' : 'border-neutral-800'}`}>
            <div className={splitRow}>
              <span className="text-zinc-500">Você recebe</span>
              <span className="font-bold text-amber-200">{formatBRL(EXCLUSIVE_CREATOR_SHARE)}</span>
            </div>
            <div className={splitRow}>
              <span className="text-zinc-500">CineReact</span>
              <span className="font-medium text-zinc-300">{formatBRL(EXCLUSIVE_PLATFORM_SHARE)}</span>
            </div>
          </div>
        </div>

        <div className={planCard('cyan')}>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-cyan-300" />
            <p className={planTitle('cyan')}>Assinatura Global</p>
          </div>
          <p className={price}>
            {formatBRL(GLOBAL_SUBSCRIPTION_PRICE)}
            <span className="text-sm font-medium text-zinc-500">/mês</span>
          </p>
          <p className={`${body} mt-2 leading-relaxed`}>
            O fã acessa conteúdo exclusivo de todos os criadores participantes e entra no ranking da
            plataforma.
          </p>
          <div className={`mt-4 space-y-2 pt-4 border-t ${isPremium ? 'border-white/8' : 'border-neutral-800'}`}>
            <div className={splitRow}>
              <span className="text-zinc-500">Pool dos criadores ({GLOBAL_CREATOR_POOL_PERCENT}%)</span>
              <span className="font-bold text-cyan-200">{formatBRL(GLOBAL_CREATOR_POOL_SHARE)}</span>
            </div>
            <div className={splitRow}>
              <span className="text-zinc-500">CineReact</span>
              <span className="font-medium text-zinc-300">{formatBRL(GLOBAL_PLATFORM_SHARE)}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`mt-5 rounded-xl p-4 ${
          isPremium ? 'bg-black/25 border border-white/8' : 'bg-neutral-950/80 border border-neutral-800/80'
        }`}
      >
        <p className={`${isPremium ? 'text-sm font-bold text-[var(--premium-cream)]' : 'text-sm font-bold text-white'}`}>
          Ranking CineReact — repasse do pool global
        </p>
        <p className={`${body} mt-2 leading-relaxed`}>
          No fim de cada mês, o pool global é dividido entre criadores verificados com base no engajamento
          de assinantes globais ativos nos seus clips:
        </p>
        <ul className={`mt-3 space-y-2 ${body}`}>
          <li className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-rose-300 shrink-0" />
            Curtida válida = <strong className="text-white">{RANKING_POINTS_LIKE} ponto</strong>
          </li>
          <li className="flex items-center gap-2">
            <MessageCircle className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            Comentário válido = <strong className="text-white">{RANKING_POINTS_COMMENT} pontos</strong>
          </li>
        </ul>
        <p className={`${body} mt-3 leading-relaxed`}>
          Quanto maior sua participação no ranking, maior sua fatia do pool. Há limites anti-fraude por
          usuário e por clip. Os repasses são calculados automaticamente e pagos após o fechamento mensal.
        </p>
      </div>
    </section>
  );
}
