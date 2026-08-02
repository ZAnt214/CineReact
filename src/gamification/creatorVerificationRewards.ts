import { localDb } from '../db/local_db.ts';
import { VERIFIED_PROFILE_BADGE_ID } from '../data/rewardsCatalog.ts';
import { migrateProfile, unlockReward } from './rewardsEngine.ts';
import type { GamificationProfile } from '../types/gamification.ts';

export function grantCreatorVerificationBenefits(email: string, source = 'creator-verification'): GamificationProfile {
  const normalized = email.toLowerCase().trim();
  const profile = migrateProfile(localDb.getGamificationProfile(normalized));

  unlockReward(profile, VERIFIED_PROFILE_BADGE_ID, 'creator_verified', source);
  migrateProfile(profile);

  profile.updatedAt = new Date().toISOString();
  localDb.saveGamificationProfile(profile);
  return profile;
}
