import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Home, Film, Gamepad2, Tv, Clapperboard, UtensilsCrossed, X } from 'lucide-react';
import { useSideNavStore, sideNavStore } from '../hooks/useSideNavStore.ts';

export const SIDE_NAV_ITEMS = [
  { id: 'inicio', label: 'Início', icon: Home },
  { id: 'categoria-filme', label: 'Filmes', icon: Film },
  { id: 'categoria-jogo', label: 'Jogos', icon: Gamepad2 },
  { id: 'categoria-anime', label: 'Animes', icon: Tv },
  { id: 'categoria-serie', label: 'Séries', icon: Clapperboard },
  { id: 'categoria-almoco', label: 'Hora do Almoço', icon: UtensilsCrossed },
] as const;

interface SideNavHubProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

function SideNavHub({ currentTab, setCurrentTab }: SideNavHubProps) {
  const { isSideNavOpen, closeSideNav } = useSideNavStore();

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
