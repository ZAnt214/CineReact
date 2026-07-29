import { localDb } from '../db/local_db.ts';
import { VERIFIED_PROFILE_BADGE_ID } from '../data/rewardsCatalog.ts';
import { resolvePublicProfileDisplay } from './profileDisplay.ts';
import { hasReward, migrateProfile } from './rewardsEngine.ts';
import { isVerifiedCreatorLoadout } from './verifiedCreator.ts';
import { ensureDemoCreatorProfile, isDemoCreatorEmail } from './demoCreator.ts';
import type { PublicUserProfile } from '../types.ts';
import { hasSocialLinks, sanitizeSocialLinks } from '../utils/socialLinks.ts';

export function findOfficialCreatorEmailForChannel(_canalId: string, officialCreatorEmail?: string): string | null {
  if (!officialCreatorEmail) return null;

  const user = localDb.findUsuarioByEmailSync(officialCreatorEmail);
  if (!user) return null;

  const profile = migrateProfile(localDb.getGamificationProfile(user.email));
  if (!hasReward(profile, VERIFIED_PROFILE_BADGE_ID) && !isVerifiedCreatorLoadout(profile.loadout)) {
    return null;
  }

  return user.email;
}

export function getPublicUserProfile(email: string): PublicUserProfile | null {
  if (!email) return null;

  if (isDemoCreatorEmail(email)) {
    ensureDemoCreatorProfile();
  }

  const account = localDb.findUsuarioByEmailSync(email);
  if (!account) return null;

  const gamification = migrateProfile(localDb.getGamificationProfile(email));
  const profileDisplay = resolvePublicProfileDisplay(gamification.loadout);
  const isVerifiedCreator = isVerifiedCreatorLoadout(gamification.loadout);

  const socialLinks = isVerifiedCreator
    ? sanitizeSocialLinks(account.socialLinks)
    : undefined;

  return {
    email: account.email,
    nome: account.username,
    avatar: account.avatar,
    descricao: account.descricao || '',
    socialLinks: hasSocialLinks(socialLinks) ? socialLinks : undefined,
    isVerifiedCreator,
    profileDisplay,
  };
}
