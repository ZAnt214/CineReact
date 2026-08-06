import type { StaffRole } from '../types/admin.ts';
import type { AdminSection } from './types.ts';
import { isVerifiedCreatorLoadout } from '../gamification/verifiedCreator.ts';
import { migrateProfile } from '../gamification/rewardsEngine.ts';
import { localDb } from '../db/local_db.ts';
import type { UserAccount } from '../types.ts';
import type { AuthUser } from './types.ts';
import { isMasterAdminUser } from '../utils/platformEnforcement.ts';

const ROLE_RANK: Record<StaffRole, number> = {
  user: 0,
  moderator: 1,
  curator: 2,
  admin: 3,
};

export function resolveStaffRole(user: UserAccount): StaffRole {
  if (user.isAdmin || isMasterAdminUser(user)) return 'admin';
  if (user.role === 'moderator' || user.role === 'curator' || user.role === 'admin') {
    return user.role;
  }
  return 'user';
}

export function isVerifiedCreator(user: UserAccount): boolean {
  const profile = migrateProfile(localDb.getGamificationProfile(user.email));
  return isVerifiedCreatorLoadout(profile.loadout);
}

export function toAuthUser(user: UserAccount): AuthUser {
  const role = resolveStaffRole(user);
  return {
    id: user.id,
    email: user.email.toLowerCase(),
    username: user.username,
    role,
    isAdmin: role === 'admin',
    isDonor: !!user.isDonor,
    isVerifiedCreator: isVerifiedCreator(user),
    account: user,
  };
}

export function hasMinRole(userRole: StaffRole, minRole: StaffRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

export function canAccessSection(role: StaffRole, section: AdminSection): boolean {
  if (role === 'admin') return true;
  if (role === 'moderator') {
    return ['dashboard', 'users', 'moderation', 'security'].includes(section);
  }
  if (role === 'curator') {
    return ['dashboard', 'content', 'moderation'].includes(section);
  }
  return false;
}

export function canAccessAnySection(role: StaffRole, sections: AdminSection[]): boolean {
  return sections.some((section) => canAccessSection(role, section));
}
