const ALLOWED_AVATAR_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export interface AvatarValidationResult {
  ok: boolean;
  error?: string;
  mime?: string;
  bytes?: number;
}

export function validateAvatarDataUrl(dataUrl: string): AvatarValidationResult {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    return { ok: false, error: 'Formato de imagem inválido.' };
  }

  const mime = match[1].toLowerCase();
  if (!ALLOWED_AVATAR_MIME.has(mime)) {
    return { ok: false, error: 'Tipo de imagem não permitido.' };
  }

  const base64 = match[2];
  const bytes = Math.ceil((base64.length * 3) / 4);
  if (bytes > MAX_AVATAR_BYTES) {
    return { ok: false, error: 'Imagem muito grande (máx. 2 MB).' };
  }

  if (/\.(exe|sh|bat|cmd|php|js|html|svg)/i.test(dataUrl)) {
    return { ok: false, error: 'Arquivo bloqueado por segurança.' };
  }

  return { ok: true, mime, bytes };
}

export function isBlockedUploadFilename(name: string): boolean {
  const lower = name.toLowerCase();
  const blocked = ['.exe', '.sh', '.bat', '.cmd', '.php', '.js', '.html', '.svg', '.msi', '.dll'];
  return blocked.some((ext) => lower.endsWith(ext));
}
