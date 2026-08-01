import React from 'react';
import {
  Heart,
  Crown,
  Palette,
  Shield,
  Clock,
  CheckCircle2,
  ExternalLink,
  Loader2,
  LogIn,
  Gift,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { UserState } from '../types.ts';
import { DONATION_AMOUNT_BRL } from '../types/donations.ts';
import { useDonationStatus } from '../hooks/useDonations.ts';
import { getDonorRewardPreviews } from '../data/rewardsCatalog.ts';

interface DonationsPageProps {
  user: UserState;
  onUpdateUser: (newUser: UserState) => void;
  onOpenAuth: () => void;
}

const COSMETIC_PREVIEWS = getDonorRewardPreviews();

export default function DonationsPage({ user, onUpdateUser, onOpenAuth }: DonationsPageProps) {
  const { data, loading, submitting, error, startDonation, refresh } = useDonationStatus(
    user.email,
    user.isLoggedIn
  );

  const isDonor = user.isDonor || data?.isDonor;
  const request = data?.request;
  const isPending = request?.status === 'pending' && !isDonor;
  const wasRejected = request?.status === 'rejected' && !isDonor;

  const handleDonate = async () => {
    if (!user.isLoggedIn) {
      onOpenAuth();
      return;
    }
    const result = await startDonation();
    if (result && user.isLoggedIn) {
      // refresh user if already approved elsewhere
      refresh();
    }
  };

  React.useEffect(() => {
    if (data?.isDonor && !user.isDonor) {
      onUpdateUser({ ...user, isDonor: true });
    }
  }, [data?.isDonor, onUpdateUser, user]);

  return (
    <div className="cine-container pt-20 pb-28 min-h-screen w-full">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-8"
      >
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-cine-accent/25 bg-gradient-to-br from-cine-accent/12 via-neutral-950 to-neutral-950 p-8 md:p-10 text-center">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-cine-accent/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
          <div className="relative space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cine-accent-light text-[11px] font-bold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 fill-cine-accent/40 text-cine-accent" />
              Apoiador VIP
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              Apoie o CineReact e ganhe benefícios exclusivos
            </h1>
            <p className="text-sm md:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Com uma contribuição única de{' '}
              <span className="text-white font-semibold">R$ {DONATION_AMOUNT_BRL.toFixed(2).replace('.', ',')}</span>,
              você ajuda a manter a plataforma e recebe cosméticos + selo Apoiador na sua conta.
            </p>
          </div>
        </section>

        {/* Status cards */}
        {!user.isLoggedIn && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-cine-accent/10 flex items-center justify-center text-cine-accent-light shrink-0">
              <LogIn className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Entre na sua conta para apoiar</p>
              <p className="text-xs text-zinc-500 mt-1">Precisamos vincular a doação ao seu perfil CineReact.</p>
            </div>
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-5 py-2.5 rounded-full bg-cine-accent text-black text-sm font-extrabold hover:bg-cine-accent-light transition-colors"
            >
              Fazer login
            </button>
          </div>
        )}

        {isDonor && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 flex items-start gap-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <p className="text-base font-bold text-white">Você já é Apoiador VIP</p>
              <p className="text-sm text-zinc-400 mt-1">
                Obrigado pelo apoio! Seu selo e cosméticos já estão ativos no perfil e nos comentários.
              </p>
            </div>
          </div>
        )}

        {isPending && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/15 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-white">Você está na fila de aprovação</p>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                  Recebemos seu pedido em{' '}
                  {new Date(request!.requestedAt).toLocaleString('pt-BR')}. Assim que a equipe CineReact
                  confirmar o pagamento no Mercado Pago, você receberá uma notificação e os cosméticos na conta.
                </p>
                <p className="text-xs text-amber-300/90 mt-3 font-medium">
                  Não fechou a página de pagamento?{' '}
                  <a
                    href={request!.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-1"
                  >
                    Pagar agora <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {wasRejected && (
          <div className="rounded-2xl border border-rose-500/25 bg-rose-950/15 p-5 text-sm text-zinc-300">
            <p className="font-bold text-white mb-1">Pagamento não confirmado</p>
            <p>
              {request?.adminNote ||
                'Não encontramos seu pagamento. Se você já pagou, tente novamente ou entre em contato com o suporte.'}
            </p>
            <button
              type="button"
              onClick={handleDonate}
              disabled={submitting}
              className="mt-4 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {error && (
          <p className="text-center text-sm text-rose-400 font-medium">{error}</p>
        )}

        {/* Benefits */}
        <section className="grid sm:grid-cols-2 gap-4">
          {[
            {
              icon: Crown,
              title: 'Selo Apoiador VIP',
              text: 'Tag exclusiva ao lado do seu nome em comentários e perfil.',
            },
            {
              icon: Palette,
              title: 'Cosméticos exclusivos',
              text: 'Tema, moldura, título e emblema liberados automaticamente após aprovação.',
            },
            {
              icon: Shield,
              title: 'Pagamento seguro',
              text: 'Checkout via Mercado Pago — pagamento único, sem assinatura.',
            },
            {
              icon: Heart,
              title: 'Apoio direto',
              text: 'Sua contribuição ajuda servidores, novos recursos e a comunidade.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-neutral-800/80 bg-neutral-900/35 p-5 flex gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-cine-accent/10 border border-cine-accent/20 flex items-center justify-center text-cine-accent-light shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{title}</h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Cosmetics preview */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <Gift className="w-4 h-4 text-cine-accent" />
            O que você recebe
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {COSMETIC_PREVIEWS.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/5 bg-black/30 px-4 py-3"
              >
                <p className="text-xs font-bold text-cine-accent-light">{item.name}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        {!isDonor && (
          <section className="rounded-3xl border border-cine-accent/30 bg-gradient-to-b from-cine-accent/10 to-neutral-950 p-8 text-center space-y-5">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">Pagamento único</p>
              <p className="text-4xl font-black text-white mt-1">
                R$ {DONATION_AMOUNT_BRL.toFixed(2).replace('.', ',')}
              </p>
            </div>

            <ol className="text-left max-w-md mx-auto space-y-2 text-xs text-zinc-400">
              <li className="flex gap-2">
                <span className="text-cine-accent font-bold">1.</span> Clique em apoiar e pague no Mercado Pago
              </li>
              <li className="flex gap-2">
                <span className="text-cine-accent font-bold">2.</span> Você entra na fila de espera automaticamente
              </li>
              <li className="flex gap-2">
                <span className="text-cine-accent font-bold">3.</span> Após aprovação da equipe, VIP + cosméticos na conta
              </li>
            </ol>

            <button
              type="button"
              onClick={handleDonate}
              disabled={submitting || loading || isPending}
              className="w-full max-w-sm mx-auto py-3.5 px-6 rounded-full bg-cine-accent text-black text-sm font-extrabold shadow-lg shadow-cine-accent/25 hover:bg-cine-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {submitting || loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : isPending ? (
                <>
                  <Clock className="w-4 h-4" />
                  Aguardando aprovação
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 fill-current" />
                  Apoiar por R$ {DONATION_AMOUNT_BRL.toFixed(2).replace('.', ',')}
                </>
              )}
            </button>

            <p className="text-[10px] text-zinc-600 max-w-sm mx-auto">
              Ao clicar, você será direcionado ao Mercado Pago. A ativação do VIP ocorre após confirmação manual da equipe.
            </p>
          </section>
        )}
      </motion.div>
    </div>
  );
}
