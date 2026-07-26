import { localDb } from '../db/local_db.ts';
import { VERIFIED_PROFILE_BADGE_ID } from '../data/rewardsCatalog.ts';
import { DEMO_CREATOR_EMAIL, ensureDemoCreatorProfile, isDemoCreatorEmail } from './demoCreator.ts';
import { hasReward, migrateProfile } from './rewardsEngine.ts';
import { isVerifiedCreatorLoadout } from './verifiedCreator.ts';

export interface PlatformCreatorListItem {
  email: string;
  nome: string;
  avatar?: string;
  isVerifiedCreator: boolean;
  isDemo?: boolean;
}

export function listPlatformCreators(): PlatformCreatorListItem[] {
  ensureDemoCreatorProfile();

  const items: PlatformCreatorListItem[] = [];
  const seen = new Set<string>();

  for (const user of localDb.getUsuarios()) {
    if (!user.email || seen.has(user.email.toLowerCase())) continue;
    seen.add(user.email.toLowerCase());

    const gamification = migrateProfile(localDb.getGamificationProfile(user.email));
    const isVerifiedCreator =
      isVerifiedCreatorLoadout(gamification.loadout) ||
      hasReward(gamification, VERIFIED_PROFILE_BADGE_ID);

    items.push({
      email: user.email,
      nome: user.username,
      avatar: user.avatar,
      isVerifiedCreator,
      isDemo: isDemoCreatorEmail(user.email),
    });
  }

  items.sort((a, b) => {
    if (a.isDemo) return -1;
    if (b.isDemo) return 1;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });

  if (!items.some((item) => item.isDemo)) {
    const demo = localDb.findUsuarioByEmailSync(DEMO_CREATOR_EMAIL);
    if (demo) {
      items.unshift({
        email: demo.email,
        nome: demo.username,
        avatar: demo.avatar,
        isVerifiedCreator: true,
        isDemo: true,
      });
    }
  }

  return items;
}
