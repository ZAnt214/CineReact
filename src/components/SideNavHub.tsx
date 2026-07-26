import React, { useEffect, useMemo } from 'react';
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
  Radio,
} from 'lucide-react';
import { useSideNavStore, sideNavStore } from '../hooks/useSideNavStore.ts';
import { DEMO_CREATOR_EMAIL } from '../constants/demoCreator.ts';
import {
  buildVideoCreatorsNavList,
  type VideoCreatorNavItem,
} from '../utils/videoCreatorsList.ts';
import type { Obra, ReactVideo } from '../types.ts';
import OptimizedImage from './OptimizedImage.tsx';
import SearchBar from './SearchBar.tsx';

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

interface SideNavHubProps {
  currentTab: string;
  selectedCanalId?: string | null;
  obras?: Obra[];
  reacts?: ReactVideo[];
  setCurrentTab: (tab: string) => void;
  onSelectCanal: (canalId: string) => void;
  onSearch: (results: Obra[], query: string) => void;
  onSelectObra: (id: string) => void;
}

function CreatorAvatar({
  src,
  sizeClass = 'w-8 h-8',
}: {
  src?: string;
  sizeClass?: string;
}) {
  if (!src) {
    return <span className={`${sizeClass} shrink-0 rounded-full bg-neutral-800 block`} />;
  }

  return (
    <OptimizedImage
      src={src}
      alt=""
      containerClassName={`${sizeClass} shrink-0 rounded-full overflow-hidden flex-none`}
      className="object-cover"
      width={32}
      height={32}
    />
  );
}

function CreatorNavRow({
  creator,
  isActive,
  onClick,
}: {
  creator: VideoCreatorNavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={creator.nome}
      className={`relative w-full min-w-0 flex items-center gap-2.5 pl-2.5 pr-2 py-2 rounded-lg text-left transition-colors cursor-pointer overflow-hidden ${
        isActive
          ? 'bg-neutral-900 text-white'
          : 'text-zinc-400 hover:bg-neutral-900/50 hover:text-zinc-200'
      } ${creator.isDemo ? 'border border-fuchsia-500/20 bg-fuchsia-500/5' : ''}`}
    >
      {isActive && (
        <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-cine-accent-light rounded-full" />
      )}

      <div className="relative shrink-0">
        <CreatorAvatar src={creator.poster} />
        {creator.isVerified && (
          <BadgeCheck className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-cyan-400 bg-neutral-950 rounded-full" />
        )}
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="text-[13px] font-semibold truncate leading-tight text-zinc-200">
          {creator.nome}
        </p>
        {creator.isDemo ? (
          <p className="text-[10px] text-fuchsia-400/90 truncate mt-0.5 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 shrink-0" />
            Exemplo verificado
          </p>
        ) : creator.reactCount > 0 ? (
          <p className="text-[10px] text-zinc-600 truncate mt-0.5 tabular-nums">
            {creator.reactCount} reacts
          </p>
        ) : null}
      </div>
    </button>
  );
}

function SideNavHub({
  currentTab,
  selectedCanalId,
  obras = [],
  reacts = [],
  setCurrentTab,
  onSelectCanal,
  onSearch,
  onSelectObra,
}: SideNavHubProps) {
  const { isSideNavOpen, closeSideNav } = useSideNavStore();
  const [creatorsExpanded, setCreatorsExpanded] = React.useState(true);

  const creators = useMemo(
    () => buildVideoCreatorsNavList(obras, reacts),
    [obras, reacts]
  );

  const demoCreator = creators.find((c) => c.isDemo);
  const channelCreators = creators.filter((c) => !c.isDemo);

  useEffect(() => {
    if (!isSideNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSideNav();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSideNavOpen, closeSideNav]);

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    closeSideNav();
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleCreatorClick = (creator: VideoCreatorNavItem) => {
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

  const isCreatorActive = (creator: VideoCreatorNavItem) => {
    if (creator.kind === 'demo') {
      return currentTab === buildCreatorProfileTab(DEMO_CREATOR_EMAIL);
    }
    return currentTab === 'canal' && selectedCanalId === creator.id;
  };

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
        className="fixed left-0 top-0 bottom-0 z-[95] w-64 max-w-[85vw] bg-neutral-950 border-r border-neutral-800/60 flex flex-col shadow-2xl shadow-black/40 overflow-hidden"
        aria-label="Menu principal"
      >
        <div className="shrink-0 border-b border-neutral-800/60 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cine-accent/80">
              Navegação
            </span>
            <button
              type="button"
              onClick={closeSideNav}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
              aria-label="Fechar menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <SearchBar
            obras={obras}
            reacts={reacts}
            onSearch={onSearch}
            onSelectObra={onSelectObra}
            onAfterSelect={closeSideNav}
            inputId="side-nav-search-input"
          />
        </div>

        <nav className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-1">
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
                    ? 'bg-cine-accent/10 text-cine-accent-light'
                    : 'text-zinc-400 hover:text-white hover:bg-neutral-900/60'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cine-accent-light rounded-r-full" />
                )}

                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-cine-accent-light' : 'text-zinc-500 group-hover:text-cine-accent-light'
                  }`}
                />
                <span className="text-sm font-bold truncate">{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 mt-3 border-t border-neutral-800/60 min-w-0 overflow-hidden">
            <button
              type="button"
              onClick={() => setCreatorsExpanded((prev) => !prev)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-150 cursor-pointer group ${
                creatorsActive
                  ? 'bg-cine-accent/10 text-cine-accent-light'
                  : 'text-zinc-400 hover:text-white hover:bg-neutral-900/60'
              }`}
            >
              {creatorsActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cine-accent-light rounded-r-full" />
              )}
              <Radio
                className={`w-5 h-5 shrink-0 ${
                  creatorsActive ? 'text-cine-accent-light' : 'text-zinc-500 group-hover:text-cine-accent-light'
                }`}
              />
              <span className="text-sm font-bold truncate flex-1">Criadores</span>
              <span className="text-[10px] font-bold text-zinc-600 tabular-nums">
                {channelCreators.length}
              </span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 text-zinc-600 transition-transform ${creatorsExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {creatorsExpanded && (
              <div className="mt-2 space-y-2 min-w-0 overflow-hidden">
                {demoCreator && (
                  <CreatorNavRow
                    creator={demoCreator}
                    isActive={isCreatorActive(demoCreator)}
                    onClick={() => handleCreatorClick(demoCreator)}
                  />
                )}

                {channelCreators.length > 0 && (
                  <div className="min-w-0">
                    <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                      Canais na plataforma
                    </p>
                    <div className="space-y-0.5 max-h-52 overflow-y-auto overflow-x-hidden [scrollbar-width:thin]">
                      {channelCreators.map((creator) => (
                        <CreatorNavRow
                          key={creator.id}
                          creator={creator}
                          isActive={isCreatorActive(creator)}
                          onClick={() => handleCreatorClick(creator)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {channelCreators.length === 0 && !demoCreator && (
                  <p className="px-2 py-2 text-xs text-zinc-600">Nenhum canal carregado ainda.</p>
                )}
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
