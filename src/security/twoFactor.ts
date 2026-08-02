import { authenticator } from 'otplib';
import { encryptSecret, decryptSecret } from './crypto.ts';
import { localDb } from '../db/local_db.ts';
import type { UserAccount } from '../types.ts';

authenticator.options = { window: 1 };

export function generateTwoFactorSecret(email: string): { secret: string; otpauthUrl: string } {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, 'CineReact', secret);
  return { secret, otpauthUrl };
}

export function verifyTwoFactorToken(secretEnc: string | undefined, token: string): boolean {
  if (!secretEnc) return false;
  const secret = decryptSecret(secretEnc);
  if (!secret) return false;
  return authenticator.verify({ token, secret });
}

export async function enableTwoFactor(email: string, secret: string, token: string): Promise<boolean> {
  if (!authenticator.verify({ token, secret })) return false;
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
