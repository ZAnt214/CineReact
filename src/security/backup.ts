import { hashToken } from './crypto.ts';
import { localDb } from '../db/local_db.ts';
import { getDataDir } from '../db/dataPaths.ts';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = path.join(getDataDir(), 'backups');
let backupInProgress = false;

export function ensureBackupDir(): void {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export function createDatabaseBackup(label: string, createdBy: string, auto = false): {
  id: string;
  filePath: string;
  sizeBytes: number;
} {
  ensureBackupDir();
  const snapshot = localDb.exportDbSnapshotRedacted();
  const id = `backup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const filePath = path.join(BACKUP_DIR, `${id}.json`);
  const compact = process.env.NODE_ENV === 'production';
  const payload = compact ? JSON.stringify(snapshot) : JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(filePath, payload, 'utf8');

  const record = {
    id,
    label,
    sizeBytes: Buffer.byteLength(payload, 'utf8'),
    createdAt: new Date().toISOString(),
    createdBy,
    auto,
    fileName: path.basename(filePath),
  };
  localDb.saveBackupRecord(record);
  return { id, filePath, sizeBytes: record.sizeBytes };
}

function runBackupAsync(label: string, createdBy: string, auto: boolean): void {
  if (backupInProgress) return;
  backupInProgress = true;
  setImmediate(() => {
    try {
      const result = createDatabaseBackup(label, createdBy, auto);
      console.log(`[Security] Backup criado (${Math.round(result.sizeBytes / 1024)} KB).`);
    } catch (err) {
      console.error('[Security] Falha no backup automático:', err);
    } finally {
      backupInProgress = false;
    }
  });
}

export function startAutoBackupScheduler(): void {
  if (
    process.env.DISABLE_AUTO_BACKUP === '1' ||
    process.env.DISABLE_AUTO_BACKUP === 'true' ||
    process.env.RAILWAY_ENVIRONMENT
  ) {
    console.log('[Security] Backup automático desativado no Railway (use backup manual no painel admin).');
    return;
  }

  const tick = () => {
    try {
      const settings = localDb.getAdminConfig().settings;
      if (!settings.autoBackupEnabled) return;
      const hours = Math.max(6, settings.autoBackupIntervalHours || 24);
      const backups = localDb.getBackupRecords();
      const last = backups[0];
      if (last) {
        const elapsed = Date.now() - new Date(last.createdAt).getTime();
        if (elapsed < hours * 60 * 60 * 1000) return;
      }
      runBackupAsync('Backup automático', 'system', true);
    } catch (err) {
      console.error('[Security] Falha ao agendar backup automático:', err);
    }
  };

  setInterval(tick, 15 * 60 * 1000);
  setTimeout(tick, 30 * 60 * 1000);
}

export function createCaptchaChallenge(): { id: string; question: string } {
  const a = Math.floor(Math.random() * 7) + 2;
  const b = Math.floor(Math.random() * 7) + 2;
  const answer = String(a + b);
  const id = `cap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const answerHash = hashToken(`${id}:${answer}`);
  localDb.saveCaptchaChallenge({
    id,
    answerHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    used: false,
  });
  return { id, question: `Quanto é ${a} + ${b}?` };
}

export function verifyCaptchaChallenge(id: string, answer: string): boolean {
  return localDb.consumeCaptchaChallenge(id, answer);
}
