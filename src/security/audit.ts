import type { Request } from 'express';
import { localDb } from '../db/local_db.ts';
import type { AdminAuditLog } from '../types/admin.ts';
import type { FinancialAuditEntry } from './types.ts';

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

export function writeAuditLog(
  req: Request,
  entry: Omit<AdminAuditLog, 'id' | 'createdAt' | 'ip' | 'userAgent'>
): void {
  localDb.appendAuditLog({
    ...entry,
    ip: getClientIp(req),
    userAgent: String(req.headers['user-agent'] || '').slice(0, 500),
  });
}

export function writeFinancialAuditLog(
  req: Request | null,
  entry: Omit<FinancialAuditEntry, 'id' | 'createdAt' | 'ip'>
): void {
  localDb.appendFinancialAuditLog({
    ...entry,
    ip: req ? getClientIp(req) : undefined,
  });
}
