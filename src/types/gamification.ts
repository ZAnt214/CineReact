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

export type AchievementRarity = 'comum' | 'raro' | 'épico' | 'lendário';

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
}

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
  unlockedCosmetics: string[];
  equippedCosmetics: EquippedCosmetics;
  missionProgress: Record<string, number>;
  completedMissions: Record<string, string>;
  stats: GamificationStats;
  earlyAccess: boolean;
  featuredInfluencer: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface CosmeticItem {
  id: string;
  name: string;
  description: string;
  type: 'frame' | 'title' | 'badge' | 'theme' | 'effect';
  cost: number;
  rarity: AchievementRarity;
  previewClass?: string;
}

export interface GamificationReward {
  xp: number;
  spotlight: number;
  achievements: AchievementDefinition[];
  levelUp?: LevelDefinition;
  streakBonus?: number;
  message?: string;
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
  cosmetics: CosmeticItem[];
  rankPositions: Partial<Record<LeaderboardType, number>>;
}
