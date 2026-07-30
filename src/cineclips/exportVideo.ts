import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import type { CineClip } from '../types/cineclips.ts';
import { getClipsStorageDir } from './downloader.ts';

const FONT_CANDIDATES = [
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
];

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

function resolveFont(bold = false): string | undefined {
  const preferred = bold ? FONT_CANDIDATES : [...FONT_CANDIDATES].reverse();
  return preferred.find((candidate) => fs.existsSync(candidate));
}

function resolveHostedVideoPath(clip: CineClip): string | null {
  if (!clip.videoUrl) return null;

  const pathname = clip.videoUrl.replace(/^https?:\/\/[^/]+/i, '');
  const filename = path.basename(pathname);
  if (!filename) return null;

  const localPath = path.join(getClipsStorageDir(), filename);
  return fs.existsSync(localPath) ? localPath : null;
}

function buildWatermarkFilter(): string {
  const boldFont = resolveFont(true);
  const regularFont = resolveFont(false);
  const fontBold = boldFont ? `:fontfile=${boldFont}` : '';
  const fontRegular = regularFont ? `:fontfile=${regularFont}` : '';

  return [
    "scale='min(1080,iw)':-2",
    'drawbox=x=0:y=ih-92:w=iw:h=92:color=black@0.68:t=fill',
    `drawtext=text='CINE'${fontBold}:fontsize=32:fontcolor=white:x=(w-text_w)/2-54:y=h-72`,
    `drawtext=text='REACT'${fontBold}:fontsize=32:fontcolor=0x38bdf8:x=(w-text_w)/2+22:y=h-72`,
    `drawtext=text='cinereactoficial.netlify.app'${fontRegular}:fontsize=14:fontcolor=white@0.78:x=(w-text_w)/2:y=h-38`,
    `drawtext=text='CineReact'${fontRegular}:fontsize=18:fontcolor=white@0.55:x=w-tw-24:y=24`,
  ].join(',');
}

function runFfmpeg(args: string[], timeoutMs = 300_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Tempo esgotado ao processar o vídeo para download.'));
    }, timeoutMs);

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new Error('FFmpeg não está disponível no servidor. Contate o administrador.'));
        return;
      }
      reject(err);
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr.trim().slice(-600) || `FFmpeg falhou (código ${code}).`));
    });
  });
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

  if (fs.existsSync(outputPath)) {
    const cachedMtime = fs.statSync(outputPath).mtimeMs;
    if (cachedMtime >= sourceMtime) {
      return { filePath: outputPath, filename };
    }
  }

  const watermarkFilter = buildWatermarkFilter();

  await runFfmpeg([
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
