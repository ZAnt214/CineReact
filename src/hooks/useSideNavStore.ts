import { useSyncExternalStore } from 'react';

let isOpen = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export const sideNavStore = {
  getState: () => isOpen,
  open: () => {
    if (isOpen) return;
    isOpen = true;
    emit();
  },
  close: () => {
    if (!isOpen) return;
    isOpen = false;
    emit();
  },
  toggle: () => {
    isOpen = !isOpen;
    emit();
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useSideNavStore() {
  const isSideNavOpen = useSyncExternalStore(
    sideNavStore.subscribe,
    sideNavStore.getState,
    sideNavStore.getState
  );

  return {
    isSideNavOpen,
    openSideNav: sideNavStore.open,
    closeSideNav: sideNavStore.close,
    toggleSideNav: sideNavStore.toggle,
  };
}
