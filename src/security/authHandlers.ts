import type { Request, Response } from 'express';
import { localDb } from '../db/local_db.ts';
import { serializeUserState } from '../utils/userState.ts';
import { hashPasswordIfNeeded, verifyPassword, isPasswordHashed } from './password.ts';
import { revokeSessionByToken, revokeAllUserSessions } from './sessions.ts';
import { clearSessionCookie, readSessionToken } from './installSecurity.ts';
import { isValidEmail, normalizeEmail, validatePasswordStrength } from './sanitize.ts';
import { createCaptchaChallenge } from './backup.ts';
import { userRequiresTwoFactor, verifyTwoFactorToken, generateTwoFactorSecret, enableTwoFactor, disableTwoFactor } from './twoFactor.ts';
import { toAuthUser } from './rbac.ts';
import { hashToken } from './crypto.ts';
import {
  confirmEmailWithTokenHash,
  getAppPublicUrl,
  getEmailVerificationSetupHint,
  isSupabaseEmailAuthEnabled,
} from './supabaseAuth.ts';
import {
  handleDiscordOAuthStart,
  handleOAuthCallback,
  getOAuthSetupHint,
} from './oauthHandlers.ts';
import type { SecurityContext } from './types.ts';

export function registerSecurityRoutes(app: import('express').Express, security: SecurityContext) {
  app.get('/api/auth/me', async (req, res) => {
    const authUser = await security.requireAuth(req, res);
    if (!authUser) return;
    res.json({
      success: true,
      user: serializeUserState(authUser.account, { isAdmin: authUser.isAdmin }),
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = readSessionToken(req);
    if (token) revokeSessionByToken(token);
    clearSessionCookie(res);
    res.json({ success: true });
  });

  app.get('/api/auth/captcha', (_req, res) => {
    res.json(createCaptchaChallenge());
  });

  app.get('/api/auth/sessions', async (req, res) => {
    const authUser = await security.requireAuth(req, res);
    if (!authUser) return;
    const token = readSessionToken(req);
    const current = token ? localDb.getAuthSessionByTokenHash(hashToken(token)) : null;
    const sessions = localDb.getAuthSessionsForUser(authUser.email).map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      lastActivityAt: s.lastActivityAt,
      ip: s.ip,
      userAgent: s.userAgent,
      current: current?.id === s.id,
    }));
    res.json({ sessions });
  });

  app.post('/api/auth/sessions/revoke-all', async (req, res) => {
    const authUser = await security.requireAuth(req, res);
    if (!authUser) return;
    const token = readSessionToken(req);
    const current = token ? localDb.getAuthSessionByTokenHash(hashToken(token)) : null;
    const count = revokeAllUserSessions(authUser.email, current?.id);
    security.audit(req, {
      actorEmail: authUser.email,
      action: 'revoke_all_sessions',
      targetType: 'user',
      targetId: authUser.email,
      details: String(count),
    });
    res.json({ success: true, revoked: count });
  });

  app.post('/api/auth/sessions/:id/revoke', async (req, res) => {
    const authUser = await security.requireAuth(req, res);
    if (!authUser) return;
    const session = localDb.getAuthSessionById(req.params.id);
    if (!session || session.userEmail !== authUser.email) {
      return res.status(404).json({ error: 'Sessão não encontrada.' });
    }
    localDb.revokeAuthSession(session.id);
    security.audit(req, {
      actorEmail: authUser.email,
      action: 'revoke_session',
      targetType: 'session',
      targetId: session.id,
    });
    res.json({ success: true });
  });

  app.post('/api/auth/2fa/setup', async (req, res) => {
    const authUser = await security.requireAuth(req, res);
    if (!authUser) return;
    const setup = generateTwoFactorSecret(authUser.email);
    res.json({ otpauthUrl: setup.otpauthUrl, secret: setup.secret });
  });

  app.post('/api/auth/2fa/enable', async (req, res) => {
    const authUser = await security.requireAuth(req, res);
    if (!authUser) return;
    const { secret, token } = req.body || {};
    if (!secret || !token) return res.status(400).json({ error: 'Secret e token são obrigatórios.' });
    const ok = await enableTwoFactor(authUser.email, String(secret), String(token));
    if (!ok) return res.status(400).json({ error: 'Código 2FA inválido.' });
    security.audit(req, {
      actorEmail: authUser.email,
      action: 'enable_2fa',
      targetType: 'user',
      targetId: authUser.email,
    });
    res.json({ success: true });
  });

  app.post('/api/auth/2fa/disable', async (req, res) => {
    const authUser = await security.requireAuth(req, res);
    if (!authUser) return;
    const { token, password } = req.body || {};
    const validPass = await verifyPassword(String(password || ''), authUser.account.password);
    if (!validPass) return res.status(401).json({ error: 'Senha incorreta.' });
    if (!verifyTwoFactorToken(authUser.account.twoFactorSecretEnc, String(token || ''))) {
      return res.status(401).json({ error: 'Código 2FA inválido.' });
    }
    await disableTwoFactor(authUser.email);
    security.audit(req, {
      actorEmail: authUser.email,
      action: 'disable_2fa',
      targetType: 'user',
      targetId: authUser.email,
    });
    res.json({ success: true });
  });

  app.get('/api/admin/security/alerts', async (req, res) => {
    if (!(await security.requireAdmin(req, res))) return;
    res.json({ alerts: localDb.getSecurityAlerts().slice(0, 200) });
  });

  app.get('/api/admin/security/financial-audit', async (req, res) => {
    if (!(await security.requireAdmin(req, res))) return;
    res.json({ entries: localDb.getFinancialAuditLog().slice(0, 500) });
  });

  app.get('/api/auth/confirm-email', async (req, res) => {
    await handleConfirmEmail(req, res);
  });

  app.post('/api/auth/resend-verification', async (req, res) => {
    await handleResendVerification(req, res);
  });

  app.get('/api/auth/verification-setup', (_req, res) => {
    res.json(getEmailVerificationSetupHint());
  });

  app.get('/api/auth/oauth/discord', (req, res) => {
    void handleDiscordOAuthStart(req, res);
  });

  app.get('/api/auth/oauth/callback', (req, res) => {
    void handleOAuthCallback(req, res);
  });

  app.get('/api/auth/oauth/setup', (_req, res) => {
    res.json(getOAuthSetupHint());
  });
}

export async function handleRegister(req: Request, res: Response): Promise<void> {
  res.status(403).json({
    error: 'Cadastro disponível apenas via Discord. Use "Continuar com Discord" para criar sua conta.',
    discordOnly: true,
  });
}

export async function handleLogin(req: Request, res: Response, _security: SecurityContext): Promise<void> {
  res.status(403).json({
    error: 'Login disponível apenas via Discord. Use "Continuar com Discord" para entrar.',
    discordOnly: true,
  });
}

export async function handlePasswordUpdate(
  req: Request,
  res: Response,
  security: SecurityContext
): Promise<void> {
  const authUser = await security.requireAuth(req, res);
  if (!authUser) return;

  const { currentPassword, password, avatar, descricao, socialLinks } = req.body || {};
  const updates: Record<string, unknown> = {};

  if (password) {
    const passErr = validatePasswordStrength(String(password));
    if (passErr) {
      res.status(400).json({ error: passErr });
      return;
    }
    const valid = await verifyPassword(String(currentPassword || ''), authUser.account.password);
    if (!valid) {
      res.status(401).json({ error: 'Senha atual incorreta.' });
      return;
    }
    updates.password = await hashPasswordIfNeeded(String(password));
  }

  if (avatar) {
    const { validateAvatarDataUrl } = await import('./uploads.ts');
    const check = validateAvatarDataUrl(String(avatar));
    if (!check.ok) {
      res.status(400).json({ error: check.error });
      return;
    }
    updates.avatar = avatar;
  }

  if (descricao !== undefined) updates.descricao = String(descricao).slice(0, 500);
  if (socialLinks !== undefined) updates.socialLinks = socialLinks;

  const updated =
    Object.keys(updates).length > 0
      ? await localDb.updateUsuario(authUser.email, updates as any)
      : authUser.account;
  security.audit(req, {
    actorEmail: authUser.email,
    action: password ? 'password_change' : 'profile_update',
    targetType: 'user',
    targetId: authUser.email,
  });

  res.json({
    success: true,
    user: serializeUserState(updated!, { isAdmin: authUser.isAdmin }),
  });
}

export function resolveAuthenticatedEmail(req: Request, security: SecurityContext, bodyEmail?: string): string | null {
  const sessionEmail = security.getAuthEmail(req);
  if (!sessionEmail) return null;
  if (bodyEmail && normalizeEmail(bodyEmail) !== sessionEmail) return null;
  return sessionEmail;
}

export async function handleConfirmEmail(req: Request, res: Response): Promise<void> {
  const token_hash = String(req.query.token_hash || req.query.token || '').trim();
  const type = String(req.query.type || 'signup').trim();
  const appUrl = getAppPublicUrl();

  if (!token_hash) {
    res.redirect(`${appUrl}?auth=verify-missing`);
    return;
  }

  if (!isSupabaseEmailAuthEnabled()) {
    res.redirect(`${appUrl}?auth=verify-unavailable`);
    return;
  }

  const result = await confirmEmailWithTokenHash(token_hash, type);
  if (!result.ok || !result.email) {
    console.warn('[Auth] Falha ao confirmar e-mail:', result.error);
    res.redirect(`${appUrl}?auth=verify-error`);
    return;
  }

  const cleanEmail = normalizeEmail(result.email);
  const user = await localDb.findUsuarioByEmail(cleanEmail);
  if (user) {
    await localDb.updateUsuario(cleanEmail, { emailVerified: true });
  }

  res.redirect(`${appUrl}?auth=verify-success`);
}

export async function handleResendVerification(req: Request, res: Response): Promise<void> {
  res.status(403).json({
    error: 'Login disponível apenas via Discord.',
    discordOnly: true,
  });
}
