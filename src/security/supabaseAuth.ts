import { createClient, type SupabaseClient, type AuthError } from '@supabase/supabase-js';
import type { UserAccount } from '../types.ts';

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
  if (!adminAuthClient) {
    adminAuthClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminAuthClient;
}

export function getEmailConfirmRedirectUrl(): string {
  const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/api/auth/confirm-email`;
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
  validation_failed:
    'Configuração inválida no Supabase Auth. Adicione a URL de confirmação em Redirect URLs.',
};

export function formatSupabaseAuthError(error: AuthError | null | undefined): string {
  if (!error) return 'Erro desconhecido no Supabase Auth.';

  const message = typeof error.message === 'string' ? error.message.trim() : '';
  if (message && message !== '{}') return message;

  const code = error.code || '';
  if (code && SUPABASE_CODE_MESSAGES[code]) return SUPABASE_CODE_MESSAGES[code];

  const lower = message.toLowerCase();
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'Este e-mail já está cadastrado.';
  }

  if (code) {
    return `Erro no cadastro (${code}). Verifique Authentication → Email e Redirect URLs no Supabase.`;
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
  | { ok: true; userId: string; alreadyConfirmed: boolean }
  | { ok: false; error: string; code?: string };

export async function signUpWithEmailVerification(
  email: string,
  password: string,
  username: string
): Promise<SupabaseSignUpResult> {
  const admin = getSupabaseAdminAuthClient();
  if (admin) {
    return signUpViaAdmin(admin, email, password, username);
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

  const sent = await resendVerificationEmail(email);
  if (!sent.ok) {
    console.error('[Auth] Falha ao enviar e-mail de confirmação:', sent.error);
    await deleteSupabaseUser(userId);
    return {
      ok: false,
      error:
        sent.error ||
        'Conta criada no Supabase, mas o e-mail de confirmação não foi enviado. Verifique SMTP e Redirect URLs.',
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

export async function resendVerificationEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseAnonAuthClient();
  if (!client) {
    return { ok: false, error: 'Verificação por e-mail não configurada.' };
  }

  const { error } = await client.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: getEmailConfirmRedirectUrl() },
  });

  if (error) {
    console.error('[Auth] Supabase resend falhou:', error.message, error.code);
    return { ok: false, error: formatSupabaseAuthError(error) };
  }
  return { ok: true };
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
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}
