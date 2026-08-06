import type { Comentario, ReactVideo, UserAccount } from '../types.ts';

export type AccountBlockCode = 'banned' | 'suspended' | null;

export interface AccountRestriction {
  blocked: boolean;
  code: AccountBlockCode;
  message: string;
}

export const MASTER_EMAIL = 'mateusvini.t10@gmail.com';

export function isMasterAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === MASTER_EMAIL.toLowerCase();
}

export function isMasterAdminUser(user: UserAccount | null | undefined): boolean {
  if (!user) return false;
  return isMasterAdminEmail(user.email) || isMasterAdminEmail(user.providerEmail);
}

export function getAccountRestriction(user: UserAccount | null | undefined): AccountRestriction {
  if (!user) {
    return { blocked: false, code: null, message: '' };
  }

  if (isMasterAdminUser(user)) {
    return { blocked: false, code: null, message: '' };
  }

  if (user.isBanned) {
    return {
      blocked: true,
      code: 'banned',
      message: 'Sua conta foi banida do CineReact. Entre em contato com o suporte se acredita que houve um engano.',
    };
  }

  if (user.isSuspended) {
    const until = user.suspendedUntil ? new Date(user.suspendedUntil) : null;
    if (!until || until.getTime() > Date.now()) {
      const untilLabel = until
        ? ` até ${until.toLocaleString('pt-BR')}`
        : '';
      return {
        blocked: true,
        code: 'suspended',
        message: `Sua conta está suspensa${untilLabel}. Você não pode interagir com a plataforma no momento.`,
      };
    }
  }

  return { blocked: false, code: null, message: '' };
}

export function isReactPubliclyVisible(react: ReactVideo, isAdmin = false): boolean {
  if (isAdmin) return true;
  const status = react.moderationStatus || 'approved';
  if (status === 'hidden' || status === 'rejected') return false;
  if (react.scheduledAt && new Date(react.scheduledAt).getTime() > Date.now()) return false;
  return true;
}

export function isCommentPubliclyVisible(comment: Comentario, isAdmin = false): boolean {
  if (isAdmin) return true;
  const status = comment.moderationStatus || 'approved';
  return status !== 'hidden' && status !== 'rejected';
}

export function containsBlockedWord(text: string, blockedWords: string[]): boolean {
  const normalized = text.toLowerCase();
  return blockedWords.some((word) => {
    const w = word.trim().toLowerCase();
    return w.length > 0 && normalized.includes(w);
  });
}

export function findBlockedWord(text: string, blockedWords: string[]): string | null {
  const normalized = text.toLowerCase();
  for (const word of blockedWords) {
    const w = word.trim().toLowerCase();
    if (w.length > 0 && normalized.includes(w)) return w;
  }
  return null;
}
