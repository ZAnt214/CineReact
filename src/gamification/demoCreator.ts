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
export const DEMO_CREATOR_ID = 'demo-creator-lucas-marques';

const DEMO_SOCIAL_LINKS = {
  youtube: `https://youtube.com/@${DEMO_CREATOR_HANDLE}`,
  instagram: `https://instagram.com/${DEMO_CREATOR_HANDLE}`,
  twitch: `https://twitch.tv/${DEMO_CREATOR_HANDLE}`,
};

function buildDemoGamificationProfile(): GamificationProfile {
  const now = new Date().toISOString();
  const profile: GamificationProfile = {
    email: DEMO_CREATOR_EMAIL,
    xp: 3120,
    spotlight: 148,
    influenceIndex: 356,
    currentStreak: 14,
    longestStreak: 22,
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
        itemId: 'frame-neon',
        unlockedAt: now,
        unlockMethod: 'shop',
      },
      {
        itemId: 'title-cinefilo',
        unlockedAt: now,
        unlockMethod: 'achievement',
      },
    ],
    loadout: {
      theme: 'theme-midnight',
      frame: 'frame-neon',
      title: 'title-cinefilo',
      avatar: '',
      badges: [VERIFIED_PROFILE_BADGE_ID],
      tags: [],
    },
    redeemedCodes: [],
    missionProgress: {},
    completedMissions: {},
    stats: {
      commentsCount: 53,
      reactsWatched: 214,
      creatorsDiscovered: [],
      listsCreated: 4,
      sharesCount: 11,
      totalWatchTimeMinutes: 1385,
      creatorWatchCounts: {},
      watchedReacts: {},
      commentLikesReceived: 24,
      listEngagement: 6,
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
      'Reajo a filme e série desde 2019. Pauso pra comentar tudo e esqueço de voltar pro vídeo. Canal verificado na CineReact.',
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
