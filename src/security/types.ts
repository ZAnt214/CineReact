import type { StaffRole } from '../types/admin.ts';
import type { UserAccount } from '../types.ts';

export const SESSION_COOKIE = 'cine_session';
export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const FAILED_LOGIN_CAPTCHA_THRESHOLD = 5;
export const LOGIN_LOCKOUT_THRESHOLD = 12;
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

export type AdminSection =
  | 'dashboard'
  | 'users'
  | 'content'
  | 'moderation'
  | 'finance'
  | 'system'
  | 'security';

export interface AuthSession {
  id: string;
  userId: string;
  userEmail: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
  ip?: string;
  userAgent?: string;
  revokedAt?: string;
  twoFactorVerified?: boolean;
}

export interface LoginAttempt {
  id: string;
  email: string;
  ip: string;
  success: boolean;
  reason?: string;
  createdAt: string;
}

export interface CaptchaChallenge {
  id: string;
  answerHash: string;
  expiresAt: string;
  used: boolean;
}

export interface SecurityAlert {
  id: string;
  type:
    | 'brute_force'
    | 'suspicious_login'
    | 'admin_access'
    | 'webhook_invalid'
    | 'rate_limit'
    | 'fraud_subscription';
  severity: 'low' | 'medium' | 'high';
  message: string;
  metadata?: string;
  ip?: string;
  userEmail?: string;
  createdAt: string;
  acknowledged?: boolean;
}

export interface IdempotencyRecord {
  key: string;
  scope: string;
  resultRef?: string;
  createdAt: string;
}

export interface FinancialAuditEntry {
  id: string;
  action: string;
  actorEmail?: string;
  targetType: string;
  targetId?: string;
  amount?: number;
  currency?: string;
  metadata?: string;
  ip?: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: StaffRole;
  isAdmin: boolean;
  isDonor: boolean;
  isVerifiedCreator: boolean;
  account: UserAccount;
}

export interface SecurityContext {
  requireAuth: (req: any, res: any) => Promise<AuthUser | null>;
  requireAdmin: (req: any, res: any) => Promise<string | null>;
  requireStaff: (
    sections: AdminSection[],
    minRole?: StaffRole
  ) => (req: any, res: any) => Promise<AuthUser | null>;
  getAuthEmail: (req: any) => string | null;
  audit: (req: any, entry: Omit<import('../types/admin.ts').AdminAuditLog, 'id' | 'createdAt'>) => void;
  financialAudit: (req: any, entry: Omit<FinancialAuditEntry, 'id' | 'createdAt'>) => void;
}
