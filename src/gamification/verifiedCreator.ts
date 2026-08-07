import { VERIFIED_PROFILE_BADGE_ID } from '../data/rewardsCatalog.ts';
import type { ProfileLoadout } from '../types/gamification.ts';

export function isVerifiedCreatorLoadout(loadout?: ProfileLoadout | null): boolean {
  return loadout?.badges?.includes(VERIFIED_PROFILE_BADGE_ID) ?? false;
}
