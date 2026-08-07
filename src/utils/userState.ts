import type { UserAccount, UserState } from '../types.ts';
import { sanitizeSocialLinks } from './socialLinks.ts';
import { getAccountRestriction, isMasterAdminUser } from './platformEnforcement.ts';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120';

/** Remove credenciais e segredos antes de expor registros de usuário em APIs admin. */
export function sanitizeUsuario(user: UserAccount | null | undefined): Omit<UserAccount, 'password' | 'twoFactorSecretEnc'> | null {
  if (!user) return null;
  const { password: _pw, twoFactorSecretEnc: _tfa, ...safe } = user;
  return safe;
}

export function serializeUserState(user: UserAccount, overrides: Partial<UserState> = {}): UserState {
  const restriction = getAccountRestriction(user);
  const { isAdmin: overrideAdmin, ...restOverrides } = overrides;
  const isAdmin =
    overrideAdmin ??
    (user.isAdmin || user.role === 'admin' || isMasterAdminUser(user));
  return {
    isLoggedIn: true,
    nome: user.username,
    email: user.email,
    avatar: user.avatar || DEFAULT_AVATAR,
    isAdmin,
    isDonor: user.isDonor || false,
    isBanned: !!user.isBanned,
    isSuspended: !!user.isSuspended,
    suspendedUntil: user.suspendedUntil,
    accountBlocked: restriction.blocked,
    accountBlockMessage: restriction.message || undefined,
    continueWatching: user.continueWatching || [],
    descricao: user.descricao || '',
    socialLinks: sanitizeSocialLinks(user.socialLinks),
    ...restOverrides,
  };
}
