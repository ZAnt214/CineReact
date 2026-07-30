import { execFileSync } from 'child_process';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function getLinuxBinaryInfo() {
  const isArm64 = process.arch === 'arm64';
  return {
    fileName: isArm64 ? 'ffmpeg_linux_arm64' : 'ffmpeg_linux',
    archiveName: isArm64
      ? 'ffmpeg-n7.1-latest-linuxarm64-gpl-7.1.tar.xz'
      : 'ffmpeg-n7.1-latest-linux64-gpl-7.1.tar.xz',
    downloadUrl: isArm64
      ? 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n7.1-latest-linuxarm64-gpl-7.1.tar.xz'
      : 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n7.1-latest-linux64-gpl-7.1.tar.xz',
    innerPath: isArm64
      ? 'ffmpeg-n7.1-latest-linuxarm64-gpl-7.1/bin/ffmpeg'
      : 'ffmpeg-n7.1-latest-linux64-gpl-7.1/bin/ffmpeg',
  };
}

async function safeFetch(url: string): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    const res = await fetch(url, { ...{ signal: controller.signal } });
    clearTimeout(timeout);
    return res;
  } catch {
    return null;
  }
}

async function installLinuxBinary(localBin: string): Promise<boolean> {
  const info = getLinuxBinaryInfo();
  const binDir = path.dirname(localBin);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ffmpeg-install-'));
  const archivePath = path.join(tempDir, info.archiveName);

  try {
    const res = await safeFetch(info.downloadUrl);
    if (!res?.ok) return false;

    fs.writeFileSync(archivePath, Buffer.from(await res.arrayBuffer()));
    execFileSync('tar', ['-xJf', archivePath, '-C', tempDir, info.innerPath], { stdio: 'pipe' });

    const extracted = path.join(tempDir, info.innerPath);
    if (!fs.existsSync(extracted)) return false;

    fs.mkdirSync(binDir, { recursive: true });
    fs.copyFileSync(extracted, localBin);
    fs.chmodSync(localBin, 0o755);
    return true;
  } catch {
    return false;
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

export async function getFfmpegPath(): Promise<string> {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }

  if (process.platform === 'linux') {
    const info = getLinuxBinaryInfo();
    const localBin = path.join(process.cwd(), 'bin', info.fileName);
    if (fs.existsSync(localBin)) return localBin;

    const installed = await installLinuxBinary(localBin);
    if (installed && fs.existsSync(localBin)) return localBin;
  }

  return 'ffmpeg';
}

export function runFfmpeg(binary: string, args: string[], timeoutMs = 300_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(binary, args, { stdio: ['ignore', 'pipe', 'pipe'] });
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
        reject(new Error('FFmpeg não está disponível no servidor. Aguarde o redeploy ou contate o administrador.'));
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
