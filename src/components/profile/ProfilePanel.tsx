import React, { useMemo } from 'react';
import {
  Film, Play, User, LogOut, Heart, Settings, Bookmark, ShieldAlert,
  ChevronRight, UtensilsCrossed, Trophy, Youtube, Send, Star, Flame, Zap, Palette,
  Sparkles, X,
} from 'lucide-react';
import GamificationBar from '../GamificationBar.tsx';
import ProfileAvatar from './ProfileAvatar.tsx';
import ProfileThemeScope from './ProfileThemeScope.tsx';
import ProfileNameRow from './ProfileNameRow.tsx';
import ProfileBioEditor from './ProfileBioEditor.tsx';
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

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function NavCard({
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
      className={`group relative overflow-hidden flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all cursor-pointer min-h-[88px] ${
        active
          ? 'bg-cine-accent/12 border-cine-accent/35 shadow-lg shadow-cine-accent/10'
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
}

function StatPill({
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
    <div className="flex-1 min-w-0 rounded-2xl border border-neutral-800/60 bg-neutral-950/50 px-3 py-3 text-center backdrop-blur-sm">
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl mb-1.5 ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-base font-black text-white tabular-nums">{value}</p>
      <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">{label}</p>
    </div>
  );
}

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
  const displayLoadout = applyDonorLoadout(loadout, !!user.isDonor);
  const tierLabel = gamificationData?.tier || 'Espectador';

  const badgeItems = (displayLoadout.badges || [])
    .filter((id) => id !== VERIFIED_PROFILE_BADGE_ID)
    .map((id) => {
      const fromInventory = gamificationData?.inventory.find((i) => i.id === id);
      if (fromInventory) return fromInventory;
      const def = getRewardById(id);
      return def ? { ...def, owned: true, equipped: true } : null;
    })
    .filter((b): b is NonNullable<typeof b> => !!b);

  const firstName = useMemo(() => user.nome?.split(' ')[0] || 'cinéfilo', [user.nome]);

  const go = (tab: string, extra?: () => void) => {
    onNavigate(tab);
    extra?.();
    onClose();
  };

  const navItems: NavItem[] = [
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
    { id: 'doacoes', label: 'Apoiar o projeto', description: 'Doações e benefícios VIP', icon: Heart },
  ];

  if (user.isAdmin) {
    navItems.push({
      id: 'admin',
      label: 'Painel admin',
      description: 'Gerenciar catálogo e canais',
      icon: ShieldAlert,
      accent: true,
    });
  }

  return (
    <ProfileThemeScope loadout={displayLoadout} isDonor={!!user.isDonor} variant="fullscreen" className="flex-1 flex flex-col min-h-dvh">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[min(100%,520px)] h-64 bg-cine-accent/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-cine-accent/5 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-neutral-800/40 bg-neutral-950/80 backdrop-blur-xl">
        <div className="cine-container h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cine-accent-light" />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Sua conta</p>
              <h1 className="text-sm font-bold profile-text">{greeting()}, {firstName}</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-neutral-800 text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-neutral-900 transition-colors cursor-pointer"
            aria-label="Fechar perfil"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {!user.isLoggedIn ? (
        <div className="cine-container relative flex-1 flex items-center justify-center py-20">
          <div className="max-w-sm w-full text-center space-y-5 rounded-3xl border border-neutral-800/80 bg-neutral-900/30 p-8 backdrop-blur-sm">
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
              className="w-full py-3 rounded-xl bg-cine-accent hover:bg-cine-accent-light text-white font-bold text-sm cursor-pointer transition-colors shadow-lg shadow-cine-accent/20"
            >
              Entrar ou criar conta
            </button>
          </div>
        </div>
      ) : (
        <div className="cine-container relative py-6 md:py-10 flex-1 space-y-6">
          <section className="relative overflow-hidden rounded-3xl border border-neutral-800/60 bg-neutral-900/25 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-cine-accent/8 via-transparent to-neutral-950/80 pointer-events-none" />
            <div className="relative px-5 py-8 md:px-8 md:py-10 flex flex-col items-center text-center">
              <div className="relative mb-5">
                <div className="absolute -inset-3 rounded-full bg-cine-accent/15 blur-xl" aria-hidden />
                <ProfileAvatar
                  photoUrl={user.avatar}
                  alt={user.nome}
                  size="xl"
                  loadout={displayLoadout}
                  isDonor={!!user.isDonor}
                  lite
                  className="relative"
                />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-neutral-950/90 border border-neutral-800 text-[10px] font-bold text-cine-accent-light uppercase tracking-wider">
                  {tierLabel}
                </span>
              </div>

              <ProfileNameRow
                name={user.nome}
                isDonor={!!user.isDonor}
                loadout={displayLoadout}
                nameSize="lg"
                align="center"
                className="w-full max-w-md"
              />

              <p className="text-[11px] text-zinc-600 font-mono mt-2 mb-4">{user.email}</p>

              {onUpdateUser && (
                <ProfileBioEditor
                  bio={user.descricao || ''}
                  email={user.email}
                  onSaved={(descricao) => onUpdateUser({ ...user, descricao })}
                  className="mx-auto"
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

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cine-accent hover:bg-cine-accent-light text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-cine-accent/20"
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
            <div className="rounded-2xl border border-neutral-800/50 bg-neutral-900/20 p-1 overflow-hidden">
              <GamificationBar data={gamificationData} />
            </div>
          )}

          <section>
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

          <section className="rounded-2xl border border-neutral-800/60 bg-gradient-to-r from-neutral-900/60 to-neutral-950/80 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-widest text-cine-accent/80 flex items-center gap-1.5 mb-1">
                <Youtube className="w-3.5 h-3.5" />
                Criadores
              </p>
              <h3 className="text-sm font-bold text-white">Tem um canal de reacts?</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Peça para entrar no catálogo oficial da CineReact.
              </p>
            </div>
            <button
              type="button"
              onClick={onRequestCreator}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Solicitar canal
            </button>
          </section>

          {!user.isDonor && (
            <button
              type="button"
              onClick={() => go('doacoes')}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-500/10 via-neutral-900/40 to-cine-accent/10 hover:border-amber-400/35 text-amber-100 text-xs font-bold cursor-pointer transition-all"
            >
              <Heart className="w-4 h-4 fill-amber-400/30 text-amber-300" />
              Apoie o CineReact e desbloqueie cosméticos exclusivos
            </button>
          )}
        </div>
      )}
    </ProfileThemeScope>
  );
}
