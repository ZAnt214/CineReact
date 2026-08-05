import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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

export type SupabaseSignUpResult =
  | { ok: true; userId: string; alreadyConfirmed: boolean }
  | { ok: false; error: string; code?: string };

export async function signUpWithEmailVerification(
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
    const msg = error.message || 'Erro ao registrar no Supabase.';
    if (
      msg.toLowerCase().includes('already registered') ||
      msg.toLowerCase().includes('already been registered')
    ) {
      return { ok: false, error: 'Este e-mail já está cadastrado.', code: 'user_exists' };
    }
    return { ok: false, error: msg, code: error.code };
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
    return signUpWithEmailVerification(email, password, username);
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (error) {
    return { ok: false, error: error.message, code: error.code };
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
    return { ok: false, error: error.message };
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
    return { ok: false, error: error.message };
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
