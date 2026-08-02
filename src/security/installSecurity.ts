import type { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { localDb } from '../db/local_db.ts';
import { getAccountRestriction } from '../utils/platformEnforcement.ts';
import { serializeUserState } from '../utils/userState.ts';
import {
  SESSION_COOKIE,
  type AuthUser,
  type SecurityContext,
  type AdminSection,
} from './types.ts';
import { validateSessionToken, createSession, revokeSessionByToken, cleanupExpiredSessions } from './sessions.ts';
import { toAuthUser, canAccessAnySection, hasMinRole } from './rbac.ts';
import { writeAuditLog, writeFinancialAuditLog, getClientIp } from './audit.ts';
import {
  globalApiLimiter,
  authLimiter,
  registerLimiter,
  adminLimiter,
  webhookLimiter,
} from './rateLimit.ts';
import { startAutoBackupScheduler } from './backup.ts';
import type { StaffRole } from '../types/admin.ts';

function readSessionToken(req: Request): string | null {
  const cookieToken = req.cookies?.[SESSION_COOKIE];
  if (typeof cookieToken === 'string' && cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return null;
}

export function installSecurity(app: Express): SecurityContext {
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'", 'https:', 'data:'],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          frameSrc: ["'self'", 'https://www.youtube.com', 'https://www.youtube-nocookie.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          scriptSrcAttr: ["'none'"],
          styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
          connectSrc: ["'self'", 'https:'],
          upgradeInsecureRequests: [],
        },
      } : false,
      crossOriginEmbedderPolicy: false,
      frameguard: { action: 'deny' },
      hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  const allowedOrigins = (process.env.CORS_ORIGINS || process.env.APP_URL || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('CORS bloqueado'));
      },
      credentials: true,
    })
  );

  app.use(cookieParser(process.env.SESSION_SECRET || 'cinereact-dev-session-secret'));
  app.use('/api', globalApiLimiter);

  setInterval(() => cleanupExpiredSessions(), 5 * 60 * 1000);
  startAutoBackupScheduler();

  function resolveAuthUser(req: Request): AuthUser | null {
    const token = readSessionToken(req);
    if (!token) return null;
    const session = validateSessionToken(token);
    if (!session) return null;
    const user = localDb.findUsuarioByEmailSync(session.userEmail);
    if (!user) return null;
    const restriction = getAccountRestriction(user);
    if (restriction.blocked) return null;
    return toAuthUser(user);
  }

  function getAuthEmail(req: Request): string | null {
    return resolveAuthUser(req)?.email || null;
  }

  async function requireAuth(req: Request, res: Response): Promise<AuthUser | null> {
    const authUser = resolveAuthUser(req);
    if (!authUser) {
      res.status(401).json({ error: 'Autenticação necessária.' });
      return null;
    }
    return authUser;
  }

  async function requireAdmin(req: Request, res: Response): Promise<string | null> {
    const authUser = await requireAuth(req, res);
    if (!authUser) return null;
    if (!authUser.isAdmin) {
      res.status(403).json({ error: 'Acesso negado. Privilégios de administrador necessários.' });
      return null;
    }
    writeAuditLog(req, {
      actorEmail: authUser.email,
      action: 'admin_access',
      targetType: 'route',
      targetId: req.path,
      details: req.method,
    });
    return authUser.email;
  }

  function requireStaff(sections: AdminSection[], minRole: StaffRole = 'moderator') {
    return async (req: Request, res: Response): Promise<AuthUser | null> => {
      const authUser = await requireAuth(req, res);
      if (!authUser) return null;
      if (!hasMinRole(authUser.role, minRole) || !canAccessAnySection(authUser.role, sections)) {
        res.status(403).json({ error: 'Permissão insuficiente para esta área.' });
        return null;
      }
      return authUser;
    };
  }

  const audit = (req: Request, entry: Parameters<typeof writeAuditLog>[1]) => writeAuditLog(req, entry);
  const financialAudit = (req: Request, entry: Parameters<typeof writeFinancialAuditLog>[1]) =>
    writeFinancialAuditLog(req, entry);

  app.use('/api/admin', adminLimiter);
  app.use('/api/login', authLimiter);
  app.use('/api/cadastro', registerLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', registerLimiter);
  app.use('/api/webhooks', webhookLimiter);

  return {
    requireAuth,
    requireAdmin,
    requireStaff,
    getAuthEmail,
    audit,
    financialAudit,
  };
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

export function attachSessionUser(req: Request): AuthUser | null {
  const token = readSessionToken(req);
  if (!token) return null;
  const session = validateSessionToken(token);
  if (!session) return null;
  const user = localDb.findUsuarioByEmailSync(session.userEmail);
  if (!user) return null;
  return toAuthUser(user);
}

export { readSessionToken, getClientIp };
