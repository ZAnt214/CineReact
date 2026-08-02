import fs from 'fs';
import path from 'path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const distIndex = path.join(process.cwd(), 'dist', 'index.html');

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

require(path.join(process.cwd(), 'dist', 'server.cjs'));
