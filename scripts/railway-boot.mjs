import fs from 'fs';
import path from 'path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const distIndex = path.join(process.cwd(), 'dist', 'index.html');

async function verifyWritableDir(dir, timeoutMs = 4000) {
  const testFile = path.join(dir, `.boot_test_${Date.now()}`);
  await Promise.race([
    (async () => {
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(testFile, 'ok', 'utf-8');
      await fs.promises.unlink(testFile);
    })(),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

async function prepareDataDir() {
  const preferred = process.env.CINE_REACT_DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH;
  if (!preferred) return;

  try {
    await verifyWritableDir(preferred);
    console.log('[BOOT] Diretório de dados OK:', preferred);
  } catch (err) {
    const fallback = path.join('/tmp', 'cine_react_data');
    console.warn(
      `[BOOT] Diretório de dados indisponível (${preferred}):`,
      err instanceof Error ? err.message : err,
      `— usando fallback ${fallback}`
    );
    process.env.CINE_REACT_DATA_DIR = fallback;
    process.env.CINECLIPS_UPLOAD_DIR = path.join(fallback, 'cineclips-uploads');
    await verifyWritableDir(fallback);
  }
}

console.log('[BOOT] Ambiente:', {
  cwd: process.cwd(),
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  railway: process.env.RAILWAY_ENVIRONMENT,
  dataDir: process.env.CINE_REACT_DATA_DIR,
  distReady: fs.existsSync(distIndex),
});

process.on('uncaughtException', (err) => {
  console.error('[BOOT] uncaughtException:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('[BOOT] unhandledRejection:', err);
  process.exit(1);
});

await prepareDataDir();
require(path.join(process.cwd(), 'dist', 'server.cjs'));
