import * as fs from 'fs';
import * as path from 'path';
import type { CineClip } from '../types/cineclips.ts';
import { getClipsStorageDir } from './downloader.ts';
import { getFfmpegPath, runFfmpeg } from './ffmpegBinary.ts';

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

function getFontsDir(): string {
  return path.join(process.cwd(), 'assets', 'fonts');
}

function escapeFfmpegPath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/:/g, '\\:');
}

function resolveWatermarkFont(bold = false): string {
  const fontsDir = getFontsDir();
  const fileName = bold ? 'DejaVuSans-Bold.ttf' : 'DejaVuSans.ttf';
  const fontPath = path.join(fontsDir, fileName);

  if (!fs.existsSync(fontPath)) {
    throw new Error('Fontes do exportador não estão disponíveis. Aguarde o redeploy do servidor.');
  }

  return escapeFfmpegPath(fontPath);
}

function buildWatermarkFilter(): string {
  const boldFont = resolveWatermarkFont(true);
  const regularFont = resolveWatermarkFont(false);

  return [
    "scale='min(1080,iw)':-2",
    'drawbox=x=0:y=ih-92:w=iw:h=92:color=black@0.68:t=fill',
    `drawtext=fontfile=${boldFont}:text='CINE':fontsize=32:fontcolor=white:x=(w-text_w)/2-54:y=h-72`,
    `drawtext=fontfile=${boldFont}:text='REACT':fontsize=32:fontcolor=0x38bdf8:x=(w-text_w)/2+22:y=h-72`,
    `drawtext=fontfile=${regularFont}:text='cinereactoficial.netlify.app':fontsize=14:fontcolor=white@0.78:x=(w-text_w)/2:y=h-38`,
    `drawtext=fontfile=${regularFont}:text='CineReact':fontsize=18:fontcolor=white@0.55:x=w-tw-24:y=24`,
  ].join(',');
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
  const outputPath = path.join(exportsDir, `${clip.id}-branded.mp4`);
  const filename = buildClipDownloadFilename(clip);
  const sourceMtime = fs.statSync(sourcePath).mtimeMs;

  fs.mkdirSync(exportsDir, { recursive: true });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  if (fs.existsSync(outputPath)) {
    const cachedMtime = fs.statSync(outputPath).mtimeMs;
    if (cachedMtime >= sourceMtime) {
      return { filePath: outputPath, filename };
    }
  }

  const watermarkFilter = buildWatermarkFilter();
  const ffmpegPath = await getFfmpegPath();

  await runFfmpeg(ffmpegPath, [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    sourcePath,
    '-vf',
    watermarkFilter,
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
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '23',
    '-pix_fmt',
    'yuv420p',
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
