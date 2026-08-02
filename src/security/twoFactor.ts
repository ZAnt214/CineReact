import { generateSecret, generateURI, verifySync } from 'otplib';
import { encryptSecret, decryptSecret } from './crypto.ts';
import { localDb } from '../db/local_db.ts';
import type { UserAccount } from '../types.ts';

const TOTP_VERIFY_OPTIONS = { epochTolerance: 30 } as const;

export function generateTwoFactorSecret(email: string): { secret: string; otpauthUrl: string } {
  const secret = generateSecret();
  const otpauthUrl = generateURI({
    issuer: 'CineReact',
    label: email,
    secret,
  });
  return { secret, otpauthUrl };
}

function verifyToken(secret: string, token: string): boolean {
  return verifySync({ secret, token, ...TOTP_VERIFY_OPTIONS }).valid;
}

export function verifyTwoFactorToken(secretEnc: string | undefined, token: string): boolean {
  if (!secretEnc) return false;
  const secret = decryptSecret(secretEnc);
  if (!secret) return false;
  return verifyToken(secret, token);
}

export async function enableTwoFactor(email: string, secret: string, token: string): Promise<boolean> {
  if (!verifyToken(secret, token)) return false;
  await localDb.updateUsuario(email, {
    twoFactorEnabled: true,
    twoFactorSecretEnc: encryptSecret(secret),
  } as Partial<UserAccount>);
  return true;
}

export async function disableTwoFactor(email: string): Promise<void> {
  await localDb.updateUsuario(email, {
    twoFactorEnabled: false,
    twoFactorSecretEnc: undefined,
  } as Partial<UserAccount>);
}

export function userRequiresTwoFactor(user: UserAccount): boolean {
  return !!user.twoFactorEnabled && !!user.twoFactorSecretEnc;
}
