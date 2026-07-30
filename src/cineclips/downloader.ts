import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { detectClipPlatform, type ClipPlatform } from './platform.ts';
import { formatSecondsToDuration } from './utils.ts';

export interface ClipMediaMetadata {
  platform: ClipPlatform;
  platformId: string;
  titulo: string;
  descricao: string;
  criadorNome: string;
  thumbnailUrl: string;
  duracaoSegundos: number;
  sourceUrl: string;
}

export interface DownloadedClipMedia extends ClipMediaMetadata {
  videoPath: string;
  videoUrl: string;
  thumbnailPath?: string;
}

export function getClipsStorageDir(): string {
  const base =
    process.env.CINECLIPS_UPLOAD_DIR ||
    (process.env.NODE_ENV === 'production'
      ? path.join('/tmp', 'cineclips-uploads')
      : path.join(process.cwd(), 'uploads', 'cineclips'));
  fs.mkdirSync(base, { recursive: true });
  return base;
}

export function clipVideoPublicUrl(filename: string): string {
  return `/uploads/cineclips/${filename}`;
}

async function safeFetch(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch {
    return null;
  }
}

async function getYtDlpPath(): Promise<string> {
  if (process.env.YT_DLP_PATH && fs.existsSync(process.env.YT_DLP_PATH)) {
    return process.env.YT_DLP_PATH;
  }

  const binDir = path.join(process.cwd(), 'bin');
  const isLinux = process.platform === 'linux';
  const binaryName = isLinux ? 'yt-dlp_linux' : 'yt-dlp';
  const localBin = path.join(binDir, binaryName);

  if (fs.existsSync(localBin)) return localBin;

  // Remove legacy Python script if present (causes python3 errors on Railway)
  const legacyScript = path.join(binDir, 'yt-dlp');
  if (fs.existsSync(legacyScript) && isLinux) {
    try { fs.unlinkSync(legacyScript); } catch { /* ignore */ }
  }

  fs.mkdirSync(binDir, { recursive: true });
  const downloadUrl = isLinux
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

  const res = await safeFetch(downloadUrl);
  if (!res?.ok) throw new Error('Não foi possível baixar o utilitário de download de vídeos.');

  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(localBin, buf, { mode: 0o755 });
  return localBin;
}

function runYtDlp(args: string[], timeoutMs = 120_000): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let binary: string;
    try {
      binary = await getYtDlpPath();
    } catch (err) {
      reject(err);
      return;
    }

    const cookieArgs: string[] = [];
    if (process.env.YT_DLP_COOKIES && fs.existsSync(process.env.YT_DLP_COOKIES)) {
      cookieArgs.push('--cookies', process.env.YT_DLP_COOKIES);
    }

    const proc = spawn(binary, [...cookieArgs, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Tempo esgotado ao processar o vídeo.'));
    }, timeoutMs);

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr.trim() || `yt-dlp falhou (código ${code})`));
    });
    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function downloadFileToPath(fileUrl: string, destPath: string): Promise<void> {
  const res = await safeFetch(fileUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CineReact/1.0)',
      Referer: fileUrl.includes('tiktok') ? 'https://www.tiktok.com/' : undefined,
    } as HeadersInit,
  });
  if (!res?.ok) throw new Error('Falha ao baixar o arquivo de vídeo.');
  await pipeline(res.body as any, createWriteStream(destPath));
}

async function fetchTikTokViaTikwm(url: string): Promise<{
  id: string;
  titulo: string;
  criadorNome: string;
  thumbnailUrl: string;
  duracaoSegundos: number;
  directVideoUrl: string;
}> {
  const endpoints = [
    `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`,
    'https://www.tikwm.com/api/',
  ];

  for (const endpoint of endpoints) {
    const res = endpoint.includes('?')
      ? await safeFetch(endpoint)
      : await safeFetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `url=${encodeURIComponent(url)}`,
        });

    if (!res?.ok) continue;
    const data: any = await res.json();
    if (data?.code !== 0 || !data?.data) continue;

    const d = data.data;
    const directVideoUrl = d.hdplay || d.play || d.wmplay;
    if (!directVideoUrl) continue;

    return {
      id: String(d.id || d.aweme_id || Date.now()),
      titulo: (d.title || 'Clip TikTok').slice(0, 300),
      criadorNome: d.author?.nickname || d.author?.unique_id || 'Criador TikTok',
      thumbnailUrl: d.cover || d.origin_cover || '',
      duracaoSegundos: Number(d.duration) || 0,
      directVideoUrl,
    };
  }

  throw new Error('Não foi possível obter o vídeo do TikTok. Verifique se o link é público.');
}

async function fetchMetadataViaYtDlp(url: string, platform: ClipPlatform): Promise<ClipMediaMetadata> {
  const json = await runYtDlp(['--dump-json', '--no-download', '--no-warnings', url]);
  const data = JSON.parse(json.trim().split('\n').pop() || '{}');

  const duracaoSegundos = Math.round(Number(data.duration) || 0);
  const platformId = String(data.id || data.display_id || Date.now());

  return {
    platform,
    platformId,
    titulo: (data.title || data.fulltitle || `Clip ${platform}`).slice(0, 300),
    descricao: (data.description || '').slice(0, 2000),
    criadorNome: data.uploader || data.channel || data.creator || `Criador ${platform}`,
    thumbnailUrl: data.thumbnail || data.thumbnails?.[0]?.url || '',
    duracaoSegundos,
    sourceUrl: url,
  };
}

async function downloadViaYtDlp(url: string, outputBase: string): Promise<{ videoPath: string; metadata: any }> {
  const outputTemplate = `${outputBase}.%(ext)s`;
  await runYtDlp([
    '-f', 'best[ext=mp4]/best/bv*+ba',
    '--merge-output-format', 'mp4',
    '--no-warnings',
    '-o', outputTemplate,
    url,
  ], 180_000);

  const dir = path.dirname(outputBase);
  const baseName = path.basename(outputBase);
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(baseName + '.'));
  const videoFile = files.find((f) => /\.(mp4|webm|mkv)$/i.test(f));
  if (!videoFile) throw new Error('Arquivo de vídeo não gerado após download.');

  const videoPath = path.join(dir, videoFile);
  let metadata: any = {};
  try {
    const json = await runYtDlp(['--dump-json', '--no-download', '--no-warnings', url]);
    metadata = JSON.parse(json.trim().split('\n').pop() || '{}');
  } catch { /* metadata optional */ }

  return { videoPath, metadata };
}

export async function resolveClipMetadata(url: string): Promise<ClipMediaMetadata> {
  const platform = detectClipPlatform(url);
  if (platform === 'unknown') {
    throw new Error('URL não suportada. Use links do YouTube, TikTok ou Instagram.');
  }

  if (platform === 'tiktok') {
    try {
      const tk = await fetchTikTokViaTikwm(url);
      return {
        platform: 'tiktok',
        platformId: tk.id,
        titulo: tk.titulo,
        descricao: tk.titulo,
        criadorNome: tk.criadorNome,
        thumbnailUrl: tk.thumbnailUrl,
        duracaoSegundos: tk.duracaoSegundos,
        sourceUrl: url,
      };
    } catch {
      return fetchMetadataViaYtDlp(url, platform);
    }
  }

  return fetchMetadataViaYtDlp(url, platform);
}

export async function downloadAndHostClip(
  url: string,
  clipId: string,
  onProgress?: (progress: number, message?: string) => void
): Promise<DownloadedClipMedia> {
  const platform = detectClipPlatform(url);
  if (platform === 'unknown') {
    throw new Error('Plataforma não suportada para download.');
  }

  const storageDir = getClipsStorageDir();
  const outputBase = path.join(storageDir, clipId);
  onProgress?.(20, 'Obtendo metadados...');

  if (platform === 'tiktok') {
    try {
      const tk = await fetchTikTokViaTikwm(url);
      onProgress?.(50, 'Baixando vídeo do TikTok...');
      const videoPath = `${outputBase}.mp4`;
      await downloadFileToPath(tk.directVideoUrl, videoPath);

      if (tk.thumbnailUrl) {
        try {
          const thumbPath = `${outputBase}.jpg`;
          await downloadFileToPath(tk.thumbnailUrl, thumbPath);
        } catch { /* optional */ }
      }

      onProgress?.(90, 'Finalizando...');
      return {
        platform: 'tiktok',
        platformId: tk.id,
        titulo: tk.titulo,
        descricao: tk.titulo,
        criadorNome: tk.criadorNome,
        thumbnailUrl: tk.thumbnailUrl || clipVideoPublicUrl(`${clipId}.jpg`),
        duracaoSegundos: tk.duracaoSegundos || 30,
        sourceUrl: url,
        videoPath,
        videoUrl: clipVideoPublicUrl(`${clipId}.mp4`),
      };
    } catch (tikwmErr: any) {
      onProgress?.(40, 'Tentando método alternativo...');
      // fall through to yt-dlp
    }
  }

  onProgress?.(45, `Baixando de ${platform}...`);
  const { videoPath, metadata } = await downloadViaYtDlp(url, outputBase);
  const ext = path.extname(videoPath).replace('.', '') || 'mp4';
  const filename = `${clipId}.${ext}`;

  if (videoPath !== path.join(storageDir, filename)) {
    const finalPath = path.join(storageDir, filename);
    fs.renameSync(videoPath, finalPath);
  }

  const duracaoSegundos = Math.round(Number(metadata.duration) || 0);

  return {
    platform,
    platformId: String(metadata.id || clipId),
    titulo: (metadata.title || `Clip ${platform}`).slice(0, 300),
    descricao: (metadata.description || '').slice(0, 2000),
    criadorNome: metadata.uploader || metadata.channel || `Criador ${platform}`,
    thumbnailUrl: metadata.thumbnail || '',
    duracaoSegundos,
    sourceUrl: url,
    videoPath: path.join(storageDir, filename),
    videoUrl: clipVideoPublicUrl(filename),
  };
}

export function deleteHostedClipFiles(clipId: string): void {
  const dir = getClipsStorageDir();
  for (const file of fs.readdirSync(dir)) {
    if (file.startsWith(clipId + '.')) {
      try { fs.unlinkSync(path.join(dir, file)); } catch { /* ignore */ }
    }
  }
}

export function formatDurationLabel(seconds: number): string {
  return seconds > 0 ? formatSecondsToDuration(seconds) : '0:30';
}
