import type { Express, Request, Response } from 'express';
import { localDb } from '../db/local_db.ts';
import type { CineClip, CineClipComment, CineClipImportJob } from '../types/cineclips.ts';
import {
  extractHashtags,
  extractVideoIdFromUrl,
  formatSecondsToDuration,
  getClipDurationRejection,
  computeTrendingScore,
  parseDurationToSeconds,
  hasShortFormSignals,
} from './utils.ts';
import {
  recommendClips,
  getTrendingClips,
  getRelatedClips,
  deriveUserPreferences,
} from './recommendation.ts';
import { handleGamificationEvent, enrichCommentAuthorProfile } from '../gamification/serverHelpers.ts';
import { detectClipPlatform, platformLabel } from './platform.ts';
import {
  downloadAndHostClip,
  resolveClipMetadata,
  deleteHostedClipFiles,
  formatDurationLabel,
  withResolvedMediaUrls,
} from './downloader.ts';
import { exportClipWithBranding } from './exportVideo.ts';
import { maskClipForViewer, canUserViewClip } from '../finance/clipAccess.ts';
import type { SecurityContext } from '../security/types.ts';
import { requireSessionEmail, sessionEmailOrUndefined } from '../security/sessionBinding.ts';

function enrichCineClipComment(comment: CineClipComment) {
  return enrichCommentAuthorProfile(comment);
}


async function adminOnly(requireAdmin: RequireAdmin, req: Request, res: Response): Promise<string | null> {
  const email = await requireAdmin(req, res);
  return email;
}

async function safeFetch(url: string): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch {
    return null;
  }
}

async function resolveYoutubeClipMetadata(url: string): Promise<{
  ok: true;
  videoId: string;
  titulo: string;
  descricao: string;
  criadorNome: string;
  thumbnailUrl: string;
  duracaoSegundos: number;
} | { ok: false; error: string; code: string; alternatives?: string[] }> {
  const videoId = extractVideoIdFromUrl(url);
  if (!videoId) {
    return {
      ok: false,
      error: 'URL não reconhecida. Use links do YouTube (watch, youtu.be ou shorts).',
      code: 'INVALID_URL',
      alternatives: ['Cole um link direto do YouTube Shorts', 'Use o formato https://youtube.com/shorts/VIDEO_ID'],
    };
  }

  if (localDb.isDuplicateClip(videoId, url)) {
    return {
      ok: false,
      error: 'Este vídeo já está cadastrado no CineClips.',
      code: 'DUPLICATE',
    };
  }

  const normalizedUrl = url.includes('shorts')
    ? `https://www.youtube.com/shorts/${videoId}`
    : `https://www.youtube.com/watch?v=${videoId}`;

  let titulo = '';
  let descricao = '';
  let criadorNome = 'Criador';
  let thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  let duracaoSegundos = 0;

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey && apiKey !== 'MY_YOUTUBE_API_KEY') {
    const apiRes = await safeFetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${videoId}&key=${apiKey}`
    );
    if (apiRes?.ok) {
      const data: any = await apiRes.json();
      const item = data.items?.[0];
      if (!item) {
        return { ok: false, error: 'Vídeo não encontrado ou indisponível.', code: 'NOT_FOUND' };
      }
      if (item.status?.privacyStatus !== 'public') {
        return {
          ok: false,
          error: 'Vídeo não é público. Apenas conteúdo público pode ser importado.',
          code: 'NOT_PUBLIC',
          alternatives: ['Verifique se o vídeo está público no YouTube', 'Tente outro link de Shorts'],
        };
      }
      if (item.status?.embeddable === false) {
        return {
          ok: false,
          error: 'O criador desabilitou a incorporação deste vídeo.',
          code: 'NOT_EMBEDDABLE',
          alternatives: ['Peça ao criador para habilitar incorporação', 'Use upload próprio se tiver permissão'],
        };
      }

      titulo = item.snippet?.title || '';
      descricao = item.snippet?.description || '';
      criadorNome = item.snippet?.channelTitle || 'Criador';
      thumbnailUrl =
        item.snippet?.thumbnails?.maxres?.url ||
        item.snippet?.thumbnails?.high?.url ||
        thumbnailUrl;

      const iso = item.contentDetails?.duration || '';
      const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (match) {
        duracaoSegundos =
          (parseInt(match[1] || '0', 10) * 3600) +
          (parseInt(match[2] || '0', 10) * 60) +
          (parseInt(match[3] || '0', 10));
      }
    }
  }

  if (!titulo) {
    const oembedRes = await safeFetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(normalizedUrl)}&format=json`
    );
    if (!oembedRes?.ok) {
      return {
        ok: false,
        error: 'Não foi possível acessar os metadados do vídeo.',
        code: 'METADATA_FAILED',
        alternatives: ['Verifique se o link está correto', 'Tente novamente em alguns minutos'],
      };
    }
    const oembed: any = await oembedRes.json();
    titulo = oembed.title || 'Clip sem título';
    criadorNome = oembed.author_name || 'Criador';
    thumbnailUrl = oembed.thumbnail_url || thumbnailUrl;
  }

  const durationError = getClipDurationRejection(duracaoSegundos, titulo, descricao);
  if (durationError && duracaoSegundos > 0) {
    const isShortSignal = hasShortFormSignals(titulo, descricao);
    if (!isShortSignal) {
      return {
        ok: false,
        error: durationError,
        code: 'TOO_LONG',
        alternatives: [
          'Use vídeos curtos de reação (até 3 minutos)',
          'Importe via YouTube Shorts',
          'Edite e faça upload de uma versão curta',
        ],
      };
    }
  }

  return {
    ok: true,
    videoId,
    titulo,
    descricao: descricao.slice(0, 2000),
    criadorNome,
    thumbnailUrl,
    duracaoSegundos: duracaoSegundos || 60,
  };
}

function buildClipFromPayload(payload: any, id?: string): CineClip {
  const now = new Date().toISOString();
  const hashtags = [
    ...extractHashtags(`${payload.titulo || ''} ${payload.descricao || ''}`),
    ...(payload.tags || []).map((t: string) => (t.startsWith('#') ? t : `#${t}`)),
  ];
  const uniqueHashtags = [...new Set(hashtags.map((h) => h.toLowerCase()))];
  const duracaoSegundos = payload.duracaoSegundos || parseDurationToSeconds(payload.duracao || '1:00');

  const clip: CineClip = {
    id: id || payload.platformVideoId || payload.youtubeId || payload.id || `clip-${Date.now()}`,
    sourceType: payload.sourceType || 'youtube',
    sourceUrl: payload.sourceUrl,
    youtubeId: payload.youtubeId,
    platformVideoId: payload.platformVideoId,
    videoUrl: payload.videoUrl,
    titulo: payload.titulo || 'Clip sem título',
    descricao: payload.descricao || '',
    criadorNome: payload.criadorNome || 'Criador',
    criadorEmail: payload.criadorEmail,
    criadorCanalId: payload.criadorCanalId,
    thumbnailUrl: payload.thumbnailUrl || '',
    duracao: payload.duracao || formatSecondsToDuration(duracaoSegundos),
    duracaoSegundos,
    categorias: payload.categorias || ['Reação'],
    tags: payload.tags || [],
    hashtags: uniqueHashtags,
    visualizacoes: payload.visualizacoes || 0,
    likes: payload.likes || 0,
    shares: payload.shares || 0,
    favorites: payload.favorites || 0,
    commentsCount: payload.commentsCount || 0,
    trendingScore: 0,
    isTrending: false,
    status: payload.status || 'published',
    accessLevel: payload.accessLevel || 'public',
    exclusiveUntil: payload.exclusiveUntil,
    participatesInGlobal: payload.participatesInGlobal ?? false,
    publicadoEm: payload.publicadoEm || now,
    criadoEm: payload.criadoEm || now,
    atualizadoEm: now,
  };

  clip.trendingScore = computeTrendingScore(clip);
  clip.isTrending = clip.trendingScore >= 50;
  return clip;
}

async function processImportJob(jobId: string) {
  const job = localDb.getClipImportJob(jobId);
  if (!job || job.status !== 'queued') return;

  const update = (patch: Partial<CineClipImportJob>) => {
    const current = localDb.getClipImportJob(jobId);
    if (!current) return;
    localDb.saveClipImportJob({ ...current, ...patch, atualizadoEm: new Date().toISOString() });
  };

  const platform = detectClipPlatform(job.sourceUrl);
  if (platform === 'unknown') {
    update({
      status: 'failed',
      progress: 100,
      error: 'URL não suportada. Use YouTube, TikTok ou Instagram.',
      errorCode: 'INVALID_URL',
      alternatives: [
        'Cole um link público do TikTok, Instagram Reels ou YouTube Shorts',
        'Verifique se o post não é privado',
      ],
      completedAt: new Date().toISOString(),
    });
    return;
  }

  if (localDb.isDuplicateClip(undefined, job.sourceUrl)) {
    update({
      status: 'failed',
      progress: 100,
      error: 'Este vídeo já foi importado no CineClips.',
      errorCode: 'DUPLICATE',
      completedAt: new Date().toISOString(),
    });
    return;
  }

  update({ status: 'processing', progress: 10, sourceType: platform });

  try {
    const clipId = `clip-${platform}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    if (platform === 'youtube') {
      update({ progress: 25 });
      const result = await resolveYoutubeClipMetadata(job.sourceUrl);
      if (!result.ok) {
        update({
          status: 'failed',
          progress: 100,
          error: result.error,
          errorCode: result.code,
          alternatives: result.alternatives,
          completedAt: new Date().toISOString(),
        });
        return;
      }

      update({
        progress: 70,
        titulo: result.titulo,
        descricao: result.descricao,
        criadorNome: result.criadorNome,
        thumbnailUrl: result.thumbnailUrl,
      });

      const clip = buildClipFromPayload({
        id: result.videoId,
        youtubeId: result.videoId,
        platformVideoId: result.videoId,
        sourceType: 'youtube',
        sourceUrl: job.sourceUrl,
        titulo: result.titulo,
        descricao: result.descricao,
        criadorNome: result.criadorNome,
        thumbnailUrl: result.thumbnailUrl,
        duracaoSegundos: result.duracaoSegundos,
        categorias: job.categorias || ['Reação'],
        tags: job.tags || [],
        status: 'published',
      });

      localDb.saveCineClip(clip);
      update({
        status: 'completed',
        progress: 100,
        clipId: clip.id,
        titulo: clip.titulo,
        descricao: clip.descricao,
        criadorNome: clip.criadorNome,
        thumbnailUrl: clip.thumbnailUrl,
        completedAt: new Date().toISOString(),
      });
    } else {
      update({ progress: 20 });
      const meta = await resolveClipMetadata(job.sourceUrl);
      update({
        progress: 35,
        titulo: meta.titulo,
        descricao: meta.descricao,
        criadorNome: meta.criadorNome,
        thumbnailUrl: meta.thumbnailUrl,
      });

      const hosted = await downloadAndHostClip(job.sourceUrl, clipId, (progress, message) => {
        update({ progress: Math.min(95, progress) });
      });

      const clip = buildClipFromPayload({
        id: clipId,
        platformVideoId: hosted.platformId,
        sourceType: platform,
        sourceUrl: job.sourceUrl,
        videoUrl: hosted.videoUrl,
        titulo: hosted.titulo,
        descricao: hosted.descricao,
        criadorNome: hosted.criadorNome,
        thumbnailUrl: hosted.thumbnailUrl,
        duracaoSegundos: hosted.duracaoSegundos,
        categorias: job.categorias || ['Reação'],
        tags: job.tags || [],
        status: 'published',
      });

      localDb.saveCineClip(clip);
      update({
        status: 'completed',
        progress: 100,
        clipId: clip.id,
        titulo: clip.titulo,
        descricao: clip.descricao,
        criadorNome: clip.criadorNome,
        thumbnailUrl: clip.thumbnailUrl,
        completedAt: new Date().toISOString(),
      });
    }

    const savedJob = localDb.getClipImportJob(jobId);
    localDb.appendAuditLog({
      actorEmail: job.createdBy,
      action: 'cineclips.import',
      target: savedJob?.clipId || clipId,
      details: `Importou clip de ${platformLabel(platform)} via ${job.sourceUrl}`,
    });
  } catch (err: any) {
    update({
      status: 'failed',
      progress: 100,
      error: err.message || 'Falha ao importar vídeo.',
      errorCode: 'DOWNLOAD_FAILED',
      alternatives: platform === 'instagram'
        ? [
            'Verifique se o Reels é público',
            'Configure YT_DLP_COOKIES no servidor para posts que exigem login',
            'Tente republicar o conteúdo no YouTube Shorts e importe de lá',
          ]
        : [
            'Verifique se o link do TikTok é público e válido',
            'Tente copiar o link novamente pelo app',
            'Aguarde alguns minutos e tente de novo',
          ],
      completedAt: new Date().toISOString(),
    });
  }
}

function getUserFeedContext(email?: string) {
  const history = email ? localDb.getClipWatchHistory(email) : [];
  const allClips = localDb.getCineClips();
  const prefs = deriveUserPreferences(history, allClips);
  const followed = email ? localDb.getCanaisSeguidos(email) : [];

  return {
    email,
    watchHistory: history,
    followedCreators: followed,
    favoriteCategories: prefs.categories,
    favoriteHashtags: prefs.hashtags,
    likedClipIds: email ? new Set(localDb.getClipLikedIds(email)) : new Set<string>(),
  };
}

async function sendBrandedClipDownload(clip: CineClip, res: Response) {
  const { filePath, filename } = await exportClipWithBranding(clip);
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '')}"`);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.sendFile(filePath);
}

export function registerCineClipsRoutes(
  app: Express,
  requireAdmin: RequireAdmin,
  security: SecurityContext
) {
  app.get('/api/cineclips/feed', (req, res) => {
    try {
      const email = sessionEmailOrUndefined(req, security);
      const cursor = parseInt(String(req.query.cursor || '0'), 10) || 0;
      const limit = Math.min(parseInt(String(req.query.limit || '10'), 10) || 10, 30);

      const ctx = getUserFeedContext(email);
      const { items, nextCursor } = recommendClips(localDb.getCineClips(), ctx, limit, cursor);
      const trending = getTrendingClips(localDb.getCineClips(), 8);

      res.json({
        clips: items.map((c) => maskClipForViewer(withResolvedMediaUrls(c), email)),
        nextCursor: nextCursor !== null ? String(nextCursor) : null,
        trending: trending.map((c) => maskClipForViewer(withResolvedMediaUrls(c), email)),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao carregar feed.' });
    }
  });

  app.get('/api/cineclips/trending', (_req, res) => {
    try {
      res.json({ clips: getTrendingClips(localDb.getCineClips(), 20).map(withResolvedMediaUrls) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/cineclips/hashtag/:tag', (req, res) => {
    try {
      const tag = req.params.tag.startsWith('#') ? req.params.tag.toLowerCase() : `#${req.params.tag.toLowerCase()}`;
      const clips = localDb
        .getCineClips()
        .filter((c) => c.status === 'published' && c.hashtags.includes(tag))
        .sort((a, b) => b.trendingScore - a.trendingScore);
      res.json({ hashtag: tag, clips: clips.map(withResolvedMediaUrls), total: clips.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/cineclips/:id/download', async (req, res) => {
    try {
      const clip = localDb.getCineClipById(req.params.id);
      if (!clip || clip.status !== 'published') {
        return res.status(404).json({ error: 'Clip não encontrado.' });
      }
      await sendBrandedClipDownload(clip, res);
    } catch (err: any) {
      res.status(422).json({ error: err.message || 'Não foi possível preparar o download.' });
    }
  });

  app.get('/api/cineclips/:id', (req, res) => {
    try {
      const clip = localDb.getCineClipById(req.params.id);
      if (!clip || clip.status !== 'published') {
        return res.status(404).json({ error: 'Clip não encontrado.' });
      }
      const email = sessionEmailOrUndefined(req, security);
      const resolved = withResolvedMediaUrls(clip);
      res.json({
        clip: maskClipForViewer(resolved, email || undefined),
        related: getRelatedClips(clip, localDb.getCineClips()).map((c) =>
          maskClipForViewer(withResolvedMediaUrls(c), email || undefined)
        ),
        liked: email ? localDb.isClipLikedBy(clip.id, email) : false,
        favorited: email ? localDb.isClipFavoritedBy(clip.id, email) : false,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/cineclips/:id/related', (req, res) => {
    try {
      const clip = localDb.getCineClipById(req.params.id);
      if (!clip) return res.status(404).json({ error: 'Clip não encontrado.' });
      res.json({ clips: getRelatedClips(clip, localDb.getCineClips()).map(withResolvedMediaUrls) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/cineclips/:id/view', (req, res) => {
    try {
      const views = localDb.incrementClipViews(req.params.id);
      res.json({ views });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/cineclips/:id/watch', (req, res) => {
    try {
      const { email, watchSeconds = 0, completed = false } = req.body || {};
      const sessionEmail = requireSessionEmail(req, res, security, email);
      if (!sessionEmail) return;

      const clip = localDb.getCineClipById(req.params.id);
      if (!clip) return res.status(404).json({ error: 'Clip não encontrado.' });
      if (!canUserViewClip(sessionEmail, clip)) {
        return res.status(403).json({ error: 'Conteúdo exclusivo para assinantes.', code: 'SUBSCRIPTION_REQUIRED' });
      }

      localDb.recordClipWatch({
        usuarioEmail: sessionEmail,
        clipId: req.params.id,
        watchSeconds,
        completed: !!completed,
        criadoEm: new Date().toISOString(),
      });

      let gamificationReward = null;
      if (completed) {
        gamificationReward = handleGamificationEvent(sessionEmail, 'clip_watch_complete', {
          clipId: req.params.id,
          watchSeconds,
        });
      } else if (watchSeconds >= 5) {
        gamificationReward = handleGamificationEvent(sessionEmail, 'clip_watch', {
          clipId: req.params.id,
          watchSeconds,
        });
      }

      res.json({ ok: true, gamificationReward });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/cineclips/:id/like', (req, res) => {
    try {
      const { email, action = 'like' } = req.body || {};
      const sessionEmail = requireSessionEmail(req, res, security, email);
      if (!sessionEmail) return;
      const result = localDb.likeCineClip(req.params.id, sessionEmail, action);
      let gamificationReward = null;
      if (action === 'like') {
        gamificationReward = handleGamificationEvent(sessionEmail, 'clip_like', { clipId: req.params.id });
      }
      res.json({ ...result, gamificationReward });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/cineclips/:id/favorite', (req, res) => {
    try {
      const { email, action = 'favorite' } = req.body || {};
      const sessionEmail = requireSessionEmail(req, res, security, email);
      if (!sessionEmail) return;
      const result = localDb.favoriteCineClip(req.params.id, sessionEmail, action);
      let gamificationReward = null;
      if (action === 'favorite') {
        gamificationReward = handleGamificationEvent(sessionEmail, 'clip_favorite', { clipId: req.params.id });
      }
      res.json({ ...result, gamificationReward });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/cineclips/:id/share', (req, res) => {
    try {
      const { email } = req.body || {};
      const sessionEmail = requireSessionEmail(req, res, security, email);
      if (!sessionEmail) return;
      const shares = localDb.shareCineClip(req.params.id, sessionEmail);
      const gamificationReward = handleGamificationEvent(sessionEmail, 'clip_share', { clipId: req.params.id });
      res.json({ shares, gamificationReward });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/cineclips/:id/comments', (req, res) => {
    try {
      const comments = localDb.getCineClipComments(req.params.id).map(enrichCineClipComment);
      res.json({ comments });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/cineclips/:id/comments', (req, res) => {
    try {
      const { email, nome, texto } = req.body || {};
      const sessionEmail = requireSessionEmail(req, res, security, email);
      if (!sessionEmail) return;
      if (!texto?.trim()) {
        return res.status(400).json({ error: 'Texto é obrigatório.' });
      }

      const comment: CineClipComment = {
        id: `cc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        clipId: req.params.id,
        usuarioEmail: sessionEmail,
        usuarioNome: nome || 'Usuário',
        texto: texto.trim().slice(0, 500),
        likes: 0,
        criadoEm: new Date().toISOString(),
        moderationStatus: 'approved',
      };

      localDb.addCineClipComment(comment);
      const gamificationReward = handleGamificationEvent(sessionEmail, 'clip_comment', { clipId: req.params.id });

      res.json({ comment: enrichCineClipComment(comment), gamificationReward });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/cineclips/:id/report', (req, res) => {
    try {
      const { email, nome, reason, details } = req.body || {};
      const sessionEmail = requireSessionEmail(req, res, security, email);
      if (!sessionEmail) return;
      if (!reason) return res.status(400).json({ error: 'Dados incompletos.' });

      const report = localDb.reportCineClip({
        id: `report-${Date.now()}`,
        clipId: req.params.id,
        usuarioEmail: sessionEmail,
        usuarioNome: nome || 'Usuário',
        reason,
        details: details?.slice(0, 500),
        status: 'pending',
        criadoEm: new Date().toISOString(),
      });

      res.json({ ok: true, report });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Admin ──────────────────────────────────────────────────
  app.get('/api/admin/cineclips', async (req, res) => {
    if (!(await adminOnly(requireAdmin, req, res))) return;
    try {
      const clips = localDb.getCineClips().sort(
        (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      );
      res.json({ clips, total: clips.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/cineclips/import/preview', async (req, res) => {
    if (!(await adminOnly(requireAdmin, req, res))) return;
    try {
      const { url } = req.body || {};
      if (!url) return res.status(400).json({ error: 'URL obrigatória.' });

      const platform = detectClipPlatform(url);
      if (platform === 'unknown') {
        return res.status(422).json({
          error: 'URL não suportada. Cole links do YouTube, TikTok ou Instagram.',
          code: 'INVALID_URL',
          alternatives: [
            'TikTok: https://www.tiktok.com/@usuario/video/...',
            'Instagram: https://www.instagram.com/reel/...',
            'YouTube: https://youtube.com/shorts/...',
          ],
        });
      }

      if (platform === 'youtube') {
        const result = await resolveYoutubeClipMetadata(url);
        if (!result.ok) {
          return res.status(422).json({
            error: result.error,
            code: result.code,
            alternatives: result.alternatives,
          });
        }
        return res.json({
          preview: {
            platform,
            videoId: result.videoId,
            titulo: result.titulo,
            descricao: result.descricao,
            criadorNome: result.criadorNome,
            thumbnailUrl: result.thumbnailUrl,
            duracao: formatSecondsToDuration(result.duracaoSegundos),
            duracaoSegundos: result.duracaoSegundos,
            willDownload: false,
            hashtags: extractHashtags(`${result.titulo} ${result.descricao}`),
          },
        });
      }

      const meta = await resolveClipMetadata(url);
      res.json({
        preview: {
          platform,
          videoId: meta.platformId,
          titulo: meta.titulo,
          descricao: meta.descricao,
          criadorNome: meta.criadorNome,
          thumbnailUrl: meta.thumbnailUrl,
          duracao: formatDurationLabel(meta.duracaoSegundos),
          duracaoSegundos: meta.duracaoSegundos,
          willDownload: true,
          hashtags: extractHashtags(`${meta.titulo} ${meta.descricao}`),
        },
      });
    } catch (err: any) {
      res.status(422).json({
        error: err.message || 'Não foi possível pré-visualizar este link.',
        code: 'PREVIEW_FAILED',
        alternatives: [
          'Verifique se o post é público',
          'Tente copiar o link direto do app',
        ],
      });
    }
  });

  app.post('/api/admin/cineclips/import', async (req, res) => {
    if (!(await adminOnly(requireAdmin, req, res))) return;
    try {
      const { url, categorias, tags, createdBy } = req.body || {};
      if (!url) return res.status(400).json({ error: 'URL obrigatória.' });

      const platform = detectClipPlatform(url);
      const job: CineClipImportJob = {
        id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sourceUrl: url,
        sourceType: platform === 'unknown' ? 'youtube' : platform,
        status: 'queued',
        progress: 0,
        categorias: categorias || ['Reação'],
        tags: tags || [],
        createdBy: createdBy || 'admin',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };

      localDb.saveClipImportJob(job);
      setTimeout(() => processImportJob(job.id), 100);

      res.json({ job });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/cineclips/import/jobs', async (req, res) => {
    if (!(await adminOnly(requireAdmin, req, res))) return;
    try {
      res.json({ jobs: localDb.getClipImportJobs() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/cineclips/import/jobs/:id', async (req, res) => {
    if (!(await adminOnly(requireAdmin, req, res))) return;
    try {
      const job = localDb.getClipImportJob(req.params.id);
      if (!job) return res.status(404).json({ error: 'Job não encontrado.' });
      res.json({ job });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/cineclips', async (req, res) => {
    if (!(await adminOnly(requireAdmin, req, res))) return;
    try {
      const clip = buildClipFromPayload(req.body);
      if (localDb.isDuplicateClip(clip.youtubeId, clip.sourceUrl)) {
        return res.status(409).json({ error: 'Clip duplicado.' });
      }
      localDb.saveCineClip(clip);
      res.json({ clip });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/admin/cineclips/:id', async (req, res) => {
    if (!(await adminOnly(requireAdmin, req, res))) return;
    try {
      const existing = localDb.getCineClipById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Clip não encontrado.' });
      const clip = buildClipFromPayload({ ...existing, ...req.body }, existing.id);
      localDb.saveCineClip(clip);
      res.json({ clip });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/cineclips/:id/download', async (req, res) => {
    if (!(await adminOnly(requireAdmin, req, res))) return;
    try {
      const clip = localDb.getCineClipById(req.params.id);
      if (!clip) return res.status(404).json({ error: 'Clip não encontrado.' });
      await sendBrandedClipDownload(clip, res);
    } catch (err: any) {
      res.status(422).json({ error: err.message || 'Não foi possível preparar o download.' });
    }
  });

  app.delete('/api/admin/cineclips/:id', async (req, res) => {
    if (!(await adminOnly(requireAdmin, req, res))) return;
    try {
      deleteHostedClipFiles(req.params.id);
      localDb.deleteCineClip(req.params.id);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/cineclips/reports', async (req, res) => {
    if (!(await adminOnly(requireAdmin, req, res))) return;
    try {
      res.json({ reports: localDb.getCineClipReports() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
