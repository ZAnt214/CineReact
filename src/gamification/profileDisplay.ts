import { getRewardById } from '../data/rewardsCatalog.ts';
import { getVisualStyle, resolveVisualStyle } from '../data/rewardVisualStyles.ts';
import type {
  ProfileLoadout,
  PublicProfileDisplay,
  RewardVisualStyle,
} from '../types/gamification.ts';

const DEFAULT_LOADOUT = (): ProfileLoadout => ({});

const ALLOWED_LOADOUT_KEYS: (keyof ProfileLoadout)[] = [
  'frame', 'title', 'avatar', 'theme', 'reaction', 'emoji',
];

export function sanitizeLoadout(loadout?: ProfileLoadout | null): ProfileLoadout {
  if (!loadout) return DEFAULT_LOADOUT();
  const result: ProfileLoadout = {};
  for (const key of ALLOWED_LOADOUT_KEYS) {
    const val = loadout[key];
    if (typeof val === 'string' && val) result[key] = val;
  }
  return result;
}

export function normalizeLoadout(loadout?: ProfileLoadout | null): ProfileLoadout {
  return sanitizeLoadout(loadout);
}

export function resolvePublicProfileDisplay(loadout?: ProfileLoadout | null): PublicProfileDisplay {
  const normalized = normalizeLoadout(loadout);

  const frameItem = normalized.frame ? getRewardById(normalized.frame) : null;
  const avatarItem = normalized.avatar ? getRewardById(normalized.avatar) : null;
  const titleItem = normalized.title ? getRewardById(normalized.title) : null;
  const themeItem = normalized.theme ? getRewardById(normalized.theme) : null;

  const frameVisualStyle: RewardVisualStyle | undefined = frameItem
    ? resolveVisualStyle(frameItem)
    : undefined;

  const themeVisualStyle = themeItem ? resolveVisualStyle(themeItem) : undefined;
  const themeTone = themeVisualStyle ? getVisualStyle(themeVisualStyle).tone ?? 'dark' : undefined;

  return {
    loadout: normalized,
    frameVisualStyle,
    frameAnimated: frameItem?.animated,
    avatarVisual: avatarItem?.avatarVisual,
    themeVisualStyle,
    themeTone,
    title: titleItem
      ? { id: titleItem.id, name: titleItem.name, rarity: titleItem.rarity }
      : undefined,
  };
}

export function getPublicProfileDisplayForEmail(
  getLoadout: (email: string) => ProfileLoadout | undefined | null,
  email: string
): PublicProfileDisplay {
  return resolvePublicProfileDisplay(getLoadout(email));
}
