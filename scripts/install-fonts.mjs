import fs from 'fs';
import path from 'path';

const REQUIRED = ['DejaVuSans.ttf', 'DejaVuSans-Bold.ttf'];

function main() {
  const fontsDir = path.join(process.cwd(), 'assets', 'fonts');
  const missing = REQUIRED.filter((name) => !fs.existsSync(path.join(fontsDir, name)));

  if (missing.length > 0) {
    console.warn(`[install-fonts] Missing bundled fonts: ${missing.join(', ')}`);
    return;
  }

  console.log('[install-fonts] Bundled fonts OK');
}

main();
