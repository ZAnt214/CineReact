import React, { memo, useCallback, useMemo } from 'react';
import {
  Film, Play, User, LogOut, Settings, Bookmark, ShieldAlert,
  ChevronRight, UtensilsCrossed, Trophy, Youtube, Star, Flame, Zap, Palette,
  BadgeCheck, Crown, ArrowRight, Check,
} from 'lucide-react';
import GamificationBar from '../GamificationBar.tsx';
import ProfileAvatar from './ProfileAvatar.tsx';
import ProfileThemeScope from './ProfileThemeScope.tsx';
import ProfileNameRow from './ProfileNameRow.tsx';
import ProfileBioEditor from './ProfileBioEditor.tsx';
import ProfileGreetingHeader from './ProfileGreetingHeader.tsx';
import DonorBadge from './DonorBadge.tsx';
import ProfileSocialLinks from './ProfileSocialLinks.tsx';
import { RewardPreviewThumb } from '../rewards/RewardPreview.tsx';
import { VERIFIED_PROFILE_BADGE_ID, getRewardById } from '../../data/rewardsCatalog.ts';
import { applyDonorLoadout } from '../../gamification/profileDisplay.ts';
import { isVerifiedCreatorLoadout } from '../../gamification/verifiedCreator.ts';
import type { GamificationMeResponse } from '../../types/gamification.ts';
import type { UserState } from '../../types.ts';

interface NavItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  accent?: boolean;
  onClick?: () => void;
}

interface ProfilePanelProps {
  user: UserState;
  currentTab: string;
  gamificationData?: GamificationMeResponse | null;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onOpenGamification?: () => void;
  onLogout: () => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onRequestCreator: () => void;
  onUpdateUser?: (user: UserState) => void;
}

const NavCard = memo(function NavCard({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden flex flex-col gap-2 p-4 rounded-2xl border text-left cursor-pointer min-h-[88px] transition-colors ${
        active
          ? 'bg-cine-accent/12 border-cine-accent/35'
          : item.accent
            ? 'bg-gradient-to-br from-cine-accent/10 to-neutral-900/40 border-cine-accent/20 hover:border-cine-accent/35'
            : 'bg-neutral-900/30 border-neutral-800/70 hover:border-neutral-700 hover:bg-neutral-900/50'
      }`}
    >
      <span
        className={`inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-colors ${
          active
            ? 'bg-cine-accent/20 text-cine-accent-light'
            : item.accent
              ? 'bg-cine-accent/15 text-cine-accent-light'
              : 'bg-neutral-950/80 text-zinc-500 group-hover:text-zinc-200'
        }`}
      >
        <Icon className="w-4 h-4" />
      </span>
      <span className="min-w-0">
        <span className={`block text-sm font-bold truncate ${active ? 'text-cine-cream' : 'text-zinc-100'}`}>
          {item.label}
        </span>
        <span className="block text-[10px] text-zinc-500 line-clamp-2 mt-0.5 leading-snug">{item.description}</span>
      </span>
      <ChevronRight
        className={`absolute top-4 right-3 w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
          active ? 'text-cine-accent-light' : 'text-zinc-700 group-hover:text-zinc-500'
        }`}
      />
    </button>
  );
});

const SpotlightCard = memo(function SpotlightCard({
  title,
  subtitle,
  perks,
  cta,
  onClick,
  icon: Icon,
  variant,
  completed,
  completedLabel,
}: {
  title: string;
  subtitle: string;
  perks: string[];
  cta: string;
  onClick: () => void;
  icon: React.ElementType;
  variant: 'donor' | 'creator';
  completed?: boolean;
  completedLabel?: string;
}) {
  const isDonor = variant === 'donor';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden flex flex-col text-left rounded-3xl border p-5 md:p-6 min-h-[220px] cursor-pointer transition-colors ${
        isDonor
          ? 'border-amber-400/30 bg-gradient-to-br from-amber-500/15 via-neutral-950/90 to-cine-accent/10 hover:border-amber-400/50'
          : 'border-cine-accent/30 bg-gradient-to-br from-cine-accent/12 via-neutral-950/90 to-violet-500/10 hover:border-cine-accent/50'
      }`}
    >
      <div className="relative flex items-start justify-between gap-3 mb-4">
        <span
          className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl border ${
            isDonor
              ? 'bg-amber-500/15 border-amber-400/30 text-amber-200'
              : 'bg-cine-accent/15 border-cine-accent/30 text-cine-accent-light'
          }`}
        >
          <Icon className="w-6 h-6" />
        </span>
        {completed ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
            <BadgeCheck className="w-3.5 h-3.5" />
            {completedLabel}
          </span>
        ) : (
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isDonor
                ? 'bg-amber-400/10 text-amber-200 border border-amber-400/20'
                : 'bg-cine-accent/10 text-cine-accent-light border border-cine-accent/20'
            }`}
          >
            Destaque
          </span>
        )}
      </div>

      <div className="relative flex-1">
        <h3 className={`text-lg md:text-xl font-black leading-tight ${isDonor ? 'text-amber-50' : 'text-white'}`}>
          {title}
        </h3>
        <p className="text-xs md:text-sm text-zinc-400 mt-2 leading-relaxed max-w-sm">{subtitle}</p>

        <ul className="mt-4 space-y-1.5">
          {perks.map((perk) => (
            <li key={perk} className="flex items-center gap-2 text-[11px] text-zinc-300">
              <Check className={`w-3 h-3 shrink-0 ${isDonor ? 'text-amber-300' : 'text-cine-accent-light'}`} />
              {perk}
            </li>
          ))}
        </ul>
      </div>

      <span
        className={`relative mt-5 inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-colors ${
          isDonor
            ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 group-hover:from-amber-300 group-hover:to-amber-400'
            : 'bg-gradient-to-r from-cine-accent to-cyan-400 text-neutral-950 group-hover:from-cine-accent-light group-hover:to-cyan-300'
        }`}
      >
        {cta}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
});

const StatPill = memo(function StatPill({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  accent: string;
}) {
  return (
    <div className="flex-1 min-w-0 rounded-2xl border border-neutral-800/60 bg-neutral-950/50 px-3 py-3 text-center">
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl mb-1.5 ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-base font-black text-white tabular-nums">{value}</p>
      <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">{label}</p>
    </div>
  );
});

export default function ProfilePanel({
  user,
  currentTab,
  gamificationData = null,
  onClose,
  onNavigate,
  onOpenGamification,
  onLogout,
  onOpenAuth,
  onRequestCreator,
  onUpdateUser,
}: ProfilePanelProps) {
  const profile = gamificationData?.profile;
  const loadout = profile?.loadout;
  const isVerifiedCreator = isVerifiedCreatorLoadout(loadout);
  const displayLoadout = useMemo(
    () => applyDonorLoadout(loadout, !!user.isDonor),
    [loadout, user.isDonor]
  );

  const badgeItems = useMemo(
    () => (displayLoadout.badges || [])
      .filter((id) => id !== VERIFIED_PROFILE_BADGE_ID)
      .map((id) => {
        const fromInventory = gamificationData?.inventory.find((i) => i.id === id);
        if (fromInventory) return fromInventory;
        const def = getRewardById(id);
        return def ? { ...def, owned: true, equipped: true } : null;
      })
      .filter((b): b is NonNullable<typeof b> => !!b),
    [displayLoadout.badges, gamificationData?.inventory]
  );

  const firstName = useMemo(() => user.nome?.split(' ')[0] || 'cinéfilo', [user.nome]);

  const go = useCallback((tab: string, extra?: () => void) => {
    onNavigate(tab);
    extra?.();
    onClose();
  }, [onClose, onNavigate]);

  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      { id: 'inicio', label: 'Início', description: 'Catálogo e lançamentos', icon: Film },
      {
        id: 'club',
        label: 'CineReact Club',
        description: 'Cosméticos, conquistas e rankings',
        icon: Trophy,
        onClick: onOpenGamification,
      },
      { id: 'canais', label: 'Canais seguidos', description: 'Atualizações dos criadores', icon: Play },
      { id: 'categoria-almoco', label: 'Hora do almoço', description: 'Sorteie um react aleatório', icon: UtensilsCrossed },
      { id: 'minha-lista', label: 'Meus favoritos', description: 'Reacts e obras salvos', icon: Bookmark },
      { id: 'configuracoes', label: 'Configurações', description: 'Conta, senha e avatar', icon: Settings },
    ];

    if (user.isAdmin) {
      items.push({
        id: 'admin',
        label: 'Painel admin',
        description: 'Gerenciar catálogo e canais',
        icon: ShieldAlert,
        accent: true,
      });
    }

    return items;
  }, [onOpenGamification, user.isAdmin]);

  const handleBioSaved = useCallback((descricao: string) => {
    if (onUpdateUser) onUpdateUser({ ...user, descricao });
  }, [onUpdateUser, user]);

  return (
    <ProfileThemeScope
      loadout={displayLoadout}
      isDonor={!!user.isDonor}
      variant="fullscreen"
      className="flex-1 flex flex-col min-h-dvh"
    >
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-cine-accent/[0.04]" aria-hidden />

        <ProfileGreetingHeader firstName={firstName} onClose={onClose} />

        {!user.isLoggedIn ? (
          <div className="cine-container relative flex min-h-[50vh] items-center justify-center py-16">
            <div className="max-w-sm w-full text-center space-y-5 rounded-3xl border border-neutral-800/80 bg-neutral-900/30 p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cine-accent/20 to-neutral-900 border border-cine-accent/20 flex items-center justify-center mx-auto text-cine-accent-light">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Entre na sessão</h2>
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                  Favoritos, Club, cosméticos e sua bio personalizada te esperam aqui.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { onClose(); onOpenAuth?.('login'); }}
                className="w-full py-3 rounded-xl bg-cine-accent hover:bg-cine-accent-light text-white font-bold text-sm cursor-pointer transition-colors"
              >
                Entrar ou criar conta
              </button>
            </div>
          </div>
        ) : (
          <div className="cine-container relative py-4 md:py-6 space-y-6">
            <section className="relative overflow-hidden rounded-3xl border border-neutral-800/50 bg-neutral-900/20">
              <div className="absolute inset-0 bg-gradient-to-b from-cine-accent/6 via-transparent to-transparent pointer-events-none" />
              <div className="relative px-5 py-7 md:px-8 md:py-9 flex flex-col items-center text-center">
                <ProfileAvatar
                  photoUrl={user.avatar}
                  alt={user.nome}
                  size="xl"
                  loadout={displayLoadout}
                  isDonor={!!user.isDonor}
                  lite
                  className="mb-5"
                />

                <ProfileNameRow
                  name={user.nome}
                  isDonor={!!user.isDonor}
                  loadout={displayLoadout}
                  nameSize="lg"
                  align="center"
                  className="w-full max-w-md"
                />

                {onUpdateUser && (
                  <ProfileBioEditor
                    bio={user.descricao || ''}
                    email={user.email}
                    onSaved={handleBioSaved}
                    className="mx-auto mt-5"
                  />
                )}

                {isVerifiedCreator && (
                  <ProfileSocialLinks
                    links={user.socialLinks}
                    size="md"
                    align="center"
                    className="mt-4"
                  />
                )}

                {(badgeItems.length > 0 || user.isAdmin || user.isDonor) && (
                  <div className="flex flex-wrap justify-center items-center gap-2 mt-5 w-full">
                    {badgeItems.map((b) => (
                      <span key={b.id} title={b.name}>
                        <RewardPreviewThumb item={b} size="sm" lite />
                      </span>
                    ))}
                    {user.isAdmin && (
                      <span className="px-2.5 py-1 rounded-full bg-cine-accent/10 text-cine-accent-light border border-cine-accent/25 text-[10px] font-bold uppercase tracking-wide">
                        Admin
                      </span>
                    )}
                    {user.isDonor && <DonorBadge size="md" />}
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3 [content-visibility:auto] [contain-intrinsic-size:auto_480px]">
              <div className="flex items-end justify-between gap-3 px-1">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Faça parte</p>
                  <h2 className="text-base font-black text-white">Apoie ou crie na CineReact</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <SpotlightCard
                  variant="donor"
                  icon={Crown}
                  title={user.isDonor ? 'Você é Apoiador VIP' : 'Seja um Apoiador'}
                  subtitle={
                    user.isDonor
                      ? 'Obrigado por apoiar o projeto! Seus cosméticos exclusivos estão ativos.'
                      : 'Doação única de R$ 4,99 e desbloqueie tag, moldura, tema e título VIP.'
                  }
                  perks={
                    user.isDonor
                      ? ['Tag Apoiador no perfil', 'Cosméticos exclusivos equipados', 'Destaque nos comentários']
                      : ['Tag dourada no perfil', 'Pacote completo de cosméticos', 'Benefícios em até 24h']
                  }
                  cta={user.isDonor ? 'Apoiar novamente' : 'Quero ser apoiador'}
                  completed={!!user.isDonor}
                  completedLabel="Ativo"
                  onClick={() => go('doacoes')}
                />
                <SpotlightCard
                  variant="creator"
                  icon={Youtube}
                  title={isVerifiedCreator ? 'Criador Verificado' : 'Seja um Criador'}
                  subtitle={
                    isVerifiedCreator
                      ? 'Seu perfil oficial está verificado na plataforma. Obrigado por fazer parte!'
                      : 'Tem canal de reacts? Entre no catálogo oficial e ganhe visibilidade na comunidade.'
                  }
                  perks={
                    isVerifiedCreator
                      ? ['Perfil verificado na plataforma', 'Links sociais no perfil', 'Tag de criador oficial']
                      : ['Canal no catálogo CineReact', 'Perfil público de criador', 'Mais visibilidade para fãs']
                  }
                  cta={isVerifiedCreator ? 'Ver meu perfil público' : 'Solicitar meu canal'}
                  completed={isVerifiedCreator}
                  completedLabel="Verificado"
                  onClick={() => {
                    if (isVerifiedCreator) {
                      go('configuracoes');
                    } else {
                      onRequestCreator();
                    }
                  }}
                />
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 [content-visibility:auto] [contain-intrinsic-size:auto_120px]">
              {profile && (
                <div className="md:col-span-7 flex gap-2">
                  <StatPill icon={Star} value={profile.spotlight} label="Spotlight" accent="bg-amber-500/15 text-amber-300" />
                  <StatPill icon={Flame} value={profile.currentStreak} label="Sequência" accent="bg-orange-500/15 text-orange-300" />
                  <StatPill icon={Zap} value={profile.xp} label="XP" accent="bg-cine-accent/15 text-cine-accent-light" />
                </div>
              )}

              <div className={`flex flex-wrap gap-2 ${profile ? 'md:col-span-5 md:justify-end' : 'md:col-span-12'}`}>
                <button
                  type="button"
                  onClick={() => go('club', onOpenGamification)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cine-accent hover:bg-cine-accent-light text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  <Palette className="w-4 h-4" />
                  Personalizar
                </button>
                <button
                  type="button"
                  onClick={() => go('configuracoes')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Conta
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-400/90 hover:bg-red-500/10 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>

            {gamificationData && (
              <div className="rounded-2xl border border-neutral-800/50 bg-neutral-900/20 p-1 overflow-hidden [content-visibility:auto]">
                <GamificationBar data={gamificationData} animate={false} />
              </div>
            )}

            <section className="[content-visibility:auto] [contain-intrinsic-size:auto_320px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Explorar</h2>
                <span className="text-[10px] text-zinc-600 font-mono">{navItems.length} atalhos</span>
              </div>
              <nav className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
                {navItems.map((item) => (
                  <NavCard
                    key={item.id}
                    item={item}
                    active={currentTab === item.id}
                    onClick={() => go(item.id, item.onClick)}
                  />
                ))}
              </nav>
            </section>
          </div>
        )}
      </div>
    </ProfileThemeScope>
  );
}
