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
import TitleRewardVisual from './rewards/TitleRewardVisual.tsx';
import type { RewardItemDefinition } from '../types/gamification.ts';

interface DonationsPageProps {
  user: UserState;
  onUpdateUser: (newUser: UserState) => void;
  onOpenAuth: () => void;
}

const DEMO_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=70';

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
      <div className={`${base} bg-gradient-to-br from-cyan-950 via-neutral-900 to-amber-950`}>
        <Palette className="w-6 h-6 text-cyan-300/90" strokeWidth={1.75} />
      </div>
    );
  }
  if (item.category === 'frame') {
    return (
      <div className="w-14 h-14 shrink-0 flex items-center justify-center">
        <div className="rounded-full p-[3px] bg-gradient-to-br from-amber-400 via-cyan-400 to-violet-400">
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
    <div className={`${base} bg-gradient-to-br from-amber-500/20 to-cyan-500/15`}>
      <Heart className="w-6 h-6 text-amber-300 fill-amber-300/40" strokeWidth={1.75} />
    </div>
  );
}

const DonorProfileDemo = memo(function DonorProfileDemo({ displayName }: { displayName: string }) {
  return (
    <div className="donor-demo-card relative overflow-hidden rounded-[1.75rem] border border-cyan-400/25 bg-gradient-to-br from-cyan-950/80 via-[#0a0f18] to-amber-950/60 p-6 sm:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.1),transparent_60%)] pointer-events-none" />

      <div className="relative flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-cyan-200/90 mb-5">
          <Star className="w-3 h-3 text-amber-300" />
          Prévia do seu perfil
        </span>

        <div className="rounded-full p-[4px] bg-gradient-to-br from-amber-400 via-cyan-400 to-violet-400 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500/25 to-cyan-500/20 border border-amber-400/35 text-[9px] font-black uppercase tracking-wider text-amber-100">
            <Heart className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
            Apoiador
          </span>
        </div>

        {TITLE_ITEM && (
          <div className="mt-3">
            <TitleRewardVisual
              name={TITLE_ITEM.name}
              rarity={TITLE_ITEM.rarity}
              item={TITLE_ITEM}
              size="lg"
            />
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/25 to-cyan-500/15 border border-amber-400/30 flex items-center justify-center">
            <Heart className="w-4 h-4 text-amber-300 fill-amber-300/50" />
          </div>
          <span className="text-[11px] text-zinc-400">Emblema exclusivo no perfil</span>
        </div>

        {FRAME_ITEM && (
          <p className="mt-4 text-[10px] text-cyan-200/50 max-w-xs leading-relaxed">
            Moldura {FRAME_ITEM.name.toLowerCase()} + tema premium aplicados automaticamente
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
    <div
      className={`donor-cosmetic-card rounded-2xl border ${rarity.border} ${rarity.bg} p-4 transition-transform duration-200 hover:-translate-y-0.5`}
    >
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
    <div className="donor-page relative min-h-screen w-full bg-[#07090f]">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(124,58,237,0.12), transparent), radial-gradient(ellipse 60% 40% at 90% 20%, rgba(34,211,238,0.1), transparent), radial-gradient(ellipse 70% 50% at 10% 100%, rgba(245,158,11,0.08), transparent)',
        }}
      />

      <div className="cine-container relative pt-20 pb-28">
        <div className="max-w-3xl mx-auto space-y-8 donor-page-content">
          <section className="relative text-center space-y-5">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/15 via-violet-500/10 to-amber-500/15 border border-white/10 text-cyan-100 text-[11px] font-bold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              Apoiador VIP
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-[2.6rem] font-black text-white tracking-tight leading-[1.1]">
              Apoie o CineReact e{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-amber-200 to-violet-300 bg-clip-text text-transparent">
                brilhe na comunidade
              </span>
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
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
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300 text-black text-sm font-extrabold hover:brightness-110 transition-[filter]"
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
            <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-r from-amber-950/30 to-cyan-950/20 p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-400/15 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-white">Apoio registrado!</p>
                  <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
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
            <div className="rounded-2xl border border-rose-500/25 bg-rose-950/15 p-5 text-sm text-zinc-300">
              <p className="font-bold text-white mb-1">Não encontramos seu pagamento</p>
              <p className="text-zinc-400">
                {request?.adminNote || 'Se você já pagou, tente novamente ou fale com o suporte.'}
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

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-300" />
                Veja como ficará
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300/60">
                Demonstração
              </span>
            </div>
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
            <section className="relative overflow-hidden rounded-3xl border border-cyan-400/20 p-8 text-center space-y-5 bg-gradient-to-b from-cyan-500/8 via-transparent to-amber-500/8">
              <div className="relative space-y-5">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">
                    Pagamento único · Mercado Pago
                  </p>
                  <p className="text-4xl sm:text-5xl font-black mt-1 bg-gradient-to-r from-white via-cyan-100 to-amber-100 bg-clip-text text-transparent">
                    R$ {DONATION_AMOUNT_BRL.toFixed(2).replace('.', ',')}
                  </p>
                </div>

                <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Após o pagamento, seus benefícios chegam na conta em até{' '}
                  <span className="text-white font-medium">24 horas</span>.
                </p>

                <button
                  type="button"
                  onClick={handleDonate}
                  disabled={submitting || loading || isPending}
                  className="w-full max-w-sm mx-auto py-3.5 px-6 rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-amber-300 text-black text-sm font-extrabold shadow-lg shadow-cyan-500/15 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-[filter] flex items-center justify-center gap-2"
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
              </div>
            </section>
          )}
        </div>
      </div>

      <style>{`
        .donor-page-content {
          content-visibility: auto;
          contain-intrinsic-size: auto 1200px;
        }
        .donor-demo-card,
        .donor-cosmetic-card {
          contain: layout style paint;
        }
        @media (prefers-reduced-motion: no-preference) {
          .donor-page-content {
            animation: donor-fade-in 0.35s ease-out;
          }
        }
        @keyframes donor-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
