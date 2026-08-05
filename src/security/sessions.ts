import type { Request } from 'express';
import { localDb } from '../db/local_db.ts';
import { generateSecureToken, hashToken } from './crypto.ts';
import { SESSION_IDLE_MS, SESSION_MAX_AGE_MS, type AuthSession } from './types.ts';

export function createSession(
  userId: string,
  userEmail: string,
  req: Request
): { session: AuthSession; token: string } {
  const token = generateSecureToken(48);
  const now = Date.now();
  const session: AuthSession = {
    id: `sess-${now}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    userEmail: userEmail.toLowerCase(),
    tokenHash: hashToken(token),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_MAX_AGE_MS).toISOString(),
    lastActivityAt: new Date(now).toISOString(),
    ip: req.ip,
    userAgent: String(req.headers['user-agent'] || '').slice(0, 500),
    twoFactorVerified: true,
  };
  localDb.saveAuthSession(session);
  return { session, token };
}

export function validateSessionToken(token: string): AuthSession | null {
  const session = localDb.getAuthSessionByTokenHash(hashToken(token));
  if (!session || session.revokedAt) return null;

  const now = Date.now();
  if (new Date(session.expiresAt).getTime() <= now) {
    localDb.revokeAuthSession(session.id);
    return null;
  }

  if (now - new Date(session.lastActivityAt).getTime() > SESSION_IDLE_MS) {
    localDb.revokeAuthSession(session.id);
    return null;
  }

  localDb.touchAuthSession(session.id);
  return session;
}

export function revokeSessionByToken(token: string): void {
  const session = localDb.getAuthSessionByTokenHash(hashToken(token));
  if (session) localDb.revokeAuthSession(session.id);
}

export function revokeAllUserSessions(userEmail: string, exceptSessionId?: string): number {
  return localDb.revokeAuthSessionsForUser(userEmail, exceptSessionId);
}

export function cleanupExpiredSessions(): number {
  return localDb.cleanupAuthSessions();
}
