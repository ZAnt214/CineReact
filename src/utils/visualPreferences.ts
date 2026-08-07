const BLUR_EFFECTS_KEY = 'cine_react_blur_effects';

export function getBlurEffectsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(BLUR_EFFECTS_KEY) === 'true';
}

export function applyBlurEffects(enabled: boolean): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.blurEffects = enabled ? 'on' : 'off';
}

export function setBlurEffectsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BLUR_EFFECTS_KEY, enabled ? 'true' : 'false');
  applyBlurEffects(enabled);
  window.dispatchEvent(new CustomEvent('cinereact:blur-effects-changed', { detail: { enabled } }));
}

export function initVisualPreferences(): void {
  const enabled = getBlurEffectsEnabled();
  applyBlurEffects(enabled);
}
