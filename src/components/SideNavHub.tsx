import React from 'react';
import { Home, Film, Gamepad2, Tv, Clapperboard, Heart, UtensilsCrossed } from 'lucide-react';
import { motion } from 'motion/react';

export const SIDE_NAV_ITEMS = [
  { id: 'inicio', label: 'Início', icon: Home },
  { id: 'categoria-filme', label: 'Filmes', icon: Film },
  { id: 'categoria-jogo', label: 'Jogos', icon: Gamepad2 },
  { id: 'categoria-anime', label: 'Animes', icon: Tv },
  { id: 'categoria-serie', label: 'Séries', icon: Clapperboard },
  { id: 'categoria-almoco', label: 'Hora do Almoço', icon: UtensilsCrossed },
  { id: 'categoria-canal-fanit-lin', label: 'Fanit & Lin', icon: Heart },
] as const;

interface SideNavHubProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export default function SideNavHub({ currentTab, setCurrentTab }: SideNavHubProps) {
  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="fixed left-0 top-0 bottom-0 z-[95] w-[4.5rem] md:w-56 bg-zinc-950 border-r border-zinc-800/60 flex flex-col shadow-xl shadow-black/20"
      aria-label="Menu principal"
    >
      <div className="h-16 shrink-0 border-b border-zinc-800/60 flex items-center justify-center md:justify-start md:px-5">
        <span className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/80">
          Navegação
        </span>
        <span className="md:hidden w-2 h-2 rounded-full bg-amber-400" aria-hidden="true" />
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 md:px-3 space-y-1">
        {SIDE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id ||
            (item.id === 'categoria-canal-fanit-lin' && currentTab === 'canal');

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              title={item.label}
              className={`relative w-full flex items-center gap-3 px-2.5 md:px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer group ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sideNavActive"
                  className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-400 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <Icon
                className={`w-5 h-5 shrink-0 mx-auto md:mx-0 ${
                  isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-amber-400'
                }`}
              />
              <span className="hidden md:block text-sm font-bold truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </motion.aside>
  );
}
