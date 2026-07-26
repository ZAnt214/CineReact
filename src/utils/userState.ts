import type { UserAccount, UserState } from '../types.ts';
import { sanitizeSocialLinks } from './socialLinks.ts';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120';

export function serializeUserState(user: UserAccount, overrides: Partial<UserState> = {}): UserState {
  return {
    isLoggedIn: true,
    nome: user.username,
    email: user.email,
    avatar: user.avatar || DEFAULT_AVATAR,
    isAdmin: user.isAdmin || false,
    isDonor: user.isDonor || false,
    continueWatching: user.continueWatching || [],
    descricao: user.descricao || '',
    socialLinks: sanitizeSocialLinks(user.socialLinks),
    ...overrides,
  };
}
