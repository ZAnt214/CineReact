import React, { memo } from 'react';
import { Menu } from 'lucide-react';
import { useSideNavStore, sideNavStore } from '../hooks/useSideNavStore.ts';
import { useIsMobile } from '../hooks/useIsMobile.ts';

interface SideNavToggleButtonProps {
  visible: boolean;
}

function SideNavToggleButton({ visible }: SideNavToggleButtonProps) {
  const { isSideNavOpen } = useSideNavStore();
  const isMobile = useIsMobile();

  if (!visible) return null;

  const toggle = () => sideNavStore.toggle();

  return (
    <button
      type="button"
      onPointerDown={
        isMobile
          ? (event) => {
              event.preventDefault();
              toggle();
            }
          : undefined
      }
      onClick={isMobile ? undefined : toggle}
      className={`side-nav-toggle group ${isSideNavOpen ? 'side-nav-toggle--active' : ''}`}
      aria-label={isSideNavOpen ? 'Fechar menu' : 'Abrir menu'}
      aria-expanded={isSideNavOpen}
      aria-controls="side-nav-panel"
    >
      <span className="side-nav-toggle-glow" aria-hidden="true" />
      <span className="side-nav-toggle-surface">
        <Menu className="side-nav-toggle-icon" strokeWidth={2} />
      </span>
    </button>
  );
}

export default memo(SideNavToggleButton);
