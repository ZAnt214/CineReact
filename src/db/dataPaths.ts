import * as fs from 'fs';
import * as path from 'path';

export function getDataDir(): string {
  const candidates = [
    process.env.CINE_REACT_DATA_DIR,
    process.env.RAILWAY_VOLUME_MOUNT_PATH,
    path.join(process.cwd(), 'data'),
    process.cwd(),
    path.join('/tmp', 'cine_react_data'),
    '/data',
  ].filter(Boolean) as string[];

  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      // Verify write access
      const testFile = path.join(dir, `.writable_test_${Date.now()}`);
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
      return dir;
    } catch {
      // Try next candidate if permission denied or invalid path
      continue;
    }
  }

  return process.cwd();
}

export function isValidJsonFile(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    const data = fs.readFileSync(filePath, 'utf-8');
    JSON.parse(data);
    return true;
  } catch {
    return false;
  }
}

/** Copia dados legados para o diretório persistente (Railway), ignorando JSON inválido. */
export function migrateLegacyFile(targetPath: string, legacyPaths: string[]): void {
  try {
    if (fs.existsSync(targetPath) && isValidJsonFile(targetPath)) return;

    if (fs.existsSync(targetPath) && !isValidJsonFile(targetPath)) {
      const quarantinePath = `${targetPath}.corrupt.${Date.now()}`;
      fs.renameSync(targetPath, quarantinePath);
      console.warn(`[data] JSON inválido em ${targetPath}; movido para ${quarantinePath}`);
    }

    for (const legacy of legacyPaths) {
      if (legacy === targetPath || !isValidJsonFile(legacy)) continue;
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(legacy, targetPath);
      console.log(`[data] Migrado ${legacy} → ${targetPath}`);
      return;
    }
  } catch (err) {
    console.warn('[data] Aviso ao migrar arquivo legado:', err);
  }
}

export function migrateLegacyDir(targetDir: string, legacyDirs: string[]): void {
  try {
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
  } catch (err) {
    console.warn('[data] Aviso ao migrar diretório legado:', err);
  }
}
