import { useSyncExternalStore } from 'react';

const MOBILE_QUERY = '(max-width: 767px)';

function subscribeMobile(listener: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener('change', listener);
  return () => mq.removeEventListener('change', listener);
}

function getIsMobile() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

export function useIsMobile() {
  return useSyncExternalStore(subscribeMobile, getIsMobile, () => false);
}
