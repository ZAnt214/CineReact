import { hashToken } from './crypto.ts';
import { localDb } from '../db/local_db.ts';
import { getDataDir } from '../db/dataPaths.ts';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = path.join(getDataDir(), 'backups');

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
  const payload = JSON.stringify(snapshot, null, 2);
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

export function startAutoBackupScheduler(): void {
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
      createDatabaseBackup('Backup automático', 'system', true);
      console.log('[Security] Backup automático criado.');
    } catch (err) {
      console.error('[Security] Falha no backup automático:', err);
    }
  };

  setInterval(tick, 15 * 60 * 1000);
  setTimeout(tick, 2 * 60 * 1000);
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
