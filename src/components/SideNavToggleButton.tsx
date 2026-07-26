import React from 'react';
import { Menu } from 'lucide-react';
import { useSideNavStore, sideNavStore } from '../hooks/useSideNavStore.ts';
import { useIsMobile } from '../hooks/useIsMobile.ts';

interface SideNavToggleButtonProps {
  visible: boolean;
}

export default function SideNavToggleButton({ visible }: SideNavToggleButtonProps) {
  const { isSideNavOpen } = useSideNavStore();
  const isMobile = useIsMobile();

  if (!visible) return null;

  const toggle = () => sideNavStore.toggle();

  return (
    <button
      type="button"
      onPointerDown={
        isMobile
          ? (e) => {
              e.preventDefault();
              toggle();
            }
          : undefined
      }
      onClick={isMobile ? undefined : toggle}
      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
        isSideNavOpen
          ? 'bg-cine-accent/10 border-cine-accent/30 text-cine-accent-light'
          : 'bg-neutral-900/60 border-neutral-800 text-zinc-400 hover:text-white hover:border-zinc-700'
      }`}
      aria-label={isSideNavOpen ? 'Fechar menu' : 'Abrir menu'}
      aria-expanded={isSideNavOpen}
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
