import React from 'react';
import { Home, Film, Gamepad2, Tv, Clapperboard, Heart, UtensilsCrossed, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SIDE_NAV_ITEMS = [
  { id: 'inicio', label: 'Início', icon: Home },
  { id: 'categoria-filme', label: 'Filmes', icon: Film },
  { id: 'categoria-jogo', label: 'Jogos', icon: Gamepad2 },
  { id: 'categoria-anime', label: 'Animes', icon: Tv },
  { id: 'categoria-serie', label: 'Séries', icon: Clapperboard },
  { id: 'categoria-almoco', label: 'Hora do Almoço', icon: UtensilsCrossed },
  { id: 'categoria-canal-fanit-lin', label: 'Fanit & Lin', icon: Heart },
] as const;

const PANEL_TRANSITION = { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const };
const BACKDROP_TRANSITION = { duration: 0.38, ease: [0.4, 0, 0.2, 1] as const };

interface SideNavHubProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function SideNavHub({ currentTab, setCurrentTab, isOpen, onClose }: SideNavHubProps) {
  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    onClose();
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            key="side-nav-backdrop"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={BACKDROP_TRANSITION}
            className="fixed inset-0 z-[94] bg-black/60 md:bg-black/40"
            onClick={onClose}
            aria-label="Fechar menu"
          />

          <motion.aside
            key="side-nav-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={PANEL_TRANSITION}
            className="fixed left-0 top-0 bottom-0 z-[95] w-64 bg-zinc-950 border-r border-zinc-800/60 flex flex-col shadow-2xl shadow-black/40 will-change-transform"
            aria-label="Menu principal"
          >
            <div className="h-16 shrink-0 border-b border-zinc-800/60 flex items-center justify-between px-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/80">
                Navegação
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
              {SIDE_NAV_ITEMS.map((item, index) => {
                const Icon = item.icon;
                const isActive =
                  currentTab === item.id ||
                  (item.id === 'categoria-canal-fanit-lin' && currentTab === 'canal');

                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.32,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.05 + index * 0.035,
                    }}
                    onClick={() => handleNavClick(item.id)}
                    title={item.label}
                    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-200 cursor-pointer group ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sideNavActive"
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-400 rounded-r-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}

                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-amber-400'
                      }`}
                    />
                    <span className="text-sm font-bold truncate">{item.label}</span>
                  </motion.button>
                );
              })}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
