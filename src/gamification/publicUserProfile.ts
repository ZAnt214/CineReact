import { localDb } from '../db/local_db.ts';
import { CREATOR_FOLLOW_REWARDS, getRewardById, VERIFIED_PROFILE_BADGE_ID } from '../data/rewardsCatalog.ts';
import { resolvePublicProfileDisplay } from './profileDisplay.ts';
import { hasReward, migrateProfile } from './rewardsEngine.ts';
import { isVerifiedCreatorLoadout } from './verifiedCreator.ts';
import type { PublicUserProfile } from '../types.ts';
import { hasSocialLinks, sanitizeSocialLinks } from '../utils/socialLinks.ts';

function getCreatorNameForChannel(canalId: string): string | null {
  const tagId = CREATOR_FOLLOW_REWARDS[canalId];
  if (!tagId) return null;
  return getRewardById(tagId)?.creatorName?.toLowerCase() || null;
}

function userMatchesChannelCreator(email: string, canalId: string): boolean {
  const creatorName = getCreatorNameForChannel(canalId);
  if (!creatorName) return false;

  const profile = migrateProfile(localDb.getGamificationProfile(email));
  if (!hasReward(profile, VERIFIED_PROFILE_BADGE_ID)) return false;

  return profile.inventory.some((entry) => {
    const item = getRewardById(entry.itemId);
    return item?.category === 'tag' && item.creatorName?.toLowerCase() === creatorName;
  });
}

export function findOfficialCreatorEmailForChannel(canalId: string, officialCreatorEmail?: string): string | null {
  if (officialCreatorEmail) {
    const user = localDb.findUsuarioByEmailSync(officialCreatorEmail);
    if (user) {
      const profile = migrateProfile(localDb.getGamificationProfile(user.email));
      if (hasReward(profile, VERIFIED_PROFILE_BADGE_ID)) return user.email;
    }
  }

  for (const user of localDb.getUsuarios()) {
    if (userMatchesChannelCreator(user.email, canalId)) return user.email;
  }

  return null;
}

export function getPublicUserProfile(email: string): PublicUserProfile | null {
  if (!email) return null;

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
