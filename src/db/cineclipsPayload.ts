import type {
  CineClip,
  CineClipComment,
  CineClipFavorite,
  CineClipImportJob,
  CineClipLike,
  CineClipReport,
  CineClipShare,
  CineClipWatchEvent,
} from '../types/cineclips.ts';

export interface CineClipsPayload {
  cineClips: CineClip[];
  cineClipComments: CineClipComment[];
  cineClipLikes: CineClipLike[];
  cineClipFavorites: CineClipFavorite[];
  cineClipShares: CineClipShare[];
  cineClipReports: CineClipReport[];
  cineClipImportJobs: CineClipImportJob[];
  cineClipWatchHistory: CineClipWatchEvent[];
  updatedAt: string;
}

export const CINECLIPS_PAYLOAD_ID = 'main';

export function buildCineClipsPayload(source: {
  cineClips?: CineClip[];
  cineClipComments?: CineClipComment[];
  cineClipLikes?: CineClipLike[];
  cineClipFavorites?: CineClipFavorite[];
  cineClipShares?: CineClipShare[];
  cineClipReports?: CineClipReport[];
  cineClipImportJobs?: CineClipImportJob[];
  cineClipWatchHistory?: CineClipWatchEvent[];
}): CineClipsPayload {
  return {
    cineClips: source.cineClips || [],
    cineClipComments: source.cineClipComments || [],
    cineClipLikes: source.cineClipLikes || [],
    cineClipFavorites: source.cineClipFavorites || [],
    cineClipShares: source.cineClipShares || [],
    cineClipReports: source.cineClipReports || [],
    cineClipImportJobs: source.cineClipImportJobs || [],
    cineClipWatchHistory: source.cineClipWatchHistory || [],
    updatedAt: new Date().toISOString(),
  };
}

export function mergeCineClipsPayload(
  local: CineClipsPayload,
  remote: CineClipsPayload
): CineClipsPayload {
  // Restauração após deploy: disco local vazio → usar Supabase como fonte
  if (local.cineClips.length === 0 && remote.cineClips.length > 0) {
    return {
      ...remote,
      cineClipComments: remote.cineClipComments.length ? remote.cineClipComments : local.cineClipComments,
      cineClipLikes: [...remote.cineClipLikes, ...local.cineClipLikes],
      cineClipFavorites: [...remote.cineClipFavorites, ...local.cineClipFavorites],
      updatedAt: new Date().toISOString(),
    };
  }

  const clipMap = new Map<string, CineClip>();
  for (const clip of remote.cineClips) clipMap.set(clip.id, clip);
  for (const clip of local.cineClips) {
    const existing = clipMap.get(clip.id);
    if (!existing) {
      clipMap.set(clip.id, clip);
      continue;
    }
    const localTime = new Date(clip.atualizadoEm || clip.criadoEm || 0).getTime();
    const remoteTime = new Date(existing.atualizadoEm || existing.criadoEm || 0).getTime();
    clipMap.set(clip.id, localTime >= remoteTime ? clip : existing);
  }

  // Clips adicionados em outra instância ainda não no disco local
  if (local.cineClips.length > 0) {
    const localIds = new Set(local.cineClips.map((c) => c.id));
    for (const clip of remote.cineClips) {
      if (!localIds.has(clip.id)) {
        clipMap.set(clip.id, clip);
      }
    }
  }

  const mergeById = <T extends { id: string }>(a: T[], b: T[]) => {
    const map = new Map<string, T>();
    for (const item of b) map.set(item.id, item);
    for (const item of a) map.set(item.id, item);
    return Array.from(map.values());
  };

  const mergeJobs = (a: CineClipImportJob[], b: CineClipImportJob[]) => {
    const map = new Map<string, CineClipImportJob>();
    for (const job of b) map.set(job.id, job);
    for (const job of a) map.set(job.id, job);
    return Array.from(map.values()).sort(
      (x, y) => new Date(y.criadoEm).getTime() - new Date(x.criadoEm).getTime()
    );
  };

  const mergeSimple = <T>(a: T[], b: T[], key: (item: T) => string) => {
    const map = new Map<string, T>();
    for (const item of b) map.set(key(item), item);
    for (const item of a) map.set(key(item), item);
    return Array.from(map.values());
  };

  return {
    cineClips: Array.from(clipMap.values()).sort(
      (a, b) => new Date(b.publicadoEm || b.criadoEm).getTime() - new Date(a.publicadoEm || a.criadoEm).getTime()
    ),
    cineClipComments: mergeById(local.cineClipComments, remote.cineClipComments),
    cineClipLikes: mergeSimple(local.cineClipLikes, remote.cineClipLikes, (l) => `${l.clipId}:${l.usuarioEmail}`),
    cineClipFavorites: mergeSimple(local.cineClipFavorites, remote.cineClipFavorites, (f) => `${f.clipId}:${f.usuarioEmail}`),
    cineClipShares: mergeSimple(
      local.cineClipShares,
      remote.cineClipShares,
      (s) => `${s.clipId}:${s.usuarioEmail || 'anon'}:${s.criadoEm}`
    ),
    cineClipReports: mergeById(local.cineClipReports, remote.cineClipReports),
    cineClipImportJobs: mergeJobs(local.cineClipImportJobs, remote.cineClipImportJobs),
    cineClipWatchHistory: mergeSimple(
      local.cineClipWatchHistory,
      remote.cineClipWatchHistory,
      (w) => `${w.clipId}:${w.usuarioEmail}:${w.criadoEm}`
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function applyCineClipsPayload(
  target: {
    cineClips?: CineClip[];
    cineClipComments?: CineClipComment[];
    cineClipLikes?: CineClipLike[];
    cineClipFavorites?: CineClipFavorite[];
    cineClipShares?: CineClipShare[];
    cineClipReports?: CineClipReport[];
    cineClipImportJobs?: CineClipImportJob[];
    cineClipWatchHistory?: CineClipWatchEvent[];
  },
  payload: CineClipsPayload
): void {
  target.cineClips = payload.cineClips;
  target.cineClipComments = payload.cineClipComments;
  target.cineClipLikes = payload.cineClipLikes;
  target.cineClipFavorites = payload.cineClipFavorites;
  target.cineClipShares = payload.cineClipShares;
  target.cineClipReports = payload.cineClipReports;
  target.cineClipImportJobs = payload.cineClipImportJobs;
  target.cineClipWatchHistory = payload.cineClipWatchHistory;
}
