import { localDb } from '../db/local_db.ts';
import {
  DEMO_CREATOR_AVATAR,
  DEMO_CREATOR_EMAIL,
  DEMO_CREATOR_HANDLE,
  DEMO_CREATOR_NAME,
} from '../constants/demoCreator.ts';
import { VERIFIED_PROFILE_BADGE_ID } from '../data/rewardsCatalog.ts';
import { migrateProfile } from './rewardsEngine.ts';
import type { GamificationProfile } from '../types/gamification.ts';
import type { UserAccount } from '../types.ts';

export { DEMO_CREATOR_EMAIL };
export const DEMO_CREATOR_ID = 'demo-creator-pedro-no-sofa';

const DEMO_SOCIAL_LINKS = {
  youtube: `https://youtube.com/@${DEMO_CREATOR_HANDLE}`,
  instagram: `https://instagram.com/${DEMO_CREATOR_HANDLE}`,
  twitch: `https://twitch.tv/${DEMO_CREATOR_HANDLE}`,
};

function buildDemoGamificationProfile(): GamificationProfile {
  const now = new Date().toISOString();
  const profile: GamificationProfile = {
    email: DEMO_CREATOR_EMAIL,
    xp: 2840,
    spotlight: 127,
    influenceIndex: 312,
    currentStreak: 11,
    longestStreak: 19,
    lastActiveDate: now.slice(0, 10),
    unlockedAchievements: [],
    unlockedSeals: [],
    inventory: [
      {
        itemId: VERIFIED_PROFILE_BADGE_ID,
        unlockedAt: now,
        unlockMethod: 'creator_verified',
      },
      {
        itemId: 'frame-amber',
        unlockedAt: now,
        unlockMethod: 'shop',
      },
      {
        itemId: 'title-comentarista',
        unlockedAt: now,
        unlockMethod: 'achievement',
      },
    ],
    loadout: {
      theme: 'theme-midnight',
      frame: 'frame-amber',
      title: 'title-comentarista',
      avatar: '',
      badges: [VERIFIED_PROFILE_BADGE_ID],
      tags: [],
    },
    redeemedCodes: [],
    missionProgress: {},
    completedMissions: {},
    stats: {
      commentsCount: 47,
      reactsWatched: 186,
      creatorsDiscovered: [],
      listsCreated: 3,
      sharesCount: 9,
      totalWatchTimeMinutes: 1240,
      creatorWatchCounts: {},
      watchedReacts: {},
      commentLikesReceived: 18,
      listEngagement: 4,
    },
    earlyAccess: false,
    featuredInfluencer: false,
    createdAt: now,
    updatedAt: now,
  };

  migrateProfile(profile);
  return profile;
}

export function ensureDemoCreatorProfile(): void {
  const existing = localDb.findUsuarioByEmailSync(DEMO_CREATOR_EMAIL);
  const demoUser: UserAccount = {
    id: DEMO_CREATOR_ID,
    email: DEMO_CREATOR_EMAIL,
    username: DEMO_CREATOR_NAME,
    password: 'demo-not-login',
    createdAt: existing?.createdAt || new Date().toISOString(),
    avatar: DEMO_CREATOR_AVATAR,
    isAdmin: false,
    isDonor: false,
    continueWatching: [],
    descricao:
      'Reagindo a filme, série e gameplay desde 2019. Spoiler: eu pauso pra comentar tudo. Canal verificado na CineReact.',
    socialLinks: { ...DEMO_SOCIAL_LINKS },
  };

  if (!existing) {
    const usuarios = localDb.getUsuarios();
    usuarios.push(demoUser);
    localDb.replaceUsuarios(usuarios);
  } else {
    localDb.updateUsuarioSync(DEMO_CREATOR_EMAIL, {
      id: DEMO_CREATOR_ID,
      username: demoUser.username,
      avatar: demoUser.avatar,
      descricao: demoUser.descricao,
      socialLinks: demoUser.socialLinks,
    });
  }

  const profile = buildDemoGamificationProfile();
  localDb.saveGamificationProfile(profile);
}

export function isDemoCreatorEmail(email: string): boolean {
  return email.toLowerCase() === DEMO_CREATOR_EMAIL.toLowerCase();
}
