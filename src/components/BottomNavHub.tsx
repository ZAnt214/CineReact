import React from 'react';
import { Home, Film, Gamepad2, Tv, Clapperboard, Heart, UtensilsCrossed } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavHubProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export default function BottomNavHub({ currentTab, setCurrentTab }: BottomNavHubProps) {
  const navItems = [
    {
      id: 'inicio',
      label: 'Início',
      icon: Home
    },
    {
      id: 'categoria-filme',
      label: 'Filmes',
      icon: Film
    },
    {
      id: 'categoria-jogo',
      label: 'Jogos',
      icon: Gamepad2
    },
    {
      id: 'categoria-anime',
      label: 'Animes',
      icon: Tv
    },
    {
      id: 'categoria-serie',
      label: 'Séries',
      icon: Clapperboard
    },
    {
      id: 'categoria-almoco',
      label: 'Almoço',
      icon: UtensilsCrossed
    },
    {
      id: 'categoria-canal-fanit-lin',
      label: 'Fanit & Lin',
      icon: Heart
    }
  ];

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <motion.nav
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 280 }}
      className="fixed bottom-0 left-0 right-0 w-full max-w-full bg-zinc-950 max-md:backdrop-blur-none md:bg-zinc-950/85 md:backdrop-blur-md border-t border-zinc-800/50 z-[95] pointer-events-auto shadow-2xl box-border overflow-hidden"
    >
      <div className="cine-container py-1.5 sm:py-2.5 flex items-center justify-between sm:justify-evenly gap-0.5 sm:gap-3 md:gap-6 w-full box-border">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (item.id === 'categoria-canal-fanit-lin' && currentTab === 'canal');

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`relative flex-1 min-w-0 max-w-[110px] xl:max-w-none flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-1 sm:px-3 py-1 sm:py-2 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all duration-200 cursor-pointer select-none group ${
                isActive
                  ? 'text-amber-400 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 active:scale-95'
              }`}
              title={`Ir para ${item.label}`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                isActive ? 'text-amber-400' : 'text-zinc-400 group-hover:text-amber-400'
              }`} />
              <span className="truncate text-[10px] sm:text-xs font-bold leading-none">{item.label}</span>

              {/* Active Bottom Indicator Bar */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavActiveBar"
                  className="absolute bottom-0 left-2 right-2 h-[2px] bg-amber-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}

