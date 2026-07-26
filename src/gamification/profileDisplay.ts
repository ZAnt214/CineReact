import { getRewardById, VERIFIED_PROFILE_BADGE_ID } from '../data/rewardsCatalog.ts';
import { getVisualStyle, resolveVisualStyle } from '../data/rewardVisualStyles.ts';
import type {
  ProfileLoadout,
  PublicProfileDisplay,
  PublicProfileTag,
  RewardItemDefinition,
  RewardVisualStyle,
} from '../types/gamification.ts';

const DEFAULT_LOADOUT = (): ProfileLoadout => ({ tags: [], badges: [] });

export function sanitizeLoadout(loadout?: ProfileLoadout | null): ProfileLoadout {
  if (!loadout) return DEFAULT_LOADOUT();
  const result: ProfileLoadout = {
    tags: Array.isArray(loadout.tags) ? [...loadout.tags] : [],
    badges: Array.isArray(loadout.badges) ? [...loadout.badges] : [],
  };
  const singles: (keyof ProfileLoadout)[] = ['frame', 'title', 'avatar', 'theme', 'reaction', 'emoji'];
  for (const key of singles) {
    const val = loadout[key];
    if (typeof val === 'string' && val) (result as Record<string, unknown>)[key] = val;
  }
  return result;
}

export function normalizeLoadout(loadout?: ProfileLoadout | null): ProfileLoadout {
  return sanitizeLoadout(loadout);
}

function resolveTag(item: RewardItemDefinition): PublicProfileTag {
  return {
    id: item.id,
    name: item.name,
    creatorName: item.creatorName,
    creatorColors: item.creatorColors,
  };
}

export function resolvePublicProfileDisplay(loadout?: ProfileLoadout | null): PublicProfileDisplay {
  const normalized = normalizeLoadout(loadout);

  const frameItem = normalized.frame ? getRewardById(normalized.frame) : null;
  const avatarItem = normalized.avatar ? getRewardById(normalized.avatar) : null;
  const titleItem = normalized.title ? getRewardById(normalized.title) : null;
  const themeItem = normalized.theme ? getRewardById(normalized.theme) : null;

  const tags = normalized.tags
    .map((id) => getRewardById(id))
    .filter((item): item is RewardItemDefinition => !!item)
    .map(resolveTag);

  const badges = normalized.badges
    .map((id) => getRewardById(id))
    .filter((item): item is RewardItemDefinition => !!item)
    .map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      rarity: item.rarity,
    }));

  const verifiedBadge = badges.find((b) => b.id === VERIFIED_PROFILE_BADGE_ID);

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
      ? { id: titleItem.id, name: titleItem.name, rarity: titleItem.rarity, description: titleItem.description }
      : undefined,
    tags,
    badges,
    verifiedBadge,
    badgeIds: [...normalized.badges],
  };
}

export function getPublicProfileDisplayForEmail(
  getLoadout: (email: string) => ProfileLoadout | undefined | null,
  email: string
): PublicProfileDisplay {
  return resolvePublicProfileDisplay(getLoadout(email));
}
