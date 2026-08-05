import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;
const HASH_PREFIX = /^\$2[aby]\$/;

export function isPasswordHashed(value?: string | null): boolean {
  return !!value && HASH_PREFIX.test(value);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, stored?: string | null): Promise<boolean> {
  if (!stored) return false;
  if (isPasswordHashed(stored)) {
    return bcrypt.compare(plain, stored);
  }
  return stored === plain;
}

export async function hashPasswordIfNeeded(plain?: string): Promise<string | undefined> {
  if (!plain) return undefined;
  if (isPasswordHashed(plain)) return plain;
  return hashPassword(plain);
}
