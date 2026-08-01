import type { ReactVideo } from '../types.ts';

export function isShortOrInvalidVideo(r: ReactVideo | null | undefined): boolean {
  if (!r) return true;

  if (!r.thumbnailUrl || r.thumbnailUrl.trim() === '' || r.thumbnailUrl.includes('no_thumbnail')) {
    return true;
  }

  const lowerTitle = (r.titulo || '').toLowerCase();
  const shortsKeywords = [
    '#shorts', '#short', '#reels', '#tiktok', '#shortsyoutube', '#shortsvideo',
    '#viralshorts', '#ytshorts', '#shortsfeed', '#shortsclip', ' #shorts', ' #reels', ' #short',
  ];
  if (shortsKeywords.some((kw) => lowerTitle.includes(kw))) {
    return true;
  }

  const duracaoStr = r.duracao;
  if (!duracaoStr) return false;

  const parts = duracaoStr.split(':');
  if (parts.length === 3) return false;

  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (Number.isNaN(mins) || Number.isNaN(secs)) return false;
    return mins * 60 + secs <= 120;
  }

  if (parts.length === 1) {
    const secs = parseInt(parts[0], 10);
    if (Number.isNaN(secs)) return false;
    return secs <= 120;
  }

  return false;
}

export function filterCatalogReacts(reacts: ReactVideo[]): ReactVideo[] {
  return reacts.filter((r) => !isShortOrInvalidVideo(r));
}
