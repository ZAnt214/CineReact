import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';

function getFfmpegBinaryInfo() {
  const isLinux = process.platform === 'linux';
  if (!isLinux) {
    return null;
  }

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

async function downloadFile(url, destPath) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res?.ok) throw new Error(`HTTP ${res?.status || 'error'}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buf);
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    console.log(`[install-ffmpeg] Using FFMPEG_PATH=${process.env.FFMPEG_PATH}`);
    return;
  }

  const info = getFfmpegBinaryInfo();
  if (!info) {
    console.log('[install-ffmpeg] Non-Linux platform; expecting ffmpeg in PATH.');
    return;
  }

  const binDir = path.join(process.cwd(), 'bin');
  const localBin = path.join(binDir, info.fileName);
  if (fs.existsSync(localBin)) {
    console.log(`[install-ffmpeg] Already present: ${localBin}`);
    return;
  }

  fs.mkdirSync(binDir, { recursive: true });
  const tempDir = mkdtempSync(path.join(tmpdir(), 'ffmpeg-install-'));
  const archivePath = path.join(tempDir, info.archiveName);

  try {
    console.log(`[install-ffmpeg] Downloading ${info.downloadUrl}`);
    await downloadFile(info.downloadUrl, archivePath);

    execFileSync('tar', ['-xJf', archivePath, '-C', tempDir, info.innerPath], { stdio: 'pipe' });
    const extracted = path.join(tempDir, info.innerPath);
    fs.copyFileSync(extracted, localBin);
    fs.chmodSync(localBin, 0o755);
    console.log(`[install-ffmpeg] Installed ${localBin}`);
  } catch (err) {
    console.warn(`[install-ffmpeg] Non-fatal error: ${err.message}`);
  } finally {
    try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

main().catch((err) => {
  console.warn('[install-ffmpeg] Non-fatal error:', err.message);
});
