import fs from 'fs';
import path from 'path';
import { execFileSync, spawnSync } from 'child_process';

const ASSETS_DIR = path.join(process.cwd(), 'assets', 'cineclips');
const SVG_PATH = path.join(ASSETS_DIR, 'watermark-banner.svg');
const PNG_PATH = path.join(ASSETS_DIR, 'watermark-banner.png');

function tryRsvgConvert() {
  try {
    execFileSync('rsvg-convert', ['-w', '600', '-o', PNG_PATH, SVG_PATH], { stdio: 'pipe' });
    return fs.existsSync(PNG_PATH);
  } catch {
    return false;
  }
}

function tryFfmpegConvert() {
  const ffmpegCandidates = [
    process.env.FFMPEG_PATH,
    path.join(process.cwd(), 'bin', 'ffmpeg_linux'),
    path.join(process.cwd(), 'bin', 'ffmpeg_linux_arm64'),
    'ffmpeg',
  ].filter(Boolean);

  for (const ffmpeg of ffmpegCandidates) {
    const result = spawnSync(
      ffmpeg,
      ['-y', '-hide_banner', '-loglevel', 'error', '-i', SVG_PATH, PNG_PATH],
      { stdio: 'pipe' }
    );
    if (result.status === 0 && fs.existsSync(PNG_PATH)) return true;
  }
  return false;
}

function main() {
  if (!fs.existsSync(SVG_PATH)) {
    console.warn('[build-watermark] SVG not found, skipping.');
    return;
  }

  if (fs.existsSync(PNG_PATH) && fs.statSync(PNG_PATH).mtimeMs >= fs.statSync(SVG_PATH).mtimeMs) {
    console.log('[build-watermark] PNG up to date');
    return;
  }

  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  if (tryRsvgConvert() || tryFfmpegConvert()) {
    console.log(`[build-watermark] Generated ${PNG_PATH}`);
    return;
  }

  console.warn('[build-watermark] Could not rasterize SVG; export will try at runtime.');
}

main();
