import fs from 'fs';
import path from 'path';

function getYtDlpBinaryInfo() {
  const isLinux = process.platform === 'linux';
  if (!isLinux) {
    return {
      fileName: 'yt-dlp',
      downloadUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
    };
  }

  const isArm64 = process.arch === 'arm64';
  return {
    fileName: isArm64 ? 'yt-dlp_linux_arm64' : 'yt-dlp_linux',
    downloadUrl: isArm64
      ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_arm64'
      : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux',
  };
}

async function main() {
  if (process.env.YT_DLP_PATH && fs.existsSync(process.env.YT_DLP_PATH)) {
    console.log(`[install-ytdlp] Using YT_DLP_PATH=${process.env.YT_DLP_PATH}`);
    return;
  }

  const binDir = path.join(process.cwd(), 'bin');
  const { fileName, downloadUrl } = getYtDlpBinaryInfo();
  const localBin = path.join(binDir, fileName);

  if (process.platform === 'linux') {
    const legacyScript = path.join(binDir, 'yt-dlp');
    if (fs.existsSync(legacyScript)) {
      try {
        fs.unlinkSync(legacyScript);
        console.log('[install-ytdlp] Removed legacy Python yt-dlp script');
      } catch {
        /* ignore */
      }
    }
  }

  if (fs.existsSync(localBin)) {
    console.log(`[install-ytdlp] Already present: ${localBin}`);
    return;
  }

  fs.mkdirSync(binDir, { recursive: true });
  console.log(`[install-ytdlp] Downloading ${downloadUrl}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  let res;
  try {
    res = await fetch(downloadUrl, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }

  if (!res?.ok) {
    console.warn(`[install-ytdlp] Download failed (${res?.status}); runtime will retry.`);
    return;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(localBin, buf, { mode: 0o755 });
  console.log(`[install-ytdlp] Installed ${localBin}`);
}

main().catch((err) => {
  console.warn('[install-ytdlp] Non-fatal error:', err.message);
});
