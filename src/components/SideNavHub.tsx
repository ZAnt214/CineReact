import React, { useCallback, useEffect, useMemo, useRef } from 'react';
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
  Radio,
  Download,
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
import SideNavLink from './sidenav/SideNavLink.tsx';
import SideNavClipsEntry from './sidenav/SideNavClipsEntry.tsx';

const CATALOG_NAV_ITEMS = [
  { id: 'inicio', label: 'Início', icon: Home },
  { id: 'categoria-filme', label: 'Filmes', icon: Film },
  { id: 'categoria-jogo', label: 'Jogos', icon: Gamepad2 },
  { id: 'categoria-anime', label: 'Animes', icon: Tv },
  { id: 'categoria-serie', label: 'Séries', icon: Clapperboard },
  { id: 'categoria-almoco', label: 'Hora do Almoço', icon: UtensilsCrossed },
] as const;

const ACCOUNT_NAV_ITEMS = [
  { id: 'club', label: 'CineReact Club', icon: Trophy },
  { id: 'download-logo', label: 'Baixar Logo', icon: Download },
] as const;

export const SIDE_NAV_ITEMS = [...CATALOG_NAV_ITEMS, ...ACCOUNT_NAV_ITEMS];

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

const CreatorAvatar = React.memo(function CreatorAvatar({
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
});

const CreatorNavRow = React.memo(function CreatorNavRow({
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
      className={`side-nav-creator ${isActive ? 'side-nav-creator--active' : ''} ${
        creator.isDemo ? 'side-nav-creator--demo' : ''
      }`}
    >
      <div className="relative shrink-0">
        <CreatorAvatar src={creator.poster} />
        {creator.isVerified && (
          <BadgeCheck className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-zinc-300 bg-neutral-950 rounded-full" />
        )}
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="side-nav-creator-name">{creator.nome}</p>
        {creator.isDemo ? (
          <p className="side-nav-creator-meta">Criador verificado</p>
        ) : creator.reactCount > 0 ? (
          <p className="side-nav-creator-meta side-nav-creator-meta--muted">
            {creator.reactCount} reacts
          </p>
        ) : null}
      </div>
    </button>
  );
});

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
  const [hasOpened, setHasOpened] = React.useState(false);
  const openedAtRef = useRef(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isSideNavOpen) {
      openedAtRef.current = Date.now();
      setHasOpened(true);
      window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    }
  }, [isSideNavOpen]);

  useEffect(() => {
    if (!isSideNavOpen || typeof document === 'undefined') return;

    const { body, documentElement } = document;
    const scrollY = window.scrollY;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;

    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isSideNavOpen]);

  const creators = useMemo(
    () => (hasOpened ? buildVideoCreatorsNavList(obras, reacts) : []),
    [hasOpened, obras, reacts]
  );

  const demoCreator = creators.find((c) => c.isDemo);
  const channelCreators = creators.filter((c) => !c.isDemo);

  useEffect(() => {
    if (!isSideNavOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSideNav();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSideNavOpen, closeSideNav]);

  const handleNavClick = useCallback(
    (tabId: string) => {
      setCurrentTab(tabId);
      closeSideNav();
      window.scrollTo({ top: 0, behavior: 'auto' });
    },
    [closeSideNav, setCurrentTab]
  );

  const handleCreatorClick = useCallback(
    (creator: VideoCreatorNavItem) => {
      if (creator.kind === 'demo' && creator.demoEmail) {
        handleNavClick(buildCreatorProfileTab(creator.demoEmail));
        return;
      }
      onSelectCanal(creator.id);
      closeSideNav();
      window.scrollTo({ top: 0, behavior: 'auto' });
    },
    [closeSideNav, handleNavClick, onSelectCanal]
  );

  const creatorsActive =
    currentTab.startsWith(CREATOR_PROFILE_TAB_PREFIX) ||
    (currentTab === 'canal' && !!selectedCanalId);

  const isCreatorActive = useCallback(
    (creator: VideoCreatorNavItem) => {
      if (creator.kind === 'demo') {
        return currentTab === buildCreatorProfileTab(DEMO_CREATOR_EMAIL);
      }
      return currentTab === 'canal' && selectedCanalId === creator.id;
    },
    [currentTab, selectedCanalId]
  );

  const isCineClipsActive =
    currentTab === 'cineclips' || currentTab.startsWith('cineclips-hashtag-');

  if (typeof document === 'undefined') return null;

  const content = (
    <>
      {isSideNavOpen && (
        <button
          type="button"
          className="side-nav-backdrop"
          onClick={() => {
            if (Date.now() - openedAtRef.current < 280) return;
            closeSideNav();
          }}
          aria-label="Fechar menu"
        />
      )}

      {hasOpened && (
        <aside
          ref={panelRef}
          id="side-nav-panel"
          inert={!isSideNavOpen}
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
          aria-hidden={!isSideNavOpen}
          className={`side-nav-panel ${isSideNavOpen ? 'side-nav-panel--open' : ''}`}
        >
          <header className="side-nav-header">
            <div className="side-nav-header-copy">
              <p className="side-nav-eyebrow">Menu</p>
              <h2 className="side-nav-title">
                <span className="side-nav-title-cine">Cine</span>
                <span className="side-nav-title-react">React</span>
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeSideNav}
              className="side-nav-close"
              aria-label="Fechar menu"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="side-nav-search-wrap">
            <SearchBar
              obras={hasOpened ? obras : []}
              reacts={hasOpened ? reacts : []}
              onSearch={onSearch}
              onSelectObra={onSelectObra}
              onAfterSelect={closeSideNav}
              inputId="side-nav-search-input"
            />
          </div>

          <nav className="side-nav-body" aria-label="Seções do site">
            <section className="side-nav-section" style={{ contentVisibility: 'auto' }}>
              <p className="side-nav-section-label">Destaques</p>
              <SideNavClipsEntry
                active={isCineClipsActive}
                onClick={() => handleNavClick('cineclips')}
              />
            </section>

            <section className="side-nav-section" style={{ contentVisibility: 'auto' }}>
              <p className="side-nav-section-label">Catálogo</p>
              <div className="side-nav-link-grid">
                {CATALOG_NAV_ITEMS.map((item) => (
                  <SideNavLink
                    key={item.id}
                    id={item.id === 'inicio' ? 'side-nav-inicio' : undefined}
                    label={item.label}
                    icon={item.icon}
                    active={currentTab === item.id}
                    onClick={() => handleNavClick(item.id)}
                  />
                ))}
              </div>
            </section>

            <section className="side-nav-section" style={{ contentVisibility: 'auto' }}>
              <p className="side-nav-section-label">Conta</p>
              <div className="side-nav-link-stack">
                {ACCOUNT_NAV_ITEMS.map((item) => (
                  <SideNavLink
                    key={item.id}
                    label={item.label}
                    icon={item.icon}
                    active={currentTab === item.id}
                    onClick={() => handleNavClick(item.id)}
                  />
                ))}
              </div>
            </section>

            <section className="side-nav-section side-nav-section--creators" style={{ contentVisibility: 'auto' }}>
              <button
                type="button"
                onClick={() => setCreatorsExpanded((prev) => !prev)}
                className={`side-nav-creators-toggle ${creatorsActive ? 'side-nav-creators-toggle--active' : ''}`}
                aria-expanded={creatorsExpanded}
              >
                <span className="side-nav-link-icon" aria-hidden="true">
                  <Radio className="w-4 h-4" strokeWidth={2} />
                </span>
                <span className="side-nav-link-label flex-1 text-left">Criadores</span>
                <span className="side-nav-creators-count">{channelCreators.length}</span>
                <ChevronDown
                  className={`side-nav-creators-chevron ${creatorsExpanded ? 'is-open' : ''}`}
                />
              </button>

              {creatorsExpanded && (
                <div className="side-nav-creators-list">
                  {demoCreator && (
                    <CreatorNavRow
                      creator={demoCreator}
                      isActive={isCreatorActive(demoCreator)}
                      onClick={() => handleCreatorClick(demoCreator)}
                    />
                  )}

                  {channelCreators.length > 0 && (
                    <div className="side-nav-creators-channels">
                      <p className="side-nav-section-label side-nav-section-label--nested">
                        Canais na plataforma
                      </p>
                      <div className="side-nav-creators-scroll">
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
                    <p className="side-nav-creators-empty">Nenhum canal carregado ainda.</p>
                  )}
                </div>
              )}
            </section>
          </nav>
        </aside>
      )}
    </>
  );

  return createPortal(content, document.body);
}

export default React.memo(SideNavHub);

export function resetSideNavOnLeave() {
  sideNavStore.close();
}
