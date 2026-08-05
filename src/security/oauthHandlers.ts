import type { Request, Response } from 'express';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { localDb } from '../db/local_db.ts';
import { getAccountRestriction } from '../utils/platformEnforcement.ts';
import { hashPassword } from './password.ts';
import { createSession } from './sessions.ts';
import { setSessionCookie } from './installSecurity.ts';
import { normalizeEmail } from './sanitize.ts';
import { recordLoginAttempt } from './monitoring.ts';
import { generateSecureToken } from './crypto.ts';
import { resolvePublicAppUrl, isSupabaseEmailAuthEnabled } from './supabaseAuth.ts';
import type { UserAccount } from '../types.ts';

const OAUTH_COOKIE_PREFIX = 'sb_oauth_';
const OAUTH_TERMS_COOKIE = 'cinereact_oauth_terms';
const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120';

export function isDiscordOAuthEnabled(): boolean {
  return isSupabaseEmailAuthEnabled();
}

function getOAuthCallbackUrl(): string {
  return `${resolvePublicAppUrl()}/api/auth/oauth/callback`;
}

function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL!.trim();
}

function createOAuthSupabaseClient(req: Request, res: Response): SupabaseClient {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_ANON_KEY!.trim();

  return createClient(url, key, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (storageKey: string) => req.cookies[OAUTH_COOKIE_PREFIX + storageKey] ?? null,
        setItem: (storageKey: string, value: string) => {
          res.cookie(OAUTH_COOKIE_PREFIX + storageKey, value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60 * 1000,
          });
        },
        removeItem: (storageKey: string) => {
          res.clearCookie(OAUTH_COOKIE_PREFIX + storageKey, { path: '/' });
        },
      },
    },
  });
}

function clearOAuthCookies(req: Request, res: Response): void {
  const prefix = OAUTH_COOKIE_PREFIX;
  for (const name of Object.keys(req.cookies || {})) {
    if (name.startsWith(prefix)) {
      res.clearCookie(name, { path: '/' });
    }
  }
}

function resolveOAuthEmail(user: User): string {
  if (user.email) {
    return normalizeEmail(user.email);
  }

  const discordIdentity = user.identities?.find((identity) => identity.provider === 'discord');
  const discordId = discordIdentity?.id || user.user_metadata?.provider_id;
  if (discordId) {
    return normalizeEmail(`discord_${discordId}@oauth.cinereact.local`);
  }

  return normalizeEmail(`oauth_${user.id}@oauth.cinereact.local`);
}

function resolveOAuthUsername(user: User, email: string): string {
  const meta = user.user_metadata || {};
  const discordIdentity = user.identities?.find((identity) => identity.provider === 'discord');
  const fromMeta =
    meta.full_name ||
    meta.name ||
    meta.preferred_username ||
    meta.username ||
    discordIdentity?.identity_data?.full_name ||
    discordIdentity?.identity_data?.username;

  const base = (typeof fromMeta === 'string' && fromMeta.trim()) || email.split('@')[0];
  return base.trim().slice(0, 80) || 'usuario';
}

function resolveOAuthAvatar(user: User): string {
  const meta = user.user_metadata || {};
  const avatar =
    meta.avatar_url ||
    meta.picture ||
    meta.avatar ||
    user.identities?.find((i) => i.provider === 'discord')?.identity_data?.avatar_url;

  return typeof avatar === 'string' && avatar.trim() ? avatar.trim() : DEFAULT_AVATAR;
}

type DiscordProfileSnapshot = {
  oauthProvider: 'discord';
  discordId?: string;
  discordUsername?: string;
  providerEmail?: string;
};

function extractDiscordProfile(user: User): DiscordProfileSnapshot {
  const discordIdentity = user.identities?.find((identity) => identity.provider === 'discord');
  const identityData = discordIdentity?.identity_data || {};
  const meta = user.user_metadata || {};

  const discordId =
    (typeof discordIdentity?.id === 'string' && discordIdentity.id) ||
    (typeof meta.provider_id === 'string' && meta.provider_id) ||
    undefined;

  const discordUsername =
    (typeof identityData.username === 'string' && identityData.username.trim()) ||
    (typeof identityData.full_name === 'string' && identityData.full_name.trim()) ||
    (typeof meta.preferred_username === 'string' && meta.preferred_username.trim()) ||
    (typeof meta.username === 'string' && meta.username.trim()) ||
    undefined;

  const providerEmail =
    (typeof user.email === 'string' && user.email.includes('@') && !user.email.includes('@oauth.cinereact.local')
      ? normalizeEmail(user.email)
      : undefined) ||
    (typeof identityData.email === 'string' && identityData.email.trim()
      ? normalizeEmail(identityData.email)
      : undefined) ||
    (typeof meta.email === 'string' && meta.email.trim() ? normalizeEmail(meta.email) : undefined);

  return {
    oauthProvider: 'discord',
    discordId,
    discordUsername,
    providerEmail,
  };
}

async function findOrCreateOAuthUser(
  supabaseUser: User,
  termsAcceptedAt: string
): Promise<UserAccount> {
  const email = resolveOAuthEmail(supabaseUser);
  const username = resolveOAuthUsername(supabaseUser, email);
  const avatar = resolveOAuthAvatar(supabaseUser);
  const discordProfile = extractDiscordProfile(supabaseUser);

  const profilePatch = {
    supabaseAuthId: supabaseUser.id,
    emailVerified: true,
    avatar,
    username,
    oauthProvider: discordProfile.oauthProvider,
    discordId: discordProfile.discordId,
    discordUsername: discordProfile.discordUsername,
    providerEmail: discordProfile.providerEmail,
    termsAcceptedAt,
  };

  console.info('[Auth] Discord login:', {
    accountEmail: email,
    providerEmail: discordProfile.providerEmail || null,
    discordId: discordProfile.discordId || null,
    discordUsername: discordProfile.discordUsername || null,
    supabaseAuthId: supabaseUser.id,
  });

  const existing = await localDb.findUsuarioByEmail(email);
  if (existing) {
    await localDb.updateUsuario(email, {
      ...profilePatch,
      avatar: existing.avatar || avatar,
      username: existing.username || username,
    });
    const updated = await localDb.findUsuarioByEmail(email);
    return updated || existing;
  }

  const randomPassword = await hashPassword(generateSecureToken(32));
  return localDb.addUsuario({
    username,
    email,
    password: randomPassword,
    ...profilePatch,
  });
}

export async function handleDiscordOAuthStart(req: Request, res: Response): Promise<void> {
  const appUrl = resolvePublicAppUrl();

  if (!isDiscordOAuthEnabled()) {
    res.status(503).json({ error: 'Login com Discord não configurado (SUPABASE_URL + SUPABASE_ANON_KEY).' });
    return;
  }

  if (req.cookies[OAUTH_TERMS_COOKIE] !== '1') {
    res.redirect(`${appUrl}?auth=oauth-terms`);
    return;
  }

  try {
    const supabase = createOAuthSupabaseClient(req, res);
    const redirectTo = getOAuthCallbackUrl();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      console.error('[Auth] Discord OAuth start falhou:', error?.message);
      res.status(500).json({
        error: 'Não foi possível iniciar login com Discord. Verifique o provedor Discord no Supabase.',
      });
      return;
    }

    res.redirect(data.url);
  } catch (error) {
    console.error('[Auth] Erro ao iniciar Discord OAuth:', error);
    res.status(500).json({ error: 'Erro interno ao iniciar login com Discord.' });
  }
}

export async function handleOAuthCallback(req: Request, res: Response): Promise<void> {
  const appUrl = resolvePublicAppUrl();
  const oauthError = typeof req.query.error === 'string' ? req.query.error : null;
  const oauthErrorDescription =
    typeof req.query.error_description === 'string' ? req.query.error_description : null;

  if (oauthError) {
    console.error('[Auth] OAuth callback erro:', oauthError, oauthErrorDescription);
    clearOAuthCookies(req, res);
    res.redirect(`${appUrl}?auth=oauth-error`);
    return;
  }

  const code = typeof req.query.code === 'string' ? req.query.code : '';
  if (!code) {
    clearOAuthCookies(req, res);
    res.redirect(`${appUrl}?auth=oauth-missing`);
    return;
  }

  try {
    const supabase = createOAuthSupabaseClient(req, res);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session?.user) {
      console.error('[Auth] OAuth exchange falhou:', error?.message);
      clearOAuthCookies(req, res);
      res.redirect(`${appUrl}?auth=oauth-error`);
      return;
    }

    if (req.cookies[OAUTH_TERMS_COOKIE] !== '1') {
      clearOAuthCookies(req, res);
      res.redirect(`${appUrl}?auth=oauth-terms`);
      return;
    }

    const termsAcceptedAt = new Date().toISOString();
    const email = resolveOAuthEmail(data.session.user);
    const isNewUser = !(await localDb.findUsuarioByEmail(email));

    const account = await findOrCreateOAuthUser(data.session.user, termsAcceptedAt);
    const restriction = getAccountRestriction(account);
    if (restriction.blocked) {
      clearOAuthCookies(req, res);
      res.redirect(`${appUrl}?auth=oauth-blocked`);
      return;
    }

    const { session, token } = createSession(account.id, account.email, req);
    setSessionCookie(res, token);
    clearOAuthCookies(req, res);
    res.clearCookie(OAUTH_TERMS_COOKIE, { path: '/' });
    recordLoginAttempt(req, account.email, true, 'oauth_discord');

    res.redirect(`${appUrl}?auth=oauth-success${isNewUser ? '&new=1' : ''}`);
  } catch (error) {
    console.error('[Auth] Erro no callback OAuth:', error);
    clearOAuthCookies(req, res);
    res.redirect(`${appUrl}?auth=oauth-error`);
  }
}

export function getOAuthSetupHint(): {
  discordOAuthEnabled: boolean;
  discordOnlyLogin: boolean;
  oauthCallbackUrl: string;
} {
  return {
    discordOAuthEnabled: isDiscordOAuthEnabled(),
    discordOnlyLogin: true,
    oauthCallbackUrl: getOAuthCallbackUrl(),
  };
}
