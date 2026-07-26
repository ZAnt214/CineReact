import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Home,
  Film,
  Gamepad2,
  Tv,
  Clapperboard,
  UtensilsCrossed,
  Trophy,
  X,
  Users,
  ChevronDown,
  BadgeCheck,
  Sparkles,
} from 'lucide-react';
import { useSideNavStore, sideNavStore } from '../hooks/useSideNavStore.ts';
import OptimizedImage from './OptimizedImage.tsx';

export const SIDE_NAV_ITEMS = [
  { id: 'inicio', label: 'Início', icon: Home },
  { id: 'categoria-filme', label: 'Filmes', icon: Film },
  { id: 'categoria-jogo', label: 'Jogos', icon: Gamepad2 },
  { id: 'categoria-anime', label: 'Animes', icon: Tv },
  { id: 'categoria-serie', label: 'Séries', icon: Clapperboard },
  { id: 'categoria-almoco', label: 'Hora do Almoço', icon: UtensilsCrossed },
  { id: 'club', label: 'CineReact Club', icon: Trophy },
] as const;

export const CREATOR_PROFILE_TAB_PREFIX = 'criador-perfil:';

export function buildCreatorProfileTab(email: string): string {
  return `${CREATOR_PROFILE_TAB_PREFIX}${email}`;
}

export function parseCreatorProfileTab(tab: string): string | null {
  if (!tab.startsWith(CREATOR_PROFILE_TAB_PREFIX)) return null;
  return tab.slice(CREATOR_PROFILE_TAB_PREFIX.length) || null;
}

interface CreatorListItem {
  email: string;
  nome: string;
  avatar?: string;
  isVerifiedCreator: boolean;
  isDemo?: boolean;
}

interface SideNavHubProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

function SideNavHub({ currentTab, setCurrentTab }: SideNavHubProps) {
  const { isSideNavOpen, closeSideNav } = useSideNavStore();
  const [creatorsExpanded, setCreatorsExpanded] = useState(true);
  const [creators, setCreators] = useState<CreatorListItem[]>([]);
  const [creatorsLoading, setCreatorsLoading] = useState(false);

  useEffect(() => {
    if (!isSideNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSideNav();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSideNavOpen, closeSideNav]);

  useEffect(() => {
    if (!isSideNavOpen) return;

    let cancelled = false;
    const loadCreators = async () => {
      setCreatorsLoading(true);
      try {
        const res = await fetch('/api/criadores');
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data?.success && Array.isArray(data.creators)) {
          setCreators(data.creators);
        }
      } catch {
        if (!cancelled) setCreators([]);
      } finally {
        if (!cancelled) setCreatorsLoading(false);
      }
    };

    loadCreators();
    return () => {
      cancelled = true;
    };
  }, [isSideNavOpen]);

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    closeSideNav();
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const creatorsActive = currentTab.startsWith(CREATOR_PROFILE_TAB_PREFIX);

  if (!isSideNavOpen || typeof document === 'undefined') return null;

  const content = (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[94] bg-black/60 md:bg-black/40"
        onClick={closeSideNav}
        aria-label="Fechar menu"
      />

      <aside
        className="fixed left-0 top-0 bottom-0 z-[95] w-64 bg-zinc-950 border-r border-zinc-800/60 flex flex-col shadow-2xl shadow-black/40"
        aria-label="Menu principal"
      >
        <div className="h-16 shrink-0 border-b border-zinc-800/60 flex items-center justify-between px-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/80">
            Navegação
          </span>
          <button
            type="button"
            onClick={closeSideNav}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {SIDE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                title={item.label}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-150 cursor-pointer group ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-400 rounded-r-full" />
                )}

                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-amber-400'
                  }`}
                />
                <span className="text-sm font-bold truncate">{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 mt-2 border-t border-zinc-800/60">
            <button
              type="button"
              onClick={() => setCreatorsExpanded((prev) => !prev)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-150 cursor-pointer group ${
                creatorsActive
                  ? 'bg-fuchsia-500/10 text-fuchsia-300'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              {creatorsActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-fuchsia-400 rounded-r-full" />
              )}
              <Users
                className={`w-5 h-5 shrink-0 ${
                  creatorsActive ? 'text-fuchsia-300' : 'text-zinc-500 group-hover:text-fuchsia-300'
                }`}
              />
              <span className="text-sm font-bold truncate flex-1">Criadores</span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 transition-transform ${creatorsExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {creatorsExpanded && (
              <div className="mt-1 ml-2 pl-2 border-l border-zinc-800/80 space-y-0.5 max-h-52 overflow-y-auto">
                {creatorsLoading && (
                  <p className="px-3 py-2 text-xs text-zinc-600">Carregando perfis...</p>
                )}

                {!creatorsLoading && creators.length === 0 && (
                  <p className="px-3 py-2 text-xs text-zinc-600">Nenhum perfil disponível.</p>
                )}

                {!creatorsLoading &&
                  creators.map((creator) => {
                    const tabId = buildCreatorProfileTab(creator.email);
                    const isActive = currentTab === tabId;

                    return (
                      <button
                        key={creator.email}
                        type="button"
                        onClick={() => handleNavClick(tabId)}
                        title={creator.nome}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-fuchsia-500/15 text-fuchsia-200'
                            : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'
                        }`}
                      >
                        {creator.avatar ? (
                          <OptimizedImage
                            src={creator.avatar}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                            width={24}
                            height={24}
                          />
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-zinc-800 shrink-0" />
                        )}
                        <span className="text-xs font-semibold truncate flex-1">{creator.nome}</span>
                        {creator.isDemo ? (
                          <Sparkles className="w-3.5 h-3.5 text-fuchsia-300 shrink-0" />
                        ) : creator.isVerifiedCreator ? (
                          <BadgeCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  );

  return createPortal(content, document.body);
}

export default React.memo(SideNavHub);

export function resetSideNavOnLeave() {
  sideNavStore.close();
}
