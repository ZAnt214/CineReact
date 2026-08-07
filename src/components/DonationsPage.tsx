import React, { useMemo, memo } from 'react';
import {
  Heart,
  Crown,
  Clock,
  CheckCircle2,
  ExternalLink,
  Loader2,
  LogIn,
  Star,
  Award,
  Palette,
} from 'lucide-react';
import type { UserState } from '../types.ts';
import { DONATION_AMOUNT_BRL } from '../types/donations.ts';
import { useDonationStatus } from '../hooks/useDonations.ts';
import { CATEGORY_LABELS, DONOR_VIP_ITEMS, RARITY_STYLES } from '../data/rewardsCatalog.ts';
import DonorBadge from './profile/DonorBadge.tsx';
import type { RewardItemDefinition } from '../types/gamification.ts';

interface DonationsPageProps {
  user: UserState;
  onUpdateUser: (newUser: UserState) => void;
  onOpenAuth: () => void;
}

const DEMO_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=96&q=60';

const DEMO_ITEMS: (RewardItemDefinition & { owned: true })[] = DONOR_VIP_ITEMS.map((item) => ({
  ...item,
  owned: true as const,
}));

const TITLE_ITEM = DEMO_ITEMS.find((i) => i.id === 'title-apoiador-cinereact');
const FRAME_ITEM = DEMO_ITEMS.find((i) => i.id === 'frame-apoiador-cinereact');

function CosmeticThumb({ item }: { item: (typeof DEMO_ITEMS)[number] }) {
  const base = 'w-14 h-14 rounded-xl shrink-0 flex items-center justify-center border border-white/10';

  if (item.category === 'theme') {
    return (
      <div className={`${base} bg-gradient-to-br from-cyan-950 to-neutral-900`}>
        <Palette className="w-6 h-6 text-cyan-300/90" strokeWidth={1.75} />
      </div>
    );
  }
  if (item.category === 'frame') {
    return (
      <div className="w-14 h-14 shrink-0 flex items-center justify-center">
        <div className="rounded-full p-[3px] border border-amber-400/50">
          <div className="w-10 h-10 rounded-full bg-neutral-800" />
        </div>
      </div>
    );
  }
  if (item.category === 'title') {
    return (
      <div className={`${base} bg-neutral-950/80`}>
        <Award className="w-6 h-6 text-amber-200/90" strokeWidth={1.75} />
      </div>
    );
  }
  return (
    <div className={`${base} bg-neutral-900`}>
      <Heart className="w-6 h-6 text-amber-300 fill-amber-300/40" strokeWidth={1.75} />
    </div>
  );
}

const DonorProfileDemo = memo(function DonorProfileDemo({ displayName }: { displayName: string }) {
  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-neutral-950/90 p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-cyan-200/80 mb-5">
          <Star className="w-3 h-3 text-amber-300" />
          Prévia do seu perfil
        </span>

        <div className="rounded-full p-[3px] border border-amber-400/45">
          <img
            src={DEMO_AVATAR}
            alt=""
            width={80}
            height={80}
            loading="lazy"
            decoding="async"
            className="w-20 h-20 rounded-full object-cover bg-neutral-800"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <p className="text-xl sm:text-2xl font-black text-white tracking-tight">{displayName}</p>
          <DonorBadge size="md" />
        </div>

        {TITLE_ITEM && (
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-100/90">
            {TITLE_ITEM.name}
          </p>
        )}

        <p className="mt-4 text-[11px] text-zinc-500">Emblema exclusivo + tema e moldura no perfil</p>

        {FRAME_ITEM && (
          <p className="mt-2 text-[10px] text-zinc-600 max-w-xs leading-relaxed">
            Inclui {FRAME_ITEM.name.toLowerCase()} e pacote visual completo
          </p>
        )}
      </div>
    </div>
  );
});

const CosmeticShowcaseCard = memo(function CosmeticShowcaseCard({
  item,
}: {
  item: (typeof DEMO_ITEMS)[number];
}) {
  const rarity = RARITY_STYLES[item.rarity];

  return (
    <div className={`rounded-2xl border ${rarity.border} ${rarity.bg} p-4`}>
      <div className="flex items-start gap-3">
        <CosmeticThumb item={item} />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300/70">
            {CATEGORY_LABELS[item.category]}
          </p>
          <p className="text-sm font-bold text-white mt-0.5 truncate">{item.name}</p>
          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed line-clamp-2">{item.description}</p>
        </div>
      </div>
    </div>
  );
});

export default function DonationsPage({ user, onUpdateUser, onOpenAuth }: DonationsPageProps) {
  const { data, loading, submitting, error, startDonation, refresh } = useDonationStatus(
    user.email,
    user.isLoggedIn
  );

  const isDonor = user.isDonor || data?.isDonor;
  const request = data?.request;
  const isPending = request?.status === 'pending' && !isDonor;
  const wasRejected = request?.status === 'rejected' && !isDonor;

  const displayName = useMemo(
    () => (user.isLoggedIn && user.nome ? user.nome.split(' ')[0] : 'Seu Perfil'),
    [user.isLoggedIn, user.nome]
  );

  const handleDonate = async () => {
    if (!user.isLoggedIn) {
      onOpenAuth();
      return;
    }
    const result = await startDonation();
    if (result && user.isLoggedIn) {
      refresh();
    }
  };

  React.useEffect(() => {
    if (data?.isDonor && !user.isDonor) {
      onUpdateUser({ ...user, isDonor: true });
    }
  }, [data?.isDonor, onUpdateUser, user]);

  return (
    <div className="min-h-screen w-full bg-[#07090f]">
      <div className="cine-container pt-20 pb-28">
        <div className="max-w-3xl mx-auto space-y-8">
          <section className="text-center space-y-5">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-neutral-900/80 text-cyan-100 text-[11px] font-bold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              Apoiador VIP
            </span>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Apoie o CineReact e{' '}
              <span className="text-cyan-300">brilhe na comunidade</span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-lg mx-auto leading-relaxed">
              Contribuição única de{' '}
              <span className="text-white font-semibold">
                R$ {DONATION_AMOUNT_BRL.toFixed(2).replace('.', ',')}
              </span>
              . Você recebe cosméticos exclusivos e o selo Apoiador na sua conta.
            </p>
          </section>

          {!user.isLoggedIn && (
            <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-300 shrink-0">
                <LogIn className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Entre para apoiar</p>
                <p className="text-xs text-zinc-500 mt-1">Vinculamos os benefícios ao seu perfil CineReact.</p>
              </div>
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-5 py-2.5 rounded-full bg-cyan-400 text-black text-sm font-extrabold"
              >
                Fazer login
              </button>
            </div>
          )}

          {isDonor && (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-950/25 p-5 flex items-start gap-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <p className="text-base font-bold text-white">Você já é Apoiador VIP</p>
                <p className="text-sm text-zinc-400 mt-1">
                  Obrigado pelo apoio! Seu selo e cosméticos já estão no perfil.
                </p>
              </div>
            </div>
          )}

          {isPending && (
            <div className="rounded-2xl border border-amber-400/25 bg-neutral-900/60 p-5">
              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-white">Apoio registrado!</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Você receberá os benefícios na sua conta em até{' '}
                    <span className="text-amber-200 font-semibold">24 horas</span>.
                  </p>
                  <p className="text-xs text-zinc-500 mt-3">
                    Não concluiu o pagamento?{' '}
                    <a
                      href={request!.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 underline inline-flex items-center gap-1"
                    >
                      Abrir Mercado Pago <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {wasRejected && (
            <div className="rounded-2xl border border-rose-500/25 bg-rose-950/15 p-5 text-sm">
              <p className="font-bold text-white mb-1">Não encontramos seu pagamento</p>
              <p className="text-zinc-400">
                {request?.adminNote || 'Se você já pagou, tente novamente ou fale com o suporte.'}
              </p>
              <button
                type="button"
                onClick={handleDonate}
                disabled={submitting}
                className="mt-4 px-4 py-2 rounded-full bg-white/10 text-xs font-bold"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {error && <p className="text-center text-sm text-rose-400 font-medium">{error}</p>}

          <section className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-300" />
              Veja como ficará
            </h2>
            <DonorProfileDemo displayName={displayName} />
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
              Tudo que você ganha
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {DEMO_ITEMS.map((item) => (
                <CosmeticShowcaseCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          {!isDonor && (
            <section className="rounded-3xl border border-cyan-400/20 bg-neutral-900/40 p-8 text-center space-y-5">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">
                  Pagamento único · Mercado Pago
                </p>
                <p className="text-4xl sm:text-5xl font-black mt-1 text-white">
                  R$ {DONATION_AMOUNT_BRL.toFixed(2).replace('.', ',')}
                </p>
              </div>

              <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                Após o pagamento, seus benefícios chegam na conta em até{' '}
                <span className="text-white font-medium">24 horas</span>.
              </p>

              <button
                type="button"
                onClick={handleDonate}
                disabled={submitting || loading || isPending}
                className="w-full max-w-sm mx-auto py-3.5 px-6 rounded-full bg-cyan-400 text-black text-sm font-extrabold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting || loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : isPending ? (
                  <>
                    <Clock className="w-4 h-4" />
                    Benefícios a caminho
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-current" />
                    Apoiar por R$ {DONATION_AMOUNT_BRL.toFixed(2).replace('.', ',')}
                  </>
                )}
              </button>

              <p className="text-[10px] text-zinc-600 max-w-xs mx-auto">
                Você será redirecionado ao Mercado Pago para concluir o pagamento com segurança.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
