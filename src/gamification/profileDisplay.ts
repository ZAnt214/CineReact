import { getRewardById } from '../data/rewardsCatalog.ts';
import { resolveVisualStyle } from '../data/rewardVisualStyles.ts';
import type {
  ProfileLoadout,
  PublicProfileDisplay,
  PublicProfileTag,
  RewardItemDefinition,
  RewardVisualStyle,
} from '../types/gamification.ts';

const DEFAULT_LOADOUT = (): ProfileLoadout => ({
  tags: [],
  badges: [],
});

export function normalizeLoadout(loadout?: ProfileLoadout | null): ProfileLoadout {
  if (!loadout) return DEFAULT_LOADOUT();
  return {
    ...DEFAULT_LOADOUT(),
    ...loadout,
    tags: loadout.tags || [],
    badges: loadout.badges || [],
  };
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
  const effectItem = normalized.effect ? getRewardById(normalized.effect) : null;
  const themeItem = normalized.theme ? getRewardById(normalized.theme) : null;
  const backgroundItem = normalized.background ? getRewardById(normalized.background) : null;
  const cardItem = normalized.profileCard ? getRewardById(normalized.profileCard) : null;

  const tags = normalized.tags
    .map((id) => getRewardById(id))
    .filter((item): item is RewardItemDefinition => !!item)
    .map(resolveTag);

  const frameVisualStyle: RewardVisualStyle | undefined = frameItem
    ? resolveVisualStyle(frameItem)
    : undefined;

  return {
    loadout: normalized,
    frameVisualStyle,
    frameAnimated: frameItem?.animated,
    avatarVisual: avatarItem?.avatarVisual,
    effectAnimated: effectItem?.animated ?? !!effectItem,
    effectVisualStyle: effectItem ? resolveVisualStyle(effectItem) : undefined,
    themeVisualStyle: themeItem ? resolveVisualStyle(themeItem) : undefined,
    backgroundVisualStyle: backgroundItem ? resolveVisualStyle(backgroundItem) : undefined,
    profileCardVisualStyle: cardItem ? resolveVisualStyle(cardItem) : undefined,
    title: titleItem
      ? { id: titleItem.id, name: titleItem.name, rarity: titleItem.rarity }
      : undefined,
    tags,
    badgeIds: [...normalized.badges],
  };
}

export function getPublicProfileDisplayForEmail(
  getLoadout: (email: string) => ProfileLoadout | undefined | null,
  email: string
): PublicProfileDisplay {
  return resolvePublicProfileDisplay(getLoadout(email));
}
