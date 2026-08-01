import React from 'react';
import {
  Film, Play, User, LogOut, Heart, Settings, Bookmark, ShieldAlert,
  ChevronRight, UtensilsCrossed, Trophy, Youtube, Send, Star, Flame, Zap, Palette,
} from 'lucide-react';
import GamificationBar from '../GamificationBar.tsx';
import ProfileAvatar from './ProfileAvatar.tsx';
import ProfileSurface from './ProfileSurface.tsx';
import ProfileThemeScope from './ProfileThemeScope.tsx';
import ProfileNameRow from './ProfileNameRow.tsx';
import ProfileSocialLinks from './ProfileSocialLinks.tsx';
import { RewardPreviewThumb } from '../rewards/RewardPreview.tsx';
import { VERIFIED_PROFILE_BADGE_ID } from '../../data/rewardsCatalog.ts';
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
}

function NavRow({
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
      className={`group flex items-center gap-3 w-full px-3 py-3 rounded-xl border text-left transition-colors cursor-pointer ${
        active
          ? 'bg-cine-accent/10 border-cine-accent/25'
          : item.accent
            ? 'border-cine-accent/20 bg-cine-surface/15 hover:bg-cine-surface/25'
            : 'border-transparent hover:border-neutral-800/80 hover:bg-neutral-900/40'
      }`}
    >
      <span
        className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
          active
            ? 'bg-cine-accent/15 text-cine-accent-light'
            : item.accent
              ? 'bg-cine-accent/10 text-cine-accent-light'
              : 'bg-neutral-900/80 text-zinc-500 group-hover:text-zinc-300'
        }`}
      >
        <Icon className="w-4 h-4" />
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-sm font-semibold truncate ${active ? 'text-cine-cream' : 'text-zinc-100'}`}>
          {item.label}
        </span>
        <span className="block text-[11px] text-zinc-500 truncate mt-0.5">{item.description}</span>
      </span>
      <ChevronRight
        className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
          active ? 'text-cine-accent-light' : 'text-zinc-600 group-hover:text-zinc-400'
        }`}
      />
    </button>
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
}: ProfilePanelProps) {
  const profile = gamificationData?.profile;
  const loadout = profile?.loadout;
  const isVerifiedCreator = isVerifiedCreatorLoadout(loadout);
  const badgeItems = (loadout?.badges || [])
    .map((id) => gamificationData?.inventory.find((i) => i.id === id))
    .filter((b): b is NonNullable<typeof b> => !!b)
    .filter((b) => b.id !== VERIFIED_PROFILE_BADGE_ID);

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
    { id: 'canais', label: 'Canais seguidos', description: 'Atualizações dos seus criadores', icon: Play },
    { id: 'categoria-almoco', label: 'Hora do almoço', description: 'Sorteie um react aleatório', icon: UtensilsCrossed },
    { id: 'minha-lista', label: 'Meus favoritos', description: 'Reacts e obras salvos', icon: Bookmark },
    { id: 'configuracoes', label: 'Configurações', description: 'Conta, senha e biografia', icon: Settings },
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
    <ProfileThemeScope loadout={loadout} variant="fullscreen" className="flex-1 flex flex-col min-h-dvh bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-neutral-800/60 bg-neutral-950">
        <div className="cine-container h-16 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Conta</p>
            <h1 className="text-sm font-bold profile-text">Meu perfil</h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer text-xs font-medium"
          >
            Fechar
          </button>
        </div>
      </header>

      {!user.isLoggedIn ? (
        <div className="cine-container flex-1 flex items-center justify-center py-20">
          <div className="max-w-sm w-full text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-zinc-500">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Entre na sua conta</h2>
              <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                Acesse favoritos, progresso no Club e personalize seu perfil.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { onClose(); onOpenAuth?.('login'); }}
              className="w-full py-2.5 rounded-xl bg-cine-accent hover:bg-cine-accent-light text-white font-bold text-sm cursor-pointer transition-colors"
            >
              Entrar
            </button>
          </div>
        </div>
      ) : (
        <div className="cine-container py-8 md:py-10 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Identity card */}
            <div className="lg:col-span-4 space-y-4">
              <ProfileSurface
                loadout={loadout}
                variant="panel"
                themed={false}
                rounded="rounded-2xl"
                className="border-neutral-800/70 bg-neutral-900/20 shadow-none"
                innerClassName="flex flex-col items-center text-center w-full"
              >
                <ProfileAvatar
                  photoUrl={user.avatar}
                  alt={user.nome}
                  size="xl"
                  loadout={loadout}
                  donorBadge={!!user.isDonor}
                  lite
                  className="mb-4"
                />

                <ProfileNameRow
                  name={user.nome}
                  isDonor={!!user.isDonor}
                  loadout={loadout}
                  nameSize="lg"
                  align="center"
                  className="w-full"
                />

                <p className="profile-text-subtle text-sm mt-3 leading-relaxed max-w-xs w-full">
                  {user.descricao || 'Adicione uma bio nas configurações para personalizar seu perfil.'}
                </p>

                {isVerifiedCreator && (
                  <ProfileSocialLinks
                    links={user.socialLinks}
                    size="md"
                    align="center"
                    className="mt-4"
                  />
                )}

                {badgeItems.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4 w-full">
                    {badgeItems.map((b) => (
                      <span key={b.id} title={b.name}>
                        <RewardPreviewThumb item={b} size="sm" lite />
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap justify-center gap-2 mt-5 w-full pt-1 border-t border-neutral-800/50">
                  {user.isAdmin && (
                    <span className="px-2.5 py-1 rounded-md bg-cine-accent/10 text-cine-accent-light border border-cine-accent/20 text-[10px] font-bold uppercase tracking-wide">
                      Admin
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                      user.isDonor
                        ? 'bg-cine-accent/10 text-cine-cream border-cine-accent/25'
                        : 'bg-neutral-900/60 text-zinc-500 border-neutral-800'
                    }`}
                  >
                    {user.isDonor ? 'Apoiador VIP' : 'Conta gratuita'}
                  </span>
                </div>
              </ProfileSurface>

              {/* Quick stats */}
              {profile && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-neutral-800/70 bg-neutral-900/30 px-3 py-3 text-center">
                    <Star className="w-4 h-4 text-cine-accent-light mx-auto mb-1" />
                    <p className="text-sm font-bold text-white">{profile.spotlight}</p>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-wide">Spotlight</p>
                  </div>
                  <div className="rounded-xl border border-neutral-800/70 bg-neutral-900/30 px-3 py-3 text-center">
                    <Flame className="w-4 h-4 text-cine-accent mx-auto mb-1" />
                    <p className="text-sm font-bold text-white">{profile.currentStreak}</p>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-wide">Sequência</p>
                  </div>
                  <div className="rounded-xl border border-neutral-800/70 bg-neutral-900/30 px-3 py-3 text-center">
                    <Zap className="w-4 h-4 text-cine-accent-light mx-auto mb-1" />
                    <p className="text-sm font-bold text-white">{profile.xp}</p>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-wide">XP</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => go('club', onOpenGamification)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cine-accent/10 hover:bg-cine-accent/15 border border-cine-accent/20 text-cine-cream text-xs font-bold cursor-pointer transition-colors"
                >
                  <Palette className="w-4 h-4" />
                  Personalizar perfil
                </button>
                <button
                  type="button"
                  onClick={() => go('doacoes')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Heart className="w-4 h-4 text-cine-accent-light" />
                  {user.isDonor ? 'Apoiar novamente' : 'Seja apoiador VIP'}
                </button>
                {user.isAdmin && (
                  <button
                    type="button"
                    onClick={() => go('admin')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-cine-accent/25 text-cine-cream text-xs font-semibold cursor-pointer hover:bg-cine-accent/10 transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Administrar
                  </button>
                )}
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-red-400/90 hover:text-red-300 hover:bg-red-500/5 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da conta
                </button>
              </div>
            </div>

            {/* Navigation + club progress */}
            <div className="lg:col-span-8 space-y-5">
              {gamificationData && (
                <GamificationBar data={gamificationData} />
              )}

              <section>
                <h2 className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 mb-3 px-1">
                  Navegação
                </h2>
                <nav className="space-y-1 rounded-2xl border border-neutral-800/60 bg-neutral-900/20 p-2">
                  {navItems.map((item) => (
                    <NavRow
                      key={item.id}
                      item={item}
                      active={currentTab === item.id}
                      onClick={() => go(item.id, item.onClick)}
                    />
                  ))}
                </nav>
              </section>

              <section className="rounded-2xl border border-neutral-800/60 bg-neutral-900/20 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-cine-accent/80 flex items-center gap-1.5 mb-1">
                    <Youtube className="w-3.5 h-3.5" />
                    Criadores
                  </p>
                  <h3 className="text-sm font-bold text-white">Seu canal não está no catálogo?</h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Solicite a inclusão do seu canal de reacts na plataforma.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onRequestCreator}
                  className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Solicitar
                </button>
              </section>
            </div>
          </div>
        </div>
      )}
    </ProfileThemeScope>
  );
}
