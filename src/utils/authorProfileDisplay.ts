import type { PublicProfileDisplay } from '../types/gamification.ts';
import type { PublicUserProfile } from '../types.ts';

export interface AuthorProfileFields {
  avatar?: string;
  isDonor?: boolean;
  profileDisplay?: PublicProfileDisplay;
  publicProfile?: PublicUserProfile;
}

/** Resolve exibição pública do autor — sempre prioriza dados do servidor, nunca o loadout do visualizador. */
export function resolveAuthorProfileProps(author: AuthorProfileFields) {
  const profileDisplay = author.publicProfile?.profileDisplay ?? author.profileDisplay ?? null;
  const isDonor = !!(author.publicProfile?.isDonor ?? author.isDonor);

  return {
    profileDisplay,
    isDonor,
    isVerifiedCreator: !!author.publicProfile?.isVerifiedCreator,
    avatar: author.avatar ?? author.publicProfile?.avatar,
  };
}
