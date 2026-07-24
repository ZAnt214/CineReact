import {
  ACHIEVEMENTS,
  DAILY_MISSION_TEMPLATES,
  FRANCHISE_SEALS,
  LEVELS,
  STREAK_SPOTLIGHT,
  WEEKLY_MISSION_TEMPLATES,
  XP_REWARDS,
  getNextTier,
  getTierFromXp,
  getXpProgress,
} from '../data/gamification.ts';
import { REWARDS_CATALOG } from '../data/rewardsCatalog.ts';
import {
  buildInventoryView,
  migrateProfile,
  purchaseReward,
  unlockReward,
  incrementCreatorWatch,
  checkCreatorFollowReward,
} from './rewardsEngine.ts';
import type {
  AchievementDefinition,
  GamificationEventType,
  GamificationProfile,
  GamificationReward,
  GamificationStats,
  LeaderboardEntry,
  LeaderboardType,
  MissionDefinition,
} from '../types/gamification.ts';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekKey(): string {
  const d = new Date();
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

function createDefaultStats(): GamificationStats {
  return {
    totalWatchTimeMinutes: 0,
    reactsWatched: 0,
    commentsCount: 0,
    favoritesCount: 0,
    ratingsCount: 0,
    listsCreated: 0,
    sharesCount: 0,
    creatorsDiscovered: [],
    categoriesWatched: {},
    franchisesWatched: {},
    watchedReacts: {},
    commentLikesReceived: 0,
    listEngagement: 0,
  };
}

export function createDefaultProfile(email: string): GamificationProfile {
  const now = new Date().toISOString();
  return {
    email,
    xp: 0,
    spotlight: 50,
    influenceIndex: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    unlockedAchievements: [],
    unlockedSeals: [],
    inventory: [{ itemId: 'frame-amber', unlockedAt: now, unlockMethod: 'default' }],
    loadout: { tags: [], badges: [] },
    redeemedCodes: [],
    missionProgress: {},
    completedMissions: {},
    stats: createDefaultStats(),
    earlyAccess: false,
    featuredInfluencer: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function computeInfluence(profile: GamificationProfile): number {
  const s = profile.stats;
  const score =
    s.commentsCount * 8 +
    s.commentLikesReceived * 3 +
    s.reactsWatched * 4 +
    s.creatorsDiscovered.length * 15 +
    s.listsCreated * 12 +
    s.sharesCount * 5 +
    profile.currentStreak * 2 +
    Math.floor(s.totalWatchTimeMinutes / 10);
  return Math.round(score);
}

function hashEmailToSeed(email: string, salt: string): number {
  let h = 0;
  const str = email + salt;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function getMissionsForUser(email: string): { daily: MissionDefinition[]; weekly: MissionDefinition[] } {
  const day = todayKey();
  const week = weekKey();
  const dailySeed = hashEmailToSeed(email, day);
  const weeklySeed = hashEmailToSeed(email, week);

  const daily: MissionDefinition[] = [];
  const used = new Set<number>();
  for (let i = 0; i < 3; i++) {
    const idx = (dailySeed + i * 7) % DAILY_MISSION_TEMPLATES.length;
    if (!used.has(idx)) {
      used.add(idx);
      const t = DAILY_MISSION_TEMPLATES[idx];
      daily.push({ ...t, id: `daily-${day}-${t.eventType}-${idx}` });
    }
  }

  const weekly: MissionDefinition[] = [];
  const usedW = new Set<number>();
  for (let i = 0; i < 2; i++) {
    const idx = (weeklySeed + i * 11) % WEEKLY_MISSION_TEMPLATES.length;
    if (!usedW.has(idx)) {
      usedW.add(idx);
      const t = WEEKLY_MISSION_TEMPLATES[idx];
      weekly.push({ ...t, id: `weekly-${week}-${t.eventType}-${idx}` });
    }
  }

  return { daily, weekly };
}

function updateStreak(profile: GamificationProfile): GamificationReward {
  const reward: GamificationReward = { xp: 0, spotlight: 0, achievements: [] };
  const today = todayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (profile.lastActiveDate === today) return reward;

  if (profile.lastActiveDate === yesterdayKey) {
    profile.currentStreak += 1;
  } else if (profile.lastActiveDate && profile.lastActiveDate !== today) {
    profile.currentStreak = 1;
  } else {
    profile.currentStreak = 1;
  }

  profile.longestStreak = Math.max(profile.longestStreak, profile.currentStreak);
  profile.lastActiveDate = today;

  const streakBonus = STREAK_SPOTLIGHT[profile.currentStreak];
  if (streakBonus) {
    profile.spotlight += streakBonus;
    reward.spotlight += streakBonus;
    reward.streakBonus = streakBonus;
    reward.message = `Sequência de ${profile.currentStreak} dias! +${streakBonus} Spotlight`;
    if (profile.currentStreak >= 30) unlockReward(profile, 'badge-streak-30', 'streak');
  }

  return reward;
}

function unlockAchievement(profile: GamificationProfile, id: string): AchievementDefinition | null {
  if (profile.unlockedAchievements.includes(id)) return null;
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  if (!def) return null;
  profile.unlockedAchievements.push(id);
  profile.xp += def.xpReward;
  profile.spotlight += def.spotlightReward;
  return def;
}

function checkAchievements(profile: GamificationProfile): AchievementDefinition[] {
  const unlocked: AchievementDefinition[] = [];
  const s = profile.stats;
  const tier = getTierFromXp(profile.xp).tier;

  const checks: [string, boolean][] = [
    ['first-watch', s.reactsWatched >= 1],
    ['watch-10', s.reactsWatched >= 10],
    ['watch-50', s.reactsWatched >= 50],
    ['watch-100', s.reactsWatched >= 100],
    ['watch-500', s.reactsWatched >= 500],
    ['first-comment', s.commentsCount >= 1],
    ['comments-25', s.commentsCount >= 25],
    ['comments-100', s.commentsCount >= 100],
    ['first-favorite', s.favoritesCount >= 1],
    ['favorites-20', s.favoritesCount >= 20],
    ['first-list', s.listsCreated >= 1],
    ['lists-5', s.listsCreated >= 5],
    ['streak-3', profile.currentStreak >= 3],
    ['streak-7', profile.currentStreak >= 7],
    ['streak-30', profile.currentStreak >= 30],
    ['streak-100', profile.currentStreak >= 100],
    ['discover-1', s.creatorsDiscovered.length >= 1],
    ['discover-10', s.creatorsDiscovered.length >= 10],
    ['discover-25', s.creatorsDiscovered.length >= 25],
    ['category-filme', (s.categoriesWatched['filme'] || 0) >= 5],
    ['category-anime', (s.categoriesWatched['anime'] || 0) >= 5],
    ['category-jogo', (s.categoriesWatched['jogo'] || 0) >= 5],
    ['category-serie', (s.categoriesWatched['serie'] || 0) >= 5],
    ['watch-time-60', s.totalWatchTimeMinutes >= 60],
    ['watch-time-600', s.totalWatchTimeMinutes >= 600],
    ['watch-time-3000', s.totalWatchTimeMinutes >= 3000],
    ['share-5', s.sharesCount >= 5],
    ['rate-10', s.ratingsCount >= 10],
    ['influence-100', profile.influenceIndex >= 100],
    ['influence-500', profile.influenceIndex >= 500],
    ['influence-1000', profile.influenceIndex >= 1000],
    ['seal-collector', profile.unlockedSeals.length >= 5],
    ['seal-master', profile.unlockedSeals.length >= FRANCHISE_SEALS.length],
    ['tier-influenciador', ['Influenciador', 'Ícone', 'Lenda', 'Elite CineReact'].includes(tier)],
    ['tier-elite', tier === 'Elite CineReact'],
  ];

  for (const [id, cond] of checks) {
    if (cond) {
      const a = unlockAchievement(profile, id);
      if (a) unlocked.push(a);
    }
  }

  return unlocked;
}

function checkLevelRewards(profile: GamificationProfile, prevXp: number): GamificationReward {
  const reward: GamificationReward = { xp: 0, spotlight: 0, achievements: [] };
  const prevTier = getTierFromXp(prevXp);
  const newTier = getTierFromXp(profile.xp);
  if (newTier.tier !== prevTier.tier) {
    reward.levelUp = newTier;
    reward.spotlight += newTier.rewardSpotlight;
    profile.spotlight += newTier.rewardSpotlight;
    if (newTier.unlockCosmetic) {
      const item = unlockReward(profile, newTier.unlockCosmetic, 'level', newTier.tier);
      if (item) reward.message = `Desbloqueado: ${item.name}`;
    }
    if (['Influenciador', 'Ícone', 'Lenda', 'Elite CineReact'].includes(newTier.tier)) {
      profile.featuredInfluencer = true;
    }
    if (['Ícone', 'Lenda', 'Elite CineReact'].includes(newTier.tier)) {
      profile.earlyAccess = true;
    }
  }
  return reward;
}

function updateMissions(
  profile: GamificationProfile,
  eventType: GamificationEventType,
  amount = 1
): GamificationReward {
  const reward: GamificationReward = { xp: 0, spotlight: 0, achievements: [] };
  const { daily, weekly } = getMissionsForUser(profile.email);
  const all = [...daily, ...weekly];

  for (const mission of all) {
    if (mission.eventType !== eventType) continue;
    if (profile.completedMissions[mission.id]) continue;

    const current = profile.missionProgress[mission.id] || 0;
    const next = Math.min(mission.target, current + amount);
    profile.missionProgress[mission.id] = next;

    if (next >= mission.target) {
      profile.completedMissions[mission.id] = new Date().toISOString();
      profile.xp += mission.xpReward;
      profile.spotlight += mission.spotlightReward;
      reward.xp += mission.xpReward;
      reward.spotlight += mission.spotlightReward;
      reward.message = `Missão concluída: ${mission.title}`;
    }
  }

  return reward;
}

function checkFranchiseSeals(profile: GamificationProfile, franchiseId: string): string[] {
  const unlocked: string[] = [];
  const count = profile.stats.franchisesWatched[franchiseId] || 0;
  for (const seal of FRANCHISE_SEALS) {
    if (seal.franchiseId !== franchiseId) continue;
    if (count >= seal.requiredWatches && !profile.unlockedSeals.includes(seal.id)) {
      profile.unlockedSeals.push(seal.id);
      profile.spotlight += 30;
      unlocked.push(seal.id);
    }
  }
  return unlocked;
}

export interface ProcessEventMeta {
  reactId?: string;
  obraId?: string;
  progress?: number;
  durationMinutes?: number;
  category?: string;
  franchiseId?: string;
  creatorName?: string;
  creatorId?: string;
  nota?: number;
}

export function processGamificationEvent(
  profile: GamificationProfile,
  eventType: GamificationEventType,
  meta: ProcessEventMeta = {}
): GamificationReward {
  const prevXp = profile.xp;
  const reward: GamificationReward = { xp: 0, spotlight: 0, achievements: [] };

  if (eventType === 'daily_login') {
    const today = todayKey();
    if (profile.lastActiveDate === today) {
      return reward;
    }
    const streakReward = updateStreak(profile);
    reward.spotlight += streakReward.spotlight;
    reward.streakBonus = streakReward.streakBonus;
    if (streakReward.message) reward.message = streakReward.message;
    const baseXp = XP_REWARDS.daily_login;
    profile.xp += baseXp;
    reward.xp += baseXp;
  }

  if (eventType === 'watch_progress' && meta.reactId && meta.progress !== undefined) {
    const existing = profile.stats.watchedReacts[meta.reactId] || { progress: 0, completed: false };
    if (meta.progress > existing.progress) {
      profile.stats.watchedReacts[meta.reactId] = {
        progress: meta.progress,
        completed: existing.completed || meta.progress >= 95,
      };
      if (meta.progress >= 50 && existing.progress < 50) {
        const xp = XP_REWARDS.watch_progress;
        profile.xp += xp;
        reward.xp += xp;
      }
    }
    if (meta.durationMinutes) {
      const added = Math.max(0, meta.durationMinutes);
      profile.stats.totalWatchTimeMinutes += added;
    }
  }

  if (eventType === 'watch_complete' && meta.reactId) {
    const existing = profile.stats.watchedReacts[meta.reactId];
    if (!existing?.completed) {
      profile.stats.watchedReacts[meta.reactId] = { progress: 100, completed: true };
      profile.stats.reactsWatched += 1;
      const xp = XP_REWARDS.watch_complete;
      profile.xp += xp;
      reward.xp += xp;

      if (meta.category) {
        profile.stats.categoriesWatched[meta.category] =
          (profile.stats.categoriesWatched[meta.category] || 0) + 1;
      }
      if (meta.franchiseId) {
        profile.stats.franchisesWatched[meta.franchiseId] =
          (profile.stats.franchisesWatched[meta.franchiseId] || 0) + 1;
        checkFranchiseSeals(profile, meta.franchiseId);
      }
      if (meta.creatorName && !profile.stats.creatorsDiscovered.includes(meta.creatorName)) {
        profile.stats.creatorsDiscovered.push(meta.creatorName);
        const discoverXp = XP_REWARDS.discover_creator;
        profile.xp += discoverXp;
        reward.xp += discoverXp;
        const discoverMission = updateMissions(profile, 'discover_creator');
        reward.xp += discoverMission.xp;
        reward.spotlight += discoverMission.spotlight;
      }
      if (meta.creatorId) {
        const items = incrementCreatorWatch(profile, meta.creatorId);
        if (items.length) {
          reward.unlockedItems = [...(reward.unlockedItems || []), ...items];
        }
      }
      const missionReward = updateMissions(profile, 'watch_complete');
      reward.xp += missionReward.xp;
      reward.spotlight += missionReward.spotlight;
    }
  }

  if (eventType === 'comment') {
    profile.stats.commentsCount += 1;
    const xp = XP_REWARDS.comment;
    profile.xp += xp;
    reward.xp += xp;
    const m = updateMissions(profile, 'comment');
    reward.xp += m.xp;
    reward.spotlight += m.spotlight;
  }

  if (eventType === 'favorite') {
    profile.stats.favoritesCount += 1;
    const xp = XP_REWARDS.favorite;
    profile.xp += xp;
    reward.xp += xp;
    const m = updateMissions(profile, 'favorite');
    reward.xp += m.xp;
    reward.spotlight += m.spotlight;
  }

  if (eventType === 'rate') {
    profile.stats.ratingsCount += 1;
    const xp = XP_REWARDS.rate;
    profile.xp += xp;
    reward.xp += xp;
    const m = updateMissions(profile, 'rate');
    reward.xp += m.xp;
    reward.spotlight += m.spotlight;
  }

  if (eventType === 'list_create') {
    profile.stats.listsCreated += 1;
    const xp = XP_REWARDS.list_create;
    profile.xp += xp;
    reward.xp += xp;
    const m = updateMissions(profile, 'list_create');
    reward.xp += m.xp;
    reward.spotlight += m.spotlight;
  }

  if (eventType === 'share') {
    profile.stats.sharesCount += 1;
    const xp = XP_REWARDS.share;
    profile.xp += xp;
    reward.xp += xp;
    const m = updateMissions(profile, 'share');
    reward.xp += m.xp;
    reward.spotlight += m.spotlight;
  }

  if (eventType === 'follow_creator' && meta.creatorName) {
    if (!profile.stats.creatorsDiscovered.includes(meta.creatorName)) {
      profile.stats.creatorsDiscovered.push(meta.creatorName);
    }
    const xp = XP_REWARDS.follow_creator;
    profile.xp += xp;
    reward.xp += xp;
    if (meta.creatorId) {
      const tag = checkCreatorFollowReward(profile, meta.creatorId);
      if (tag) reward.unlockedItems = [...(reward.unlockedItems || []), tag];
    }
  }

  if (eventType === 'discover_creator' && meta.creatorName) {
    if (!profile.stats.creatorsDiscovered.includes(meta.creatorName)) {
      profile.stats.creatorsDiscovered.push(meta.creatorName);
      const xp = XP_REWARDS.discover_creator;
      profile.xp += xp;
      reward.xp += xp;
      const m = updateMissions(profile, 'discover_creator');
      reward.xp += m.xp;
      reward.spotlight += m.spotlight;
    }
  }

  if (eventType === 'lunch_pick') {
    profile.stats.sharesCount += 0;
    const lunchCount = (profile.missionProgress['lunch-total'] || 0) + 1;
    profile.missionProgress['lunch-total'] = lunchCount;
    const xp = XP_REWARDS.lunch_pick;
    profile.xp += xp;
    reward.xp += xp;
    if (lunchCount >= 10) unlockAchievement(profile, 'lunch-10');
  }

  profile.influenceIndex = computeInfluence(profile);
  const levelReward = checkLevelRewards(profile, prevXp);
  if (levelReward.levelUp) reward.levelUp = levelReward.levelUp;
  reward.spotlight += levelReward.spotlight;

  const newAchievements = checkAchievements(profile);
  reward.achievements.push(...newAchievements);
  for (const a of newAchievements) {
    reward.xp += 0;
    reward.spotlight += a.spotlightReward;
  }

  profile.updatedAt = new Date().toISOString();
  return reward;
}

export function spendSpotlight(profile: GamificationProfile, cosmeticId: string): { success: boolean; error?: string } {
  migrateProfile(profile);
  const result = purchaseReward(profile, cosmeticId);
  return { success: result.success, error: result.error };
}

export function buildLeaderboard(
  profiles: GamificationProfile[],
  usernames: Record<string, { username: string; avatar?: string }>,
  type: LeaderboardType,
  limit = 20
): LeaderboardEntry[] {
  const sorted = [...profiles].sort((a, b) => {
    switch (type) {
      case 'xp':
        return b.xp - a.xp;
      case 'influence':
        return b.influenceIndex - a.influenceIndex;
      case 'streak':
        return b.currentStreak - a.currentStreak;
      case 'watch_time':
        return b.stats.totalWatchTimeMinutes - a.stats.totalWatchTimeMinutes;
      case 'comments':
        return b.stats.commentsCount - a.stats.commentsCount;
      case 'discoverers':
        return b.stats.creatorsDiscovered.length - a.stats.creatorsDiscovered.length;
      case 'curators':
        return b.stats.listsCreated - a.stats.listsCreated;
      default:
        return b.xp - a.xp;
    }
  });

  return sorted.slice(0, limit).map((p, i) => {
    const user = usernames[p.email.toLowerCase()] || { username: p.email.split('@')[0] };
    return {
      rank: i + 1,
      email: p.email,
      username: user.username,
      avatar: user.avatar,
      value: getLeaderboardValue(p, type),
      tier: getTierFromXp(p.xp).tier,
      influenceIndex: p.influenceIndex,
      isInfluencer: p.featuredInfluencer,
    };
  });
}

function getLeaderboardValue(profile: GamificationProfile, type: LeaderboardType): number {
  switch (type) {
    case 'xp':
      return profile.xp;
    case 'influence':
      return profile.influenceIndex;
    case 'streak':
      return profile.currentStreak;
    case 'watch_time':
      return profile.stats.totalWatchTimeMinutes;
    case 'comments':
      return profile.stats.commentsCount;
    case 'discoverers':
      return profile.stats.creatorsDiscovered.length;
    case 'curators':
      return profile.stats.listsCreated;
    default:
      return profile.xp;
  }
}

export function getUserRank(
  profiles: GamificationProfile[],
  email: string,
  type: LeaderboardType
): number {
  const board = buildLeaderboard(profiles, {}, type, profiles.length);
  const idx = board.findIndex((e) => e.email.toLowerCase() === email.toLowerCase());
  return idx >= 0 ? idx + 1 : 0;
}

export function enrichProfileResponse(profile: GamificationProfile) {
  migrateProfile(profile);
  const tier = getTierFromXp(profile.xp);
  const next = getNextTier(profile.xp);
  const progress = getXpProgress(profile.xp);
  const { daily, weekly } = getMissionsForUser(profile.email);
  const allProfiles = [profile];

  return {
    profile,
    tier: tier.tier,
    nextTier: next?.tier,
    xpToNext: next ? next.minXp - profile.xp : 0,
    xpProgress: progress.percent,
    dailyMissions: daily,
    weeklyMissions: weekly,
    achievements: ACHIEVEMENTS,
    seals: FRANCHISE_SEALS,
    rewardsCatalog: REWARDS_CATALOG,
    inventory: buildInventoryView(profile),
    cosmetics: REWARDS_CATALOG.filter((r) => r.cost >= 0 && r.unlockMethod === 'shop').map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      type: r.category as 'frame' | 'title' | 'badge' | 'theme' | 'effect',
      cost: r.cost,
      rarity: (['comum', 'raro', 'épico', 'lendário'].includes(r.rarity) ? r.rarity : 'épico') as 'comum' | 'raro' | 'épico' | 'lendário',
      previewClass: r.previewClass,
    })),
    rankPositions: {
      xp: getUserRank(allProfiles, profile.email, 'xp'),
      influence: getUserRank(allProfiles, profile.email, 'influence'),
      streak: getUserRank(allProfiles, profile.email, 'streak'),
    } as Partial<Record<LeaderboardType, number>>,
  };
}

export { getTierFromXp, getXpProgress, getNextTier, LEVELS, ACHIEVEMENTS, FRANCHISE_SEALS };
