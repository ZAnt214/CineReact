import { localDb } from '../db/local_db.ts';
import { getClientIp } from './audit.ts';
import type { Request } from 'express';
import {
  FAILED_LOGIN_CAPTCHA_THRESHOLD,
  LOGIN_LOCKOUT_MS,
  LOGIN_LOCKOUT_THRESHOLD,
  type SecurityAlert,
} from './types.ts';

export function recordLoginAttempt(
  req: Request,
  email: string,
  success: boolean,
  reason?: string
): { requiresCaptcha: boolean; locked: boolean } {
  const ip = getClientIp(req);
  localDb.appendLoginAttempt({
    id: `login-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: email.toLowerCase(),
    ip,
    success,
    reason,
    createdAt: new Date().toISOString(),
  });

  const recentFailures = localDb.countRecentLoginFailures(ip, 15 * 60 * 1000);
  const requiresCaptcha = !success && recentFailures >= FAILED_LOGIN_CAPTCHA_THRESHOLD;
  const locked = !success && recentFailures >= LOGIN_LOCKOUT_THRESHOLD;

  if (locked) {
    raiseSecurityAlert({
      type: 'brute_force',
      severity: 'high',
      message: `Bloqueio temporário por excesso de tentativas de login (${recentFailures})`,
      ip,
      userEmail: email.toLowerCase(),
      metadata: JSON.stringify({ lockoutMs: LOGIN_LOCKOUT_MS }),
    });
  } else if (!success && recentFailures >= FAILED_LOGIN_CAPTCHA_THRESHOLD) {
    raiseSecurityAlert({
      type: 'brute_force',
      severity: 'medium',
      message: 'Múltiplas tentativas de login falhas — CAPTCHA exigido',
      ip,
      userEmail: email.toLowerCase(),
    });
  }

  return { requiresCaptcha, locked };
}

export function isLoginLocked(req: Request): boolean {
  const ip = getClientIp(req);
  const recentFailures = localDb.countRecentLoginFailures(ip, LOGIN_LOCKOUT_MS);
  return recentFailures >= LOGIN_LOCKOUT_THRESHOLD;
}

export function raiseSecurityAlert(
  alert: Omit<SecurityAlert, 'id' | 'createdAt' | 'acknowledged'>
): void {
  localDb.appendSecurityAlert({
    ...alert,
    id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    acknowledged: false,
  });
}

export function detectSuspiciousNewLogin(
  req: Request,
  email: string,
  knownUserAgent?: string
): void {
  const ua = String(req.headers['user-agent'] || '');
  if (knownUserAgent && knownUserAgent !== ua && ua) {
    raiseSecurityAlert({
      type: 'suspicious_login',
      severity: 'medium',
      message: 'Login em dispositivo/navegador diferente do habitual',
      ip: getClientIp(req),
      userEmail: email.toLowerCase(),
      metadata: JSON.stringify({ previousUa: knownUserAgent.slice(0, 120), currentUa: ua.slice(0, 120) }),
    });
  }
}
