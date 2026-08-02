import React from 'react';
import {
  BadgeCheck,
  Clock,
  Crown,
  Globe,
  Loader2,
  LogIn,
  Lock,
  Sparkles,
} from 'lucide-react';
import type { UserState } from '../types.ts';
import {
  EXCLUSIVE_SUBSCRIPTION_PRICE,
  GLOBAL_SUBSCRIPTION_PRICE,
} from '../finance/constants.ts';
import { useSubscriptions } from '../hooks/useSubscriptions.ts';
import { DEMO_CREATOR_EMAIL } from '../constants/demoCreator.ts';

interface SubscriptionsPageProps {
  user: UserState;
  creatorEmail?: string;
  onOpenAuth: () => void;
}

export default function SubscriptionsPage({
  user,
  creatorEmail,
  onOpenAuth,
}: SubscriptionsPageProps) {
  const targetCreator = creatorEmail || DEMO_CREATOR_EMAIL;
  const { data, loading, submitting, error, startCheckout, confirmPaid, cancelSub } =
    useSubscriptions(user.email, user.isLoggedIn);

  const pendingCheckout = data?.checkouts?.find((c) => c.status === 'pending');
  const hasGlobal = data?.global;
  const hasExclusive =
    targetCreator && data?.exclusiveCreators?.includes(targetCreator.toLowerCase());

  const handleExclusive = async () => {
    if (!user.isLoggedIn) return onOpenAuth();
    await startCheckout('exclusive', targetCreator);
  };

  const handleGlobal = async () => {
    if (!user.isLoggedIn) return onOpenAuth();
    await startCheckout('global');
  };

  return (
    <div className="min-h-screen w-full bg-[#07090f]">
      <div className="cine-container pt-20 pb-28">
        <div className="max-w-4xl mx-auto space-y-8">
          <section className="text-center space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-neutral-900/80 text-cyan-100 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Assinaturas CineReact
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Apoie criadores e{' '}
              <span className="bg-gradient-to-r from-amber-200 to-cyan-300 bg-clip-text text-transparent">
                desbloqueie conteúdo exclusivo
              </span>
            </h1>
          </section>

          {!user.isLoggedIn && (
            <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-5 flex flex-col sm:flex-row items-center gap-4">
              <LogIn className="w-8 h-8 text-cyan-300" />
              <div className="flex-1 text-center sm:text-left">
                <p className="font-bold text-white">Entre para assinar</p>
                <p className="text-xs text-zinc-500 mt-1">Vinculamos a assinatura ao seu perfil.</p>
              </div>
              <button type="button" onClick={onOpenAuth} className="px-5 py-2.5 rounded-full bg-cyan-400 text-black text-sm font-extrabold">
                Fazer login
              </button>
            </div>
          )}

          {pendingCheckout && (
            <div className="rounded-2xl border border-amber-400/25 bg-neutral-900/60 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Pagamento em análise</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Assim que o Mercado Pago confirmar, sua assinatura ativa em até 24h.
                  </p>
                  <p className="text-xs text-zinc-500 mt-2 font-mono">Ref: {pendingCheckout.externalReference}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => confirmPaid(pendingCheckout.id)}
                className="text-sm font-bold text-cyan-300 hover:text-cyan-200"
              >
                Já paguei — verificar status
              </button>
            </div>
          )}

          {error && <p className="text-center text-sm text-rose-400">{error}</p>}

          <div className="grid md:grid-cols-2 gap-5">
            <div className={`rounded-3xl border p-6 sm:p-8 space-y-5 ${hasExclusive ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-amber-500/20 bg-neutral-900/40'}`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 flex items-center justify-center">
                  <BadgeCheck className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Exclusiva</p>
                  <p className="text-xs text-zinc-500">Um criador</p>
                </div>
              </div>
              <p className="text-4xl font-black text-white">
                R$ {EXCLUSIVE_SUBSCRIPTION_PRICE.toFixed(2).replace('.', ',')}
                <span className="text-sm font-medium text-zinc-500">/mês</span>
              </p>
              <ul className="text-sm text-zinc-400 space-y-2">
                <li className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-amber-400" /> Vídeos exclusivos do criador</li>
                <li className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-amber-400" /> Acesso antecipado temporário</li>
              </ul>
              {hasExclusive ? (
                <p className="text-sm text-emerald-300 font-bold">Assinatura ativa</p>
              ) : (
                <button
                  type="button"
                  onClick={handleExclusive}
                  disabled={submitting || loading}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-extrabold text-sm disabled:opacity-50"
                >
                  {submitting ? 'Abrindo pagamento...' : 'Assinar exclusiva'}
                </button>
              )}
            </div>

            <div className={`rounded-3xl border p-6 sm:p-8 space-y-5 ${hasGlobal ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-cyan-500/20 bg-neutral-900/40'}`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Global</p>
                  <p className="text-xs text-zinc-500">Todos os criadores</p>
                </div>
              </div>
              <p className="text-4xl font-black text-white">
                R$ {GLOBAL_SUBSCRIPTION_PRICE.toFixed(2).replace('.', ',')}
                <span className="text-sm font-medium text-zinc-500">/mês</span>
              </p>
              <ul className="text-sm text-zinc-400 space-y-2">
                <li className="flex items-center gap-2"><Crown className="w-3.5 h-3.5 text-cyan-400" /> Conteúdo exclusivo de todos</li>
                <li className="flex items-center gap-2"><Crown className="w-3.5 h-3.5 text-cyan-400" /> Ranking CineReact</li>
              </ul>
              {hasGlobal ? (
                <p className="text-sm text-emerald-300 font-bold">Assinatura ativa</p>
              ) : (
                <button
                  type="button"
                  onClick={handleGlobal}
                  disabled={submitting || loading}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-extrabold text-sm disabled:opacity-50"
                >
                  {submitting ? 'Abrindo pagamento...' : 'Assinar global'}
                </button>
              )}
            </div>
          </div>

          {data?.subscriptions && data.subscriptions.length > 0 && (
            <section className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Minhas assinaturas</h2>
              {data.subscriptions.map((sub) => (
                <div key={sub.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-neutral-900/50">
                  <div>
                    <p className="font-bold text-white capitalize">{sub.plan === 'global' ? 'Global' : 'Exclusiva'}</p>
                    <p className="text-xs text-zinc-500">
                      Até {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('pt-BR') : '—'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cancelSub(sub.id)}
                    className="text-xs font-bold text-zinc-500 hover:text-rose-400"
                  >
                    Cancelar
                  </button>
                </div>
              ))}
            </section>
          )}

          <p className="text-center text-[10px] text-zinc-600 max-w-md mx-auto">
            Pagamento via Mercado Pago. Valores brutos — taxas do gateway não incluídas no repasse ao criador.
          </p>
        </div>
      </div>
    </div>
  );
}
