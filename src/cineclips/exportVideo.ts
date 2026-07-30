import * as fs from 'fs';
import * as path from 'path';
import { execFileSync, spawnSync } from 'child_process';
import type { CineClip } from '../types/cineclips.ts';
import { getClipsStorageDir } from './downloader.ts';
import { getFfmpegPath, runFfmpeg } from './ffmpegBinary.ts';

const WATERMARK_VERSION = 'v3';
const WATERMARK_SVG = path.join(process.cwd(), 'assets', 'cineclips', 'watermark-banner.svg');
const WATERMARK_PNG = path.join(process.cwd(), 'assets', 'cineclips', 'watermark-banner.png');

function getExportsDir(): string {
  const base =
    process.env.CINECLIPS_EXPORT_DIR ||
    (process.env.NODE_ENV === 'production'
      ? path.join('/tmp', 'cineclips-exports')
      : path.join(process.cwd(), 'uploads', 'cineclips-exports'));
  fs.mkdirSync(base, { recursive: true });
  return base;
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'clip';
}

function resolveHostedVideoPath(clip: CineClip): string | null {
  if (!clip.videoUrl) return null;

  const pathname = clip.videoUrl.replace(/^https?:\/\/[^/]+/i, '');
  const filename = path.basename(pathname);
  if (!filename) return null;

  const localPath = path.join(getClipsStorageDir(), filename);
  return fs.existsSync(localPath) ? localPath : null;
}

function escapeFfmpegPath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
}

function rasterizeWatermarkSvg(ffmpegPath: string): boolean {
  if (!fs.existsSync(WATERMARK_SVG)) return false;

  try {
    execFileSync('rsvg-convert', ['-w', '1080', '-o', WATERMARK_PNG, WATERMARK_SVG], { stdio: 'pipe' });
    return fs.existsSync(WATERMARK_PNG);
  } catch {
    const result = spawnSync(
      ffmpegPath,
      ['-y', '-hide_banner', '-loglevel', 'error', '-i', WATERMARK_SVG, WATERMARK_PNG],
      { stdio: 'pipe' }
    );
    return result.status === 0 && fs.existsSync(WATERMARK_PNG);
  }
}

async function ensureWatermarkPng(ffmpegPath: string): Promise<string> {
  if (fs.existsSync(WATERMARK_PNG)) {
    if (!fs.existsSync(WATERMARK_SVG) || fs.statSync(WATERMARK_PNG).mtimeMs >= fs.statSync(WATERMARK_SVG).mtimeMs) {
      return WATERMARK_PNG;
    }
  }

  fs.mkdirSync(path.dirname(WATERMARK_PNG), { recursive: true });
  if (rasterizeWatermarkSvg(ffmpegPath)) return WATERMARK_PNG;

  throw new Error('Banner CineReact não pôde ser gerado. Aguarde o redeploy do servidor.');
}

function buildWatermarkFilter(watermarkPath: string): string {
  const overlay = escapeFfmpegPath(watermarkPath);
  return [
    "[0:v]scale='min(1080,iw)':-2[base]",
    "[1:v]scale='min(720,iw*0.88)':-1[wm]",
    '[base][wm]overlay=(W-w)/2:(H-h)/2:format=auto,format=yuv420p',
  ].join(';');
}

export function canExportClip(clip: CineClip): boolean {
  return !!resolveHostedVideoPath(clip);
}

export function buildClipDownloadFilename(clip: CineClip): string {
  return `cinereact-${slugify(clip.titulo)}.mp4`;
}

export async function exportClipWithBranding(clip: CineClip): Promise<{ filePath: string; filename: string }> {
  const sourcePath = resolveHostedVideoPath(clip);
  if (!sourcePath) {
    throw new Error(
      'Este clip não possui arquivo hospedado. Apenas vídeos importados do TikTok ou Instagram podem ser baixados com marca CineReact.'
    );
  }

  const exportsDir = getExportsDir();
  const outputPath = path.join(exportsDir, `${clip.id}-branded-${WATERMARK_VERSION}.mp4`);
  const filename = buildClipDownloadFilename(clip);
  const sourceMtime = fs.statSync(sourcePath).mtimeMs;

  fs.mkdirSync(exportsDir, { recursive: true });

  if (fs.existsSync(outputPath)) {
    const cachedMtime = fs.statSync(outputPath).mtimeMs;
    if (cachedMtime >= sourceMtime) {
      return { filePath: outputPath, filename };
    }
  }

  const ffmpegPath = await getFfmpegPath();
  const watermarkPath = await ensureWatermarkPng(ffmpegPath);
  const filterComplex = buildWatermarkFilter(watermarkPath);

  await runFfmpeg(ffmpegPath, [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    sourcePath,
    '-i',
    watermarkPath,
    '-filter_complex',
    filterComplex,
    '-map_metadata',
    '-1',
    '-metadata',
    'title=',
    '-metadata',
    'artist=',
    '-metadata',
    'album=',
    '-metadata',
    'comment=',
    '-metadata',
    'description=',
    '-metadata',
    'encoder=',
    '-map',
    '0:a?',
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '23',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    outputPath,
  ]);

  return { filePath: outputPath, filename };
}
