import React from 'react';
import { Menu } from 'lucide-react';
import { useSideNavStore } from '../hooks/useSideNavStore.ts';

interface SideNavToggleButtonProps {
  visible: boolean;
}

export default function SideNavToggleButton({ visible }: SideNavToggleButtonProps) {
  const { isSideNavOpen, toggleSideNav } = useSideNavStore();

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={toggleSideNav}
      className={`p-2 rounded-xl border transition-all cursor-pointer ${
        isSideNavOpen
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
      }`}
      aria-label={isSideNavOpen ? 'Fechar menu' : 'Abrir menu'}
      aria-expanded={isSideNavOpen}
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
