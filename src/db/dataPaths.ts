import * as fs from 'fs';
import * as path from 'path';

export function getDataDir(): string {
  const base =
    process.env.CINE_REACT_DATA_DIR ||
    (process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'data')
      : process.cwd());

  fs.mkdirSync(base, { recursive: true });
  return base;
}

/** Copia dados legados de /tmp para o diretório persistente (Railway). */
export function migrateLegacyFile(targetPath: string, legacyPaths: string[]): void {
  if (fs.existsSync(targetPath)) return;

  for (const legacy of legacyPaths) {
    if (legacy === targetPath || !fs.existsSync(legacy)) continue;
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(legacy, targetPath);
    console.log(`[data] Migrado ${legacy} → ${targetPath}`);
    return;
  }
}

export function migrateLegacyDir(targetDir: string, legacyDirs: string[]): void {
  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) return;

  for (const legacy of legacyDirs) {
    if (legacy === targetDir || !fs.existsSync(legacy)) continue;
    const entries = fs.readdirSync(legacy);
    if (entries.length === 0) continue;

    fs.mkdirSync(targetDir, { recursive: true });
    for (const entry of entries) {
      const src = path.join(legacy, entry);
      const dest = path.join(targetDir, entry);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
      }
    }
    console.log(`[data] Migrados ${entries.length} arquivos de ${legacy} → ${targetDir}`);
    return;
  }
}
