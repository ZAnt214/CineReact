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
  ChevronDown,
  BadgeCheck,
  Sparkles,
  Play,
} from 'lucide-react';
import { useSideNavStore, sideNavStore } from '../hooks/useSideNavStore.ts';
import { DEMO_CREATOR_EMAIL } from '../constants/demoCreator.ts';
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

interface VideoCreatorListItem {
  id: string;
  nome: string;
  poster?: string;
  reactCount: number;
  isVerified: boolean;
  isDemo?: boolean;
  kind: 'canal' | 'demo';
  demoEmail?: string;
}

interface SideNavHubProps {
  currentTab: string;
  selectedCanalId?: string | null;
  setCurrentTab: (tab: string) => void;
  onSelectCanal: (canalId: string) => void;
}

function SideNavHub({
  currentTab,
  selectedCanalId,
  setCurrentTab,
  onSelectCanal,
}: SideNavHubProps) {
  const { isSideNavOpen, closeSideNav } = useSideNavStore();
  const [creatorsExpanded, setCreatorsExpanded] = useState(true);
  const [creators, setCreators] = useState<VideoCreatorListItem[]>([]);
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

  const handleCreatorClick = (creator: VideoCreatorListItem) => {
    if (creator.kind === 'demo' && creator.demoEmail) {
      handleNavClick(buildCreatorProfileTab(creator.demoEmail));
      return;
    }
    onSelectCanal(creator.id);
    closeSideNav();
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const creatorsActive =
    currentTab.startsWith(CREATOR_PROFILE_TAB_PREFIX) ||
    (currentTab === 'canal' && !!selectedCanalId);

  const isCreatorActive = (creator: VideoCreatorListItem) => {
    if (creator.kind === 'demo') {
      return currentTab === buildCreatorProfileTab(DEMO_CREATOR_EMAIL);
    }
    return currentTab === 'canal' && selectedCanalId === creator.id;
  };

  if (!isSideNavOpen || typeof document === 'undefined') return null;

  const channelCount = creators.filter((c) => c.kind === 'canal').length;

  const content = (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[94] bg-black/60 md:bg-black/40"
        onClick={closeSideNav}
        aria-label="Fechar menu"
      />

      <aside
        className="fixed left-0 top-0 bottom-0 z-[95] w-72 bg-zinc-950 border-r border-zinc-800/60 flex flex-col shadow-2xl shadow-black/40"
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

          <div className="pt-3 mt-3 border-t border-zinc-800/60">
            <button
              type="button"
              onClick={() => setCreatorsExpanded((prev) => !prev)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-150 cursor-pointer group ${
                creatorsActive
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              {creatorsActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-400 rounded-r-full" />
              )}
              <Play
                className={`w-5 h-5 shrink-0 ${
                  creatorsActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-amber-400'
                }`}
              />
              <span className="text-sm font-bold truncate flex-1">Criadores</span>
              {!creatorsLoading && channelCount > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400">
                  {channelCount}
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 shrink-0 transition-transform ${creatorsExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {creatorsExpanded && (
              <div className="mt-2 space-y-1 max-h-[min(18rem,40vh)] overflow-y-auto pr-1 [scrollbar-width:thin]">
                {creatorsLoading && (
                  <div className="px-3 py-4 flex items-center justify-center">
                    <span className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
                  </div>
                )}

                {!creatorsLoading && creators.length === 0 && (
                  <p className="px-3 py-3 text-xs text-zinc-600 text-center">Nenhum criador disponível.</p>
                )}

                {!creatorsLoading &&
                  creators.map((creator) => {
                    const isActive = isCreatorActive(creator);

                    return (
                      <button
                        key={creator.id}
                        type="button"
                        onClick={() => handleCreatorClick(creator)}
                        title={creator.nome}
                        className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer group ${
                          isActive
                            ? 'bg-amber-500/15 ring-1 ring-amber-500/25'
                            : 'hover:bg-zinc-900/70'
                        }`}
                      >
                        <div className="relative shrink-0">
                          {creator.poster ? (
                            <OptimizedImage
                              src={creator.poster}
                              alt=""
                              className={`w-10 h-10 rounded-full object-cover ring-2 transition-colors ${
                                isActive
                                  ? 'ring-amber-400/60'
                                  : 'ring-zinc-800 group-hover:ring-amber-500/30'
                              }`}
                              width={40}
                              height={40}
                            />
                          ) : (
                            <span className="w-10 h-10 rounded-full bg-zinc-800 ring-2 ring-zinc-800 block" />
                          )}
                          {creator.isVerified && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-zinc-950 flex items-center justify-center">
                              <BadgeCheck className="w-3 h-3 text-cyan-400" />
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-bold truncate ${
                              isActive ? 'text-amber-300' : 'text-zinc-200 group-hover:text-white'
                            }`}
                          >
                            {creator.nome}
                          </p>
                          <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                            {creator.isDemo ? (
                              <span className="inline-flex items-center gap-1 text-fuchsia-300/90">
                                <Sparkles className="w-3 h-3" />
                                Exemplo de perfil verificado
                              </span>
                            ) : (
                              <span>
                                {creator.reactCount} react{creator.reactCount === 1 ? '' : 's'}
                              </span>
                            )}
                          </p>
                        </div>

                        {creator.isDemo && (
                          <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-fuchsia-500/15 text-fuchsia-300">
                            Demo
                          </span>
                        )}
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
