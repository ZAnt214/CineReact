export type InfluenceTier =
  | 'Espectador'
  | 'Entusiasta'
  | 'Explorador'
  | 'Crítico'
  | 'Especialista'
  | 'Curador'
  | 'Influenciador'
  | 'Ícone'
  | 'Lenda'
  | 'Elite CineReact';

/** @deprecated use RewardRarity */
export type AchievementRarity = 'comum' | 'raro' | 'épico' | 'lendário';

export type RewardRarity =
  | 'comum'
  | 'incomum'
  | 'raro'
  | 'épico'
  | 'lendário'
  | 'mítico'
  | 'exclusivo';

export type RewardCategory =
  | 'frame'
  | 'tag'
  | 'title'
  | 'avatar'
  | 'badge'
  | 'theme'
  | 'effect'
  | 'background'
  | 'reaction'
  | 'emoji'
  | 'profile_card';

export type UnlockMethod =
  | 'default'
  | 'shop'
  | 'level'
  | 'achievement'
  | 'follow_creator'
  | 'watch_creator'
  | 'seasonal'
  | 'promo_code'
  | 'event'
  | 'streak'
  | 'legacy';

export type RewardVisualStyle =
  | 'amber'
  | 'neon'
  | 'royal'
  | 'rainbow'
  | 'galaxy'
  | 'candy'
  | 'holographic'
  | 'nebula'
  | 'aurora'
  | 'gold'
  | 'midnight'
  | 'cinema'
  | 'ember'
  | 'crystal'
  | 'halloween'
  | 'natal'
  | 'rose'
  | 'forest'
  | 'slate'
  | 'creator';

export type MissionPeriod = 'daily' | 'weekly';

export type LeaderboardType =
  | 'xp'
  | 'influence'
  | 'streak'
  | 'watch_time'
  | 'comments'
  | 'discoverers'
  | 'curators';

export type GamificationEventType =
  | 'daily_login'
  | 'watch_progress'
  | 'watch_complete'
  | 'favorite'
  | 'comment'
  | 'rate'
  | 'list_create'
  | 'share'
  | 'follow_creator'
  | 'discover_creator'
  | 'lunch_pick';

export interface GamificationStats {
  totalWatchTimeMinutes: number;
  reactsWatched: number;
  commentsCount: number;
  favoritesCount: number;
  ratingsCount: number;
  listsCreated: number;
  sharesCount: number;
  creatorsDiscovered: string[];
  categoriesWatched: Record<string, number>;
  franchisesWatched: Record<string, number>;
  watchedReacts: Record<string, { progress: number; completed: boolean }>;
  commentLikesReceived: number;
  listEngagement: number;
  creatorWatchCounts?: Record<string, number>;
}

export interface UnlockedRewardEntry {
  itemId: string;
  unlockedAt: string;
  unlockMethod: UnlockMethod;
  unlockSource?: string;
}

export interface ProfileLoadout {
  frame?: string;
  title?: string;
  avatar?: string;
  theme?: string;
  reaction?: string;
  emoji?: string;
  tags: string[];
  badges: string[];
}

/** @deprecated use ProfileLoadout */
export interface EquippedCosmetics {
  frame?: string;
  title?: string;
  badge?: string;
  theme?: string;
}

export interface GamificationProfile {
  email: string;
  xp: number;
  spotlight: number;
  influenceIndex: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  unlockedAchievements: string[];
  unlockedSeals: string[];
  inventory: UnlockedRewardEntry[];
  loadout: ProfileLoadout;
  redeemedCodes: string[];
  missionProgress: Record<string, number>;
  completedMissions: Record<string, string>;
  stats: GamificationStats;
  earlyAccess: boolean;
  featuredInfluencer: boolean;
  createdAt: string;
  updatedAt: string;
  /** @deprecated migrated to inventory */
  unlockedCosmetics?: string[];
  /** @deprecated migrated to loadout */
  equippedCosmetics?: EquippedCosmetics;
}

export interface LevelDefinition {
  tier: InfluenceTier;
  minXp: number;
  rewardSpotlight: number;
  unlockCosmetic?: string;
  description: string;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  xpReward: number;
  spotlightReward: number;
  rewardItemId?: string;
}

export interface MissionDefinition {
  id: string;
  title: string;
  description: string;
  period: MissionPeriod;
  target: number;
  xpReward: number;
  spotlightReward: number;
  eventType: GamificationEventType;
}

export interface SealDefinition {
  id: string;
  franchiseId: string;
  name: string;
  description: string;
  icon: string;
  requiredWatches: number;
}

export interface RewardItemDefinition {
  id: string;
  name: string;
  description: string;
  category: RewardCategory;
  rarity: RewardRarity;
  cost: number;
  unlockMethod: UnlockMethod;
  obtainHint: string;
  previewClass?: string;
  previewGradient?: string;
  animated?: boolean;
  creatorId?: string;
  creatorName?: string;
  creatorColors?: { from: string; to: string; text: string };
  seasonalEvent?: string;
  limited?: boolean;
  availableUntil?: string;
  emojiChar?: string;
  avatarUrl?: string;
  icon?: string;
  /** Visual premium para avatares cosméticos (substitui emojiChar) */
  avatarVisual?: 'popcorn' | 'clapperboard' | 'crown' | 'ghost' | 'spotlight' | 'legend';
  /** Estilo visual premium do preview (rainbow, galaxy, candy, etc.) */
  visualStyle?: RewardVisualStyle;
}

/** @deprecated use RewardItemDefinition */
export interface CosmeticItem {
  id: string;
  name: string;
  description: string;
  type: 'frame' | 'title' | 'badge' | 'theme' | 'effect';
  cost: number;
  rarity: AchievementRarity;
  previewClass?: string;
}

export interface InventoryItemView extends Omit<RewardItemDefinition, 'unlockMethod'> {
  owned: boolean;
  equipped: boolean;
  unlockedAt?: string;
  unlockMethod?: UnlockMethod;
  unlockSource?: string;
}

export interface GamificationReward {
  xp: number;
  spotlight: number;
  achievements: AchievementDefinition[];
  unlockedItems?: RewardItemDefinition[];
  levelUp?: LevelDefinition;
  streakBonus?: number;
  message?: string;
}

export interface PublicProfileTag {
  id: string;
  name: string;
  creatorName?: string;
  creatorColors?: { from: string; to: string; text: string };
}

/** Cosméticos equipados resolvidos para exibição pública */
export interface PublicProfileDisplay {
  loadout: ProfileLoadout;
  frameVisualStyle?: RewardVisualStyle;
  frameAnimated?: boolean;
  avatarVisual?: RewardItemDefinition['avatarVisual'];
  themeVisualStyle?: RewardVisualStyle;
  themeTone?: 'dark' | 'light';
  title?: { id: string; name: string; rarity: RewardRarity };
  tags: PublicProfileTag[];
  badgeIds: string[];
}

export interface LeaderboardEntry {
  rank: number;
  email: string;
  username: string;
  avatar?: string;
  value: number;
  tier: InfluenceTier;
  influenceIndex: number;
  isInfluencer: boolean;
  profileDisplay?: PublicProfileDisplay;
}

export interface GamificationMeResponse {
  profile: GamificationProfile;
  tier: InfluenceTier;
  nextTier?: InfluenceTier;
  xpToNext: number;
  xpProgress: number;
  dailyMissions: MissionDefinition[];
  weeklyMissions: MissionDefinition[];
  achievements: AchievementDefinition[];
  seals: SealDefinition[];
  rewardsCatalog: RewardItemDefinition[];
  inventory: InventoryItemView[];
  rankPositions: Partial<Record<LeaderboardType, number>>;
  /** @deprecated */
  cosmetics?: CosmeticItem[];
}

export interface PromoCodeDefinition {
  code: string;
  rewardItemId: string;
  maxUses?: number;
  expiresAt?: string;
}

export const ACTIVE_COSMETIC_CATEGORIES = [
  'theme',
  'frame',
  'title',
  'avatar',
  'tag',
  'badge',
  'reaction',
  'emoji',
] as const;

export type ActiveCosmeticCategory = (typeof ACTIVE_COSMETIC_CATEGORIES)[number];

export const LOADOUT_SLOTS: Record<ActiveCosmeticCategory, { max: number; loadoutKey: keyof ProfileLoadout }> = {
  theme: { max: 1, loadoutKey: 'theme' },
  frame: { max: 1, loadoutKey: 'frame' },
  title: { max: 1, loadoutKey: 'title' },
  avatar: { max: 1, loadoutKey: 'avatar' },
  tag: { max: 3, loadoutKey: 'tags' },
  badge: { max: 2, loadoutKey: 'badges' },
  reaction: { max: 1, loadoutKey: 'reaction' },
  emoji: { max: 1, loadoutKey: 'emoji' },
};
