import { localDb } from '../db/local_db.ts';
import { DEMO_CREATOR_AVATAR, DEMO_CREATOR_EMAIL, DEMO_CREATOR_NAME } from '../constants/demoCreator.ts';
import {
  CREATOR_PROGRAM_ART_ITEM_IDS,
  VERIFIED_PROFILE_BADGE_ID,
} from '../data/rewardsCatalog.ts';
import { migrateProfile } from './rewardsEngine.ts';
import type { GamificationProfile } from '../types/gamification.ts';
import type { UserAccount } from '../types.ts';

export { DEMO_CREATOR_EMAIL };
export const DEMO_CREATOR_ID = 'demo-creator-luna-atelie';

const DEMO_AVATAR = DEMO_CREATOR_AVATAR;

const DEMO_SOCIAL_LINKS = {
  instagram: 'https://instagram.com/cinereact',
  youtube: 'https://youtube.com/@cinereact',
  x: 'https://x.com/cinereact',
  twitch: 'https://twitch.tv/cinereact',
};

function buildDemoGamificationProfile(): GamificationProfile {
  const now = new Date().toISOString();
  const profile: GamificationProfile = {
    email: DEMO_CREATOR_EMAIL,
    xp: 12500,
    spotlight: 500,
    influenceIndex: 980,
    currentStreak: 42,
    longestStreak: 42,
    lastActiveDate: now.slice(0, 10),
    unlockedAchievements: [],
    unlockedSeals: [],
    inventory: CREATOR_PROGRAM_ART_ITEM_IDS.map((itemId) => ({
      itemId,
      unlockedAt: now,
      unlockMethod: 'creator_program_art',
    })),
    loadout: {
      theme: 'theme-atelie-visionario',
      frame: 'frame-atelie-visionario',
      title: 'title-artista-oficial',
      avatar: 'avatar-atelie-visionario',
      badges: [VERIFIED_PROFILE_BADGE_ID, 'badge-atelie-visionario'],
      tags: [],
    },
    redeemedCodes: ['ATELIEVISION'],
    missionProgress: {},
    completedMissions: {},
    stats: {
      commentsCount: 128,
      reactsWatched: 340,
      creatorsDiscovered: [],
      listsCreated: 6,
      sharesCount: 24,
      totalWatchTimeMinutes: 4200,
      creatorWatchCounts: {},
      watchedReacts: {},
      commentLikesReceived: 56,
      listEngagement: 12,
    },
    earlyAccess: true,
    featuredInfluencer: true,
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
    avatar: DEMO_AVATAR,
    isAdmin: false,
    isDonor: false,
    continueWatching: [],
    descricao:
      'Perfil demonstrativo de criador verificado oficial. Use este exemplo para ver como ficam bio, cosméticos Ateliê Visionário e redes sociais após a verificação na plataforma.',
    socialLinks: { ...DEMO_SOCIAL_LINKS },
  };

  if (!existing) {
    const usuarios = localDb.getUsuarios();
    usuarios.push(demoUser);
    localDb.replaceUsuarios(usuarios);
  } else {
    localDb.updateUsuarioSync(DEMO_CREATOR_EMAIL, {
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
