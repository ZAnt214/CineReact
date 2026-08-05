import { createClient, type SupabaseClient, type AuthError } from '@supabase/supabase-js';
import type { UserAccount } from '../types.ts';
import {
  isCustomAuthEmailConfigured,
  sendBrandedVerificationEmail,
} from './authEmailDelivery.ts';

let anonAuthClient: SupabaseClient | null = null;
let adminAuthClient: SupabaseClient | null = null;

export function isSupabaseEmailAuthEnabled(): boolean {
  return !!(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_ANON_KEY?.trim());
}

function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL!.trim();
}

export function getSupabaseAnonAuthClient(): SupabaseClient | null {
  if (!isSupabaseEmailAuthEnabled()) return null;
  if (!anonAuthClient) {
    anonAuthClient = createClient(getSupabaseUrl(), process.env.SUPABASE_ANON_KEY!.trim(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return anonAuthClient;
}

export function getSupabaseAdminAuthClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (anonKey && key === anonKey) {
    console.error(
      '[Auth] SUPABASE_SERVICE_ROLE_KEY é igual à ANON_KEY. ' +
        'Copie a chave service_role (secret) em Project Settings → API.'
    );
    return null;
  }

  if (!adminAuthClient) {
    adminAuthClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminAuthClient;
}

function isInvalidServiceRoleError(error: AuthError): boolean {
  const status = error.status || 0;
  const code = (error.code || '').toLowerCase();
  const message = (error.message || '').toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    code === 'bad_jwt' ||
    code === 'invalid_jwt' ||
    message.includes('invalid api key') ||
    message.includes('jwt') ||
    message.includes('not authorized') ||
    message.includes('invalid claim')
  );
}

const PLACEHOLDER_APP_URL_MARKERS = ['my_app_url', 'your-domain', 'example.com', 'changeme'];

function isUsablePublicUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  if (PLACEHOLDER_APP_URL_MARKERS.some((marker) => lower.includes(marker))) {
    return false;
  }

  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withScheme);
    return parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

/** URL pública do app — ignora placeholders como MY_APP_URL no Railway. */
export function resolvePublicAppUrl(): string {
  const configured = process.env.APP_URL?.trim();
  if (configured && isUsablePublicUrl(configured)) {
    return configured.replace(/\/$/, '');
  }

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayDomain) {
    return `https://${railwayDomain.replace(/\/$/, '')}`;
  }

  const staticUrl = process.env.RAILWAY_STATIC_URL?.trim();
  if (staticUrl && isUsablePublicUrl(staticUrl)) {
    return staticUrl.replace(/\/$/, '');
  }

  if (configured && (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production')) {
    console.warn(
      `[Auth] APP_URL inválido ou placeholder ("${configured}"). ` +
        'Defina APP_URL=https://cinereactoficial.up.railway.app no Railway ou use RAILWAY_PUBLIC_DOMAIN.'
    );
  }

  return 'http://localhost:3000';
}

export function getEmailConfirmRedirectUrl(): string {
  return `${resolvePublicAppUrl()}/api/auth/confirm-email`;
}

const SUPABASE_CODE_MESSAGES: Record<string, string> = {
  signup_disabled:
    'Cadastro por e-mail desativado no Supabase. Habilite em Authentication → Providers → Email.',
  email_address_invalid: 'E-mail inválido.',
  email_address_not_authorized: 'Este domínio de e-mail não é permitido no Supabase.',
  weak_password: 'Senha muito fraca. Use pelo menos 6 caracteres.',
  user_already_exists: 'Este e-mail já está cadastrado.',
  email_exists: 'Este e-mail já está cadastrado.',
  unexpected_failure:
    'Falha no Supabase Auth. Verifique Redirect URLs (inclua /api/auth/confirm-email) e SMTP.',
  validation_failed: '', // mensagem dinâmica em formatSupabaseAuthError
};

export function formatSupabaseAuthError(error: AuthError | null | undefined): string {
  if (!error) return 'Erro desconhecido no Supabase Auth.';

  const message = typeof error.message === 'string' ? error.message.trim() : '';
  if (message && message !== '{}') return message;

  const code = error.code || '';
  const status = error.status || 0;

  if (isInvalidServiceRoleError(error)) {
    return 'SUPABASE_SERVICE_ROLE_KEY inválida. No Supabase → Project Settings → API, copie a chave service_role (secret), não a anon.';
  }

  if (code === 'validation_failed') {
    return `URL de confirmação não permitida no Supabase. Adicione em Redirect URLs: ${getEmailConfirmRedirectUrl()}`;
  }
  if (code && SUPABASE_CODE_MESSAGES[code]) return SUPABASE_CODE_MESSAGES[code];

  const lower = message.toLowerCase();
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'Este e-mail já está cadastrado.';
  }

  if (code) {
    return `Erro no cadastro (${code}, HTTP ${status}). Verifique Authentication → Email e Redirect URLs no Supabase.`;
  }

  if (status >= 500) {
    return 'Supabase não conseguiu enviar o e-mail (erro ' + status + '). No painel Supabase: Authentication → Emails → configure SMTP customizado (ou verifique limite de e-mails e os Auth Logs).';
  }

  if (status) {
    return `Erro no Supabase Auth (HTTP ${status}). Verifique as chaves API e Redirect URLs.`;
  }

  return 'Não foi possível criar a conta no Supabase. Verifique Authentication → Email, Confirm email e Redirect URLs.';
}

function isDuplicateSignupError(error: AuthError): boolean {
  const message = (error.message || '').toLowerCase();
  const code = (error.code || '').toLowerCase();
  return (
    message.includes('already registered') ||
    message.includes('already been registered') ||
    message.includes('already exists') ||
    code.includes('already') ||
    code === 'user_already_exists' ||
    code === 'email_exists'
  );
}

function isEmptyIdentitiesSignup(data: { user?: { identities?: unknown[] } | null }): boolean {
  const identities = data.user?.identities;
  return Array.isArray(identities) && identities.length === 0;
}

export type SupabaseSignUpResult =
  | { ok: true; userId: string; alreadyConfirmed: boolean; emailSendFailed?: boolean }
  | { ok: false; error: string; code?: string };

export async function signUpWithEmailVerification(
  email: string,
  password: string,
  username: string
): Promise<SupabaseSignUpResult> {
  const admin = getSupabaseAdminAuthClient();
  if (admin) {
    const adminResult = await signUpViaAdmin(admin, email, password, username);
    if (adminResult.ok) {
      return adminResult;
    }
    if (adminResult.ok === false && adminResult.code === 'user_exists') {
      return adminResult;
    }

    if (adminResult.ok === false) {
      console.warn('[Auth] Cadastro admin sem envio de e-mail — tentando signUp via anon key.', adminResult.code);
      const anonResult = await signUpViaAnon(email, password, username);
      if (anonResult.ok) {
        return anonResult;
      }
      if (anonResult.ok === false && anonResult.code === 'user_exists') {
        return anonResult;
      }

      if (anonResult.ok === false) {
        return anonResult.error !== adminResult.error ? anonResult : adminResult;
      }

      return anonResult;
    }

    return adminResult;
  }

  return signUpViaAnon(email, password, username);
}

async function signUpViaAdmin(
  admin: SupabaseClient,
  email: string,
  password: string,
  username: string
): Promise<SupabaseSignUpResult> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { username },
  });

  if (error) {
    console.error('[Auth] Supabase admin.createUser falhou:', {
      message: error.message,
      code: error.code,
      status: error.status,
    });
    if (isDuplicateSignupError(error)) {
      return { ok: false, error: 'Este e-mail já está cadastrado.', code: 'user_exists' };
    }
    return { ok: false, error: formatSupabaseAuthError(error), code: error.code };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { ok: false, error: 'Resposta inválida do Supabase ao criar conta.' };
  }

  const sent = await deliverVerificationEmail(email, password, admin);
  if (!sent.ok) {
    console.error('[Auth] Falha ao enviar e-mail de confirmação (usuário Auth mantido):', sent.error);
    return {
      ok: true,
      userId,
      alreadyConfirmed: false,
      emailSendFailed: true,
    };
  }

  return { ok: true, userId, alreadyConfirmed: false };
}

async function signUpViaAnon(
  email: string,
  password: string,
  username: string
): Promise<SupabaseSignUpResult> {
  const client = getSupabaseAnonAuthClient();
  if (!client) {
    return { ok: false, error: 'Verificação por e-mail não configurada (Supabase).' };
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: getEmailConfirmRedirectUrl(),
    },
  });

  if (error) {
    console.error('[Auth] Supabase signUp falhou:', {
      message: error.message,
      code: error.code,
      status: error.status,
    });
    if (isDuplicateSignupError(error)) {
      return { ok: false, error: 'Este e-mail já está cadastrado.', code: 'user_exists' };
    }
    return { ok: false, error: formatSupabaseAuthError(error), code: error.code };
  }

  if (isEmptyIdentitiesSignup(data)) {
    return { ok: false, error: 'Este e-mail já está cadastrado.', code: 'user_exists' };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { ok: false, error: 'Resposta inválida do Supabase ao criar conta.' };
  }

  const alreadyConfirmed = !!data.user?.email_confirmed_at || !!data.session;
  return { ok: true, userId, alreadyConfirmed };
}

export async function createAdminConfirmedUser(
  email: string,
  password: string,
  username: string
): Promise<SupabaseSignUpResult> {
  const admin = getSupabaseAdminAuthClient();
  if (!admin) {
    return signUpViaAnon(email, password, username);
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (error) {
    console.error('[Auth] Supabase admin bootstrap falhou:', error.message, error.code);
    return { ok: false, error: formatSupabaseAuthError(error), code: error.code };
  }

  return { ok: true, userId: data.user.id, alreadyConfirmed: true };
}

async function deliverVerificationEmail(
  email: string,
  password?: string,
  adminClient?: SupabaseClient | null
): Promise<{ ok: boolean; error?: string }> {
  const redirectTo = getEmailConfirmRedirectUrl();
  const appUrl = resolvePublicAppUrl();
  const admin = adminClient ?? getSupabaseAdminAuthClient();

  if (isCustomAuthEmailConfigured() && admin) {
    const branded = await sendBrandedVerificationEmail(admin, email, redirectTo, appUrl, password);
    if (branded.ok) {
      console.info('[Auth] E-mail de confirmação CineReact enviado via Resend.');
      return { ok: true };
    }
    console.warn('[Auth] Envio CineReact via Resend falhou, tentando Supabase:', 'error' in branded ? branded.error : '');
  }

  const client = getSupabaseAnonAuthClient();
  if (!client) {
    return { ok: false, error: 'Verificação por e-mail não configurada.' };
  }

  const { error } = await client.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (!error) {
    return { ok: true };
  }

  console.error('[Auth] Supabase resend falhou:', {
    message: error.message,
    code: error.code,
    status: error.status,
  });

  if (!admin) {
    return { ok: false, error: formatSupabaseAuthError(error) };
  }

  const fallback = await sendBrandedVerificationEmail(admin, email, redirectTo, appUrl, password);
  if (fallback.ok) {
    console.info('[Auth] E-mail de confirmação enviado via Resend (fallback após falha do Supabase SMTP).');
    return { ok: true };
  }

  const fallbackError = 'error' in fallback ? fallback.error : 'Falha no envio alternativo de e-mail.';
  return {
    ok: false,
    error: isCustomAuthEmailConfigured() ? fallbackError : formatSupabaseAuthError(error),
  };
}

export async function resendVerificationEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  return deliverVerificationEmail(email);
}

export async function confirmEmailWithTokenHash(
  token_hash: string,
  type: string
): Promise<{ ok: boolean; email?: string; error?: string }> {
  const client = getSupabaseAnonAuthClient();
  if (!client) {
    return { ok: false, error: 'Supabase não configurado.' };
  }

  const otpType = type === 'email' || type === 'email_change' ? 'email' : 'signup';

  const { data, error } = await client.auth.verifyOtp({
    token_hash,
    type: otpType as 'signup' | 'email',
  });

  if (error) {
    return { ok: false, error: formatSupabaseAuthError(error) };
  }

  return { ok: true, email: data.user?.email ?? undefined };
}

export async function isSupabaseEmailConfirmed(supabaseAuthId: string): Promise<boolean> {
  const admin = getSupabaseAdminAuthClient();
  if (!admin) return false;

  const { data, error } = await admin.auth.admin.getUserById(supabaseAuthId);
  if (error || !data.user) return false;
  return !!data.user.email_confirmed_at;
}

export function userNeedsEmailVerification(user: UserAccount): boolean {
  if (!isSupabaseEmailAuthEnabled()) return false;
  if (user.emailVerified === true) return false;
  if (user.emailVerified === false) return true;
  // Contas legadas sem Supabase Auth continuam entrando sem verificação.
  if (!user.supabaseAuthId) return false;
  return true;
}

export async function deleteSupabaseUser(userId: string): Promise<void> {
  const admin = getSupabaseAdminAuthClient();
  if (!admin) return;
  try {
    await admin.auth.admin.deleteUser(userId);
  } catch {
    /* rollback opcional */
  }
}

export function getAppPublicUrl(): string {
  return resolvePublicAppUrl();
}

export function getEmailVerificationSetupHint(): {
  supabaseEmailAuthEnabled: boolean;
  publicAppUrl: string;
  confirmRedirectUrl: string;
  appUrlSource: 'APP_URL' | 'RAILWAY_PUBLIC_DOMAIN' | 'RAILWAY_STATIC_URL' | 'localhost';
  serviceRoleKeyConfigured: boolean;
  serviceRoleKeyMatchesAnon: boolean;
  customEmailFallbackConfigured: boolean;
} {
  const configured = process.env.APP_URL?.trim();
  let appUrlSource: 'APP_URL' | 'RAILWAY_PUBLIC_DOMAIN' | 'RAILWAY_STATIC_URL' | 'localhost' = 'localhost';

  if (configured && isUsablePublicUrl(configured)) {
    appUrlSource = 'APP_URL';
  } else if (process.env.RAILWAY_PUBLIC_DOMAIN?.trim()) {
    appUrlSource = 'RAILWAY_PUBLIC_DOMAIN';
  } else if (process.env.RAILWAY_STATIC_URL?.trim() && isUsablePublicUrl(process.env.RAILWAY_STATIC_URL)) {
    appUrlSource = 'RAILWAY_STATIC_URL';
  }

  return {
    supabaseEmailAuthEnabled: isSupabaseEmailAuthEnabled(),
    publicAppUrl: resolvePublicAppUrl(),
    confirmRedirectUrl: getEmailConfirmRedirectUrl(),
    appUrlSource,
    serviceRoleKeyConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    serviceRoleKeyMatchesAnon:
      !!process.env.SUPABASE_ANON_KEY?.trim() &&
      process.env.SUPABASE_ANON_KEY?.trim() === process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    customEmailFallbackConfigured: isCustomAuthEmailConfigured(),
  };
}
