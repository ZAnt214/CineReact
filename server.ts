import express, { type Request as ExpressRequest, type Response as ExpressResponse } from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { localDb } from "./src/db/local_db.ts";
import { registerGamificationRoutes, handleGamificationEvent, getPublicProfileForEmail } from "./src/gamification/serverHelpers.ts";
import { registerAdminPanelRoutes } from "./src/admin/registerAdminPanelRoutes.ts";
import { findOfficialCreatorEmailForChannel, getPublicUserProfile } from "./src/gamification/publicUserProfile.ts";
import { isVerifiedCreatorLoadout } from "./src/gamification/verifiedCreator.ts";
import { migrateProfile, hasReward, resolveCreatorId } from "./src/gamification/rewardsEngine.ts";
import { VERIFIED_PROFILE_BADGE_ID } from "./src/data/rewardsCatalog.ts";
import { ensureDemoCreatorProfile } from "./src/gamification/demoCreator.ts";
import { listVideoCreators } from "./src/gamification/platformCreators.ts";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";
import { serializeUserState } from "./src/utils/userState.ts";
import { sanitizeSocialLinks } from "./src/utils/socialLinks.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Initialize Gemini Client safely
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client inicializado com sucesso.");
  } catch (error) {
    console.error("Erro ao inicializar o cliente do Gemini:", error);
  }
} else {
  console.log("GEMINI_API_KEY não configurada ou está como valor padrão. Operando em modo de simulação inteligente.");
}

// ==========================================
// YOUTUBE DATA API V3 INTEGRATION & VALIDATION
// ==========================================

function getDurationSeconds(durationStr: string): number {
  if (!durationStr) return 0;
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  return (hours * 3600) + (minutes * 60) + seconds;
}

function parseISO8601Duration(durationStr: string): string {
  if (!durationStr) return "15:00";
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "15:00";
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

function isShortOrInvalidVideo(video: any): boolean {
  if (!video) return true;
  const snippet = video.snippet || {};
  const contentDetails = video.contentDetails || {};

  // 1. Duration check: YouTube Shorts/Reels are <= 60s (1 minute)
  const durationSec = getDurationSeconds(contentDetails.duration || '');
  if (durationSec > 0 && durationSec <= 60) {
    return true;
  }

  // 2. Title & description hashtag/keyword check
  const title = (snippet.title || '').toLowerCase();
  const description = (snippet.description || '').toLowerCase();
  const shortsKeywords = [
    '#shorts', '#short', '#reels', '#tiktok', '#shortsyoutube', '#shortsvideo',
    '#viralshorts', '#ytshorts', '#shortsfeed', '#shortsforyou', '#reelsinstagram',
    '#shortsclip', ' #shorts', ' #reels', ' #short'
  ];
  if (shortsKeywords.some(kw => title.includes(kw) || description.includes(kw))) {
    return true;
  }

  // 3. Thumbnail check
  const thumbnailUrl = snippet.thumbnails?.high?.url || 
                       snippet.thumbnails?.medium?.url || 
                       snippet.thumbnails?.default?.url || 
                       '';
  if (!thumbnailUrl || thumbnailUrl.trim() === '' || thumbnailUrl.includes('no_thumbnail')) {
    return true;
  }

  return false;
}

function isShortOrInvalidReact(r: any): boolean {
  if (!r) return true;
  if (!r.thumbnailUrl || String(r.thumbnailUrl).trim() === '' || String(r.thumbnailUrl).includes('no_thumbnail')) {
    return true;
  }
  const title = String(r.titulo || '').toLowerCase();
  const shortsKeywords = [
    '#shorts', '#short', '#reels', '#tiktok', '#shortsyoutube', '#shortsvideo',
    '#viralshorts', '#ytshorts', '#shortsfeed', '#shortsforyou', '#reelsinstagram',
    '#shortsclip', ' #shorts', ' #reels', ' #short'
  ];
  if (shortsKeywords.some(kw => title.includes(kw))) {
    return true;
  }
  const dur = r.duracao;
  if (dur) {
    const parts = String(dur).split(':');
    if (parts.length === 3) {
      return false; // hh:mm:ss -> long video
    } else if (parts.length === 2) {
      const mins = parseInt(parts[0], 10);
      const secs = parseInt(parts[1], 10);
      if (!isNaN(mins) && !isNaN(secs) && (mins * 60 + secs) <= 120) {
        return true;
      }
    } else if (parts.length === 1) {
      const secs = parseInt(parts[0], 10);
      if (!isNaN(secs) && secs <= 120) {
        return true;
      }
    }
  }
  return false;
}

async function safeFetch(url: string, options: any = {}, retries = 1): Promise<Response | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch (err: any) {
      if (i === retries) {
        console.warn(`[safeFetch] Conexão indisponível para ${url.substring(0, 60)}...`);
        return null;
      }
      await new Promise(r => setTimeout(r, 300 * (i + 1)));
    }
  }
  return null;
}

function getYoutubeApiKey(): string | null {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key || key === "MY_YOUTUBE_API_KEY") return null;
  return key;
}

async function validateYouTubeVideo(videoId: string): Promise<{ isValid: boolean; videoData?: any }> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || apiKey === "MY_YOUTUBE_API_KEY") {
    console.warn("[YouTube API] YOUTUBE_API_KEY não configurada. Ignorando validação estrita.");
    return { isValid: true }; // Retorna válido para não bloquear se o usuário não configurou a chave ainda
  }

  try {
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status,statistics&id=${videoId}&key=${apiKey}`;
    const res = await safeFetch(videosUrl);
    if (!res || !res.ok) {
      console.warn(`[YouTube API] Aviso ao validar vídeo ${videoId}: ${res?.status || 'Network Error / Timeout'}. Permitindo inclusão com fallback.`);
      return { isValid: true };
    }
    const data: any = await res.json();
    if (!data.items || data.items.length === 0) {
      console.warn(`[YouTube API] Vídeo ${videoId} não foi retornado pela API (removido ou inválido).`);
      return { isValid: false };
    }

    const video = data.items[0];
    const isPublic = video.status?.privacyStatus === 'public';
    const isEmbeddable = video.status?.embeddable === true;
    const isProcessed = video.status?.uploadStatus === 'processed';
    const isNotShort = !isShortOrInvalidVideo(video);

    if (isPublic && isEmbeddable && isProcessed && isNotShort) {
      return { isValid: true, videoData: video };
    }
    console.warn(`[YouTube API] Vídeo ${videoId} falhou na validação de disponibilidade (public=${isPublic}, embeddable=${isEmbeddable}, isNotShort=${isNotShort})`);
    return { isValid: false };
  } catch (error) {
    console.error(`[YouTube API] Erro de rede ao validar vídeo ${videoId}:`, error);
    return { isValid: false };
  }
}

async function syncChannelVideos(channelId: string, obraId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || apiKey === "MY_YOUTUBE_API_KEY") {
    console.warn("[YouTube API] YOUTUBE_API_KEY não configurada. Pulando sincronização de canal.");
    return;
  }

  try {
    console.log(`[YouTube API] Buscando todos os vídeos do canal ${channelId} para "${obraId}"`);
    let nextPageToken = '';
    const allVideoIds: string[] = [];
    let pagesFetched = 0;
    
    let realChannelId = channelId;
    let uploadsPlaylistId = '';

    // If channelId starts with UC, convert directly to UU
    if (channelId.startsWith('UC')) {
      realChannelId = channelId;
      uploadsPlaylistId = 'UU' + channelId.substring(2);
    } else {
      // Resolve handle or username to channel ID and uploads playlist
      try {
        let resolveUrl = '';
        if (channelId.startsWith('@')) {
          resolveUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,id&forHandle=${encodeURIComponent(channelId)}&key=${apiKey}`;
        } else {
          resolveUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,id&forUsername=${encodeURIComponent(channelId)}&key=${apiKey}`;
        }
        const chRes = await safeFetch(resolveUrl);
        if (chRes && chRes.ok) {
          const chData: any = await chRes.json();
          if (chData.items?.[0]) {
            realChannelId = chData.items[0].id || channelId;
            uploadsPlaylistId = chData.items[0].contentDetails?.relatedPlaylists?.uploads || (realChannelId.startsWith('UC') ? 'UU' + realChannelId.substring(2) : '');
          }
        }
      } catch (e) {
        console.warn(`[YouTube API] Erro ao resolver ID para handle/username ${channelId}:`, e);
      }
    }

    if (!uploadsPlaylistId && realChannelId.startsWith('UC')) {
      uploadsPlaylistId = 'UU' + realChannelId.substring(2);
    }

    if (uploadsPlaylistId) {
      do {
        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        const searchRes = await safeFetch(playlistUrl);
        if (!searchRes || !searchRes.ok) {
          const errText = searchRes ? await searchRes.text() : 'Network Error';
          console.warn(`[YouTube API] Playlist de uploads do canal ${realChannelId} (playlist ${uploadsPlaylistId}) retornou status ${searchRes?.status}: ${errText}`);
          break;
        }
        
        const searchData: any = await searchRes.json();
        const ids = searchData.items?.map((item: any) => item.contentDetails?.videoId).filter(Boolean) || [];
        allVideoIds.push(...ids);
        
        nextPageToken = searchData.nextPageToken;
        pagesFetched++;
      } while (nextPageToken && pagesFetched < 20);
    }

    // Fallback: if uploads playlist didn't return any videos, use YouTube Search endpoint by channelId or title
    if (allVideoIds.length === 0) {
      console.log(`[YouTube API] Usando busca direta para canal ${realChannelId}...`);
      let searchPageToken = '';
      let searchPages = 0;
      do {
        let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&maxResults=50&type=video&order=date&key=${apiKey}${searchPageToken ? `&pageToken=${searchPageToken}` : ''}`;
        if (realChannelId.startsWith('UC')) {
          searchUrl += `&channelId=${realChannelId}`;
        } else {
          const obraObj = localDb.getObras().find(o => o.id === obraId);
          const cleanName = obraObj ? obraObj.titulo.replace(/^Canal\s+/i, '') : channelId;
          searchUrl += `&q=${encodeURIComponent(cleanName + ' react')}`;
        }

        const searchRes = await safeFetch(searchUrl);
        if (!searchRes || !searchRes.ok) break;
        const searchData: any = await searchRes.json();
        const ids = searchData.items?.map((item: any) => item.id?.videoId).filter(Boolean) || [];
        allVideoIds.push(...ids);
        searchPageToken = searchData.nextPageToken;
        searchPages++;
      } while (searchPageToken && searchPages < 10);
    }
    
    const uniqueIds = Array.from(new Set(allVideoIds));
    console.log(`[YouTube API] Encontrados ${uniqueIds.length} vídeos no canal ${channelId}. Buscando detalhes...`);
    
    // Fetch details in batches of 50
    const validReacts: ReactVideo[] = [];
    for (let i = 0; i < uniqueIds.length; i += 50) {
      const batchIds = uniqueIds.slice(i, i + 50);
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status,statistics&id=${batchIds.join(',')}&key=${apiKey}`;
      const videosRes = await safeFetch(videosUrl);
      if (!videosRes || !videosRes.ok) {
        console.warn(`[YouTube API] Erro ao obter detalhes do lote: ${videosRes?.status || 'Network Error'}`);
        continue;
      }
      
      const videosData: any = await videosRes.json();
      
      if (videosData.items) {
        for (const video of videosData.items) {
          const isPublic = video.status?.privacyStatus === 'public';
          const isEmbeddable = video.status?.embeddable === true;
          const isProcessed = video.status?.uploadStatus === 'processed';

          if (isPublic && isEmbeddable && isProcessed && !isShortOrInvalidVideo(video)) {
            const videoId = video.id;
            const snippet = video.snippet || {};
            const contentDetails = video.contentDetails || {};
            const statistics = video.statistics || {};

            const thumbnailUrl = snippet.thumbnails?.high?.url || 
                                 snippet.thumbnails?.medium?.url || 
                                 snippet.thumbnails?.default?.url || 
                                 '';

            validReacts.push({
              id: videoId,
              titulo: snippet.title || 'React Video',
              canalNome: snippet.channelTitle || 'Canal Desconhecido',
              canalId: snippet.channelId || '',
              publicadoEm: snippet.publishedAt || new Date().toISOString(),
              duracao: parseISO8601Duration(contentDetails.duration || ''),
              visualizacoes: parseInt(statistics.viewCount || '0', 10),
              thumbnailUrl: thumbnailUrl,
              obraId: obraId
            });
          }
        }
      }
    }
    
    // Sort from newest to oldest
    validReacts.sort((a, b) => new Date(b.publicadoEm).getTime() - new Date(a.publicadoEm).getTime());
    
    // Merge into database preserving custom parameters (isRecomendado, likes, etc.)
    if (validReacts.length > 0) {
      const existingReacts = localDb.getReacts();
      const existingMap = new Map(existingReacts.map(r => [r.id, r]));

      for (const valid of validReacts) {
        const existing = existingMap.get(valid.id);
        if (existing) {
          localDb.saveReact({
            ...valid,
            isRecomendado: existing.isRecomendado || valid.isRecomendado,
            likes: Math.max(existing.likes || 0, valid.likes || 0)
          });
        } else {
          localDb.saveReact(valid);
        }
      }

      console.log(`[YouTube API] Sincronização concluída: ${validReacts.length} vídeos salvos para o canal ${channelId}.`);
    }

  } catch (err) {
    console.error(`[YouTube API] Erro ao sincronizar canal ${channelId}:`, err);
  }
}

async function searchAndSaveReacts(obraId: string, query: string, maxResults = 5): Promise<ReactVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || apiKey === "MY_YOUTUBE_API_KEY") {
    console.warn("[YouTube API] YOUTUBE_API_KEY não configurada. Pulando busca.");
    return [];
  }

  try {
    console.log(`[YouTube API] Buscando reacts reais do YouTube para "${obraId}" com query "${query}"`);
    // Buscamos o triplo de resultados para filtrar e escolher os válidos/disponíveis
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults * 3}&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;
    const searchRes = await safeFetch(searchUrl);
    if (!searchRes || !searchRes.ok) {
      const errText = searchRes ? await searchRes.text() : 'Network Error';
      console.warn(`[YouTube API] Erro ao pesquisar no YouTube: ${searchRes?.status} - ${errText}`);
      return [];
    }

    const searchData: any = await searchRes.json();
    const videoIds = searchData.items?.map((item: any) => item.id?.videoId).filter(Boolean) || [];

    if (videoIds.length === 0) {
      console.log(`[YouTube API] Nenhum vídeo encontrado para a query: "${query}"`);
      return [];
    }

    // Validação estrita via endpoint de vídeos
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status,statistics&id=${videoIds.join(',')}&key=${apiKey}`;
    const videosRes = await safeFetch(videosUrl);
    if (!videosRes || !videosRes.ok) {
      console.warn(`[YouTube API] Erro ao obter detalhes dos vídeos: ${videosRes?.status || 'Network Error'}`);
      return [];
    }

    const videosData: any = await videosRes.json();
    const validReacts: ReactVideo[] = [];

    if (videosData.items) {
      for (const video of videosData.items) {
        const isPublic = video.status?.privacyStatus === 'public';
        const isEmbeddable = video.status?.embeddable === true;
        const isProcessed = video.status?.uploadStatus === 'processed';

        if (isPublic && isEmbeddable && isProcessed && !isShortOrInvalidVideo(video)) {
          const videoId = video.id;
          const snippet = video.snippet || {};
          const contentDetails = video.contentDetails || {};
          const statistics = video.statistics || {};

          // Usar snippet.thumbnails.high.url como prioridade
          const thumbnailUrl = snippet.thumbnails?.high?.url || 
                             snippet.thumbnails?.medium?.url || 
                             snippet.thumbnails?.default?.url || 
                             `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

          const duracao = parseISO8601Duration(contentDetails.duration || 'PT15M00S');
          const visualizacoes = Number(statistics.viewCount) || 12000;
          const canalNome = snippet.channelTitle || 'Canal do YouTube';
          const publicadoEm = snippet.publishedAt ? snippet.publishedAt.split('T')[0] : new Date().toISOString().split('T')[0];

          // Tentar obter número do episódio do título
          let episodioNum: number | undefined = undefined;
          const epMatch = snippet.title?.match(/(?:ep|episódio|episodio|part|parte)\s*#?(\d+)/i);
          if (epMatch) {
            episodioNum = parseInt(epMatch[1]);
          }

          const reactVideo: ReactVideo = {
            id: videoId,
            titulo: snippet.title || 'React',
            canalNome,
            canalId: snippet.channelId || '',
            publicadoEm,
            duracao,
            visualizacoes,
            thumbnailUrl,
            obraId,
            episodioNum
          };

          validReacts.push(reactVideo);

          if (validReacts.length >= maxResults) {
            break;
          }
        } else {
          console.log(`[YouTube API] Ignorando vídeo indisponível ou privado: ${video.id}`);
        }
      }
    }

    // Gravar no DB local
    for (const r of validReacts) {
      localDb.saveReact(r);
    }

    return validReacts;
  } catch (error) {
    console.error("[YouTube API] Erro na busca do YouTube:", error);
    return [];
  }
}

async function fetchRealChannelAvatar(channelId: string, pageUrl?: string): Promise<string | null> {
  const apiKey = getYoutubeApiKey();
  if (apiKey && channelId.startsWith('UC')) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`;
      const res = await safeFetch(url);
      if (res && res.ok) {
        const data: any = await res.json();
        const avatar = data.items?.[0]?.snippet?.thumbnails?.high?.url ||
                       data.items?.[0]?.snippet?.thumbnails?.medium?.url ||
                       null;
        if (avatar) return avatar;
      }
    } catch (e) {
      console.error(`[Avatar Sync] Erro com API do YouTube para canal ${channelId}:`, e);
    }
  }

  const scrapeTargets = [
    pageUrl,
    channelId.startsWith('UC') ? `https://www.youtube.com/channel/${channelId}` : null,
    channelId.startsWith('@') ? `https://www.youtube.com/${channelId}` : null,
  ].filter(Boolean) as string[];

  for (const target of scrapeTargets) {
    try {
      const res = await safeFetch(target, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        }
      });
      if (res && res.ok) {
        const html = await res.text();
        const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                             html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);
        if (ogImageMatch?.[1]) {
          const imageUrl = ogImageMatch[1];
          if (imageUrl && !imageUrl.includes('youtube_logo') && !imageUrl.includes('yt_logo')) {
            return imageUrl;
          }
        }
      }
    } catch (e) {
      console.error(`[Avatar Sync] Erro de rede scraping para ${target}:`, e);
    }
  }
  return null;
}

async function syncChannelAvatars() {
  console.log("[Avatar Sync] Iniciando sincronização de fotos de perfil dos canais...");
  const existingObras = localDb.getObras();
  const canais = existingObras.filter(o => o.tipo === 'canal');

  for (const canal of canais) {
    const isPlaceholder = !canal.poster || 
                          canal.poster.includes("photo-1616469829581") || 
                          canal.poster.includes("unsplash.com") ||
                          canal.poster === "";
    
    if (isPlaceholder && canal.channelId) {
      console.log(`[Avatar Sync] Buscando foto real para o canal "${canal.titulo}" (ID: ${canal.channelId})...`);
      const realAvatar = await fetchRealChannelAvatar(canal.channelId);
      if (realAvatar) {
        console.log(`[Avatar Sync] Foto encontrada para "${canal.titulo}": ${realAvatar}`);
        canal.poster = realAvatar;
        localDb.saveObra(canal);
      } else {
        console.log(`[Avatar Sync] Não foi possível encontrar foto para "${canal.titulo}".`);
      }
    }
  }
}

async function prefillDefaultReacts() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || apiKey === "MY_YOUTUBE_API_KEY") {
    console.warn("[YouTube API] YOUTUBE_API_KEY não configurada. Pulando pré-carregamento inicial.");
    return;
  }

  const existingObras = localDb.getObras();
  const canais = existingObras.filter(o => o.tipo === 'canal');

  for (const canal of canais) {
    if (canal.channelId) {
      console.log(`[YouTube API] Sincronizando catálogo completo para o canal ${canal.titulo}...`);
      syncChannelVideos(canal.channelId, canal.id).catch(err => {
        console.error(`[YouTube API] Erro ao pré-carregar canal ${canal.titulo}:`, err);
      });
    }
  }
}

// ==========================================
// ADMIN AUTH HELPERS
// ==========================================

function getAdminEmailFromRequest(req: ExpressRequest): string | undefined {
  const header = req.headers["x-admin-email"];
  if (typeof header === "string" && header.trim()) return header.trim();
  const query = req.query.adminEmail;
  if (typeof query === "string" && query.trim()) return query.trim();
  const body = req.body?.adminEmail;
  if (typeof body === "string" && body.trim()) return body.trim();
  return undefined;
}

function verifyAdminEmailSync(email: string | undefined): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  if (clean === "mateusvini.t10@gmail.com") return true;
  const user = localDb.findUsuarioByEmailSync(clean);
  return !!user?.isAdmin;
}

function sanitizeUsuario(u: UserAccount) {
  const { password, ...rest } = u;
  return rest;
}

async function requireAdmin(req: ExpressRequest, res: ExpressResponse): Promise<string | null> {
  const email = getAdminEmailFromRequest(req);
  if (!verifyAdminEmailSync(email)) {
    res.status(403).json({ error: "Acesso negado. Privilégios de administrador necessários." });
    return null;
  }
  return email!;
}

async function discoverReactsFromYouTube(query: string, obraId: string, limit = 8): Promise<number> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || apiKey === "MY_YOUTUBE_API_KEY") return 0;

  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query + " react")}&maxResults=${limit}&key=${apiKey}`;
    const searchRes = await safeFetch(searchUrl);
    if (!searchRes?.ok) return 0;

    const searchData: any = await searchRes.json();
    const videoIds = (searchData.items || [])
      .map((item: any) => item.id?.videoId)
      .filter(Boolean) as string[];

    if (videoIds.length === 0) return 0;

    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status,statistics&id=${videoIds.join(",")}&key=${apiKey}`;
    const videosRes = await safeFetch(videosUrl);
    if (!videosRes?.ok) return 0;

    const videosData: any = await videosRes.json();
    let added = 0;

    for (const video of videosData.items || []) {
      const isPublic = video.status?.privacyStatus === "public";
      const isEmbeddable = video.status?.embeddable === true;
      const isProcessed = video.status?.uploadStatus === "processed";
      if (!isPublic || !isEmbeddable || !isProcessed || isShortOrInvalidVideo(video)) continue;

      const snippet = video.snippet || {};
      const statistics = video.statistics || {};
      const contentDetails = video.contentDetails || {};

      localDb.saveReact({
        id: video.id,
        titulo: snippet.title || "React",
        canalNome: snippet.channelTitle || "YouTube",
        canalId: snippet.channelId || "",
        publicadoEm: snippet.publishedAt ? snippet.publishedAt.split("T")[0] : new Date().toISOString().split("T")[0],
        duracao: parseISO8601Duration(contentDetails.duration || ""),
        visualizacoes: Number(statistics.viewCount) || 0,
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`,
        obraId,
      });
      added++;
    }

    return added;
  } catch (err) {
    console.error("[Discover] Erro ao buscar reacts no YouTube:", err);
    return 0;
  }
}

async function discoverObraWithGemini(query: string) {
  if (!ai) return null;

  const prompt = `Gere dados realistas em JSON para a obra de entretenimento: "${query}".
Retorne APENAS JSON válido, sem markdown.
Formato:
{
  "id": "slug-em-minusculo",
  "titulo": "Título Oficial",
  "tipo": "filme|serie|anime|jogo",
  "sinopse": "Sinopse envolvente em português do Brasil",
  "ano": 2020,
  "generos": ["Gênero1", "Gênero2"],
  "banner": "https://images.unsplash.com/photo-1618944913480-b67ee16d7b77?q=80&w=1600",
  "poster": "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=600",
  "trailerUrl": "https://www.youtube.com/watch?v=VyHV0BRZKoI"
}`;

  const geminiRes = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const text = geminiRes.text?.trim();
  if (!text) return null;

  let cleanText = text;
  if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
  }

  const data = JSON.parse(cleanText);
  const slug = (data.id || query).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return localDb.saveObra({
    id: slug,
    titulo: data.titulo || query,
    tipo: ["filme", "serie", "anime", "jogo", "canal"].includes(data.tipo) ? data.tipo : "filme",
    sinopse: data.sinopse || `Obra ${query} catalogada no CineReact.`,
    ano: Number(data.ano) || new Date().getFullYear(),
    generos: Array.isArray(data.generos) ? data.generos : ["Entretenimento"],
    banner: data.banner || "https://images.unsplash.com/photo-1618944913480-b67ee16d7b77?q=80&w=1600",
    poster: data.poster || "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=600",
    trailerUrl: data.trailerUrl || "https://www.youtube.com/watch?v=VyHV0BRZKoI",
    destacado: false,
  });
}

// ==========================================
// API ROUTES
// ==========================================

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Config Check
app.get("/api/config", (req, res) => {
  const ytKey = process.env.YOUTUBE_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const hasSupabase = localDb.isSupabaseActive();
  res.json({
    hasYoutubeKey: !!ytKey && ytKey !== "MY_YOUTUBE_API_KEY",
    hasGeminiKey: !!geminiKey && geminiKey !== "MY_GEMINI_API_KEY",
    hasSupabase
  });
});

// Supabase Status
app.get("/api/supabase/status", async (req, res) => {
  const active = localDb.isSupabaseActive();
  const url = process.env.SUPABASE_URL || '';
  
  let counts = {
    obras: localDb.getObras().length,
    reacts: localDb.getReacts().length,
    comentarios: localDb.getComentarios().length,
    usuarios: localDb.getUsuarios().length,
  };

  res.json({
    active,
    url: active ? url.replace(/(https?:\/\/)(.*)/, "$1...$2".slice(0, 15) + "...") : '',
    counts
  });
});

// Force Sync from Supabase to Memory Cache
app.post("/api/supabase/sync", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    if (!localDb.isSupabaseActive()) {
      return res.status(400).json({ error: "Supabase não está configurado." });
    }
    const success = await localDb.syncFromSupabase();
    if (success) {
      res.json({ success: true, message: "Sincronização com Supabase concluída com sucesso!" });
    } else {
      res.status(500).json({ error: "Erro ao sincronizar. Certifique-se de que as tabelas existam e as chaves do Supabase estejam corretas." });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro inesperado ao sincronizar." });
  }
});

// Force Upload from Memory Cache to Supabase
app.post("/api/supabase/migrate", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    if (!localDb.isSupabaseActive()) {
      return res.status(400).json({ error: "Supabase não está configurado." });
    }
    const success = await localDb.uploadLocalDataToSupabase();
    if (success) {
      res.json({ success: true, message: "Exportação dos dados locais para o Supabase concluída!" });
    } else {
      res.status(500).json({ error: "Erro ao exportar dados. Certifique-se de que as tabelas existam." });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro inesperado ao migrar." });
  }
});


app.post("/api/sync/:obraId", async (req, res) => {
  try {
    const obraId = req.params.obraId;
    const obra = localDb.getObras().find(o => o.id === obraId);
    if (!obra || !obra.channelId) {
      return res.status(404).json({ error: "Canal não encontrado ou sem channelId configurado." });
    }
    
    await syncChannelVideos(obra.channelId, obra.id);
    res.json({ status: "ok", message: `Sincronização concluída para ${obra.titulo}.` });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao sincronizar canal." });
  }
});

// Obras routes
app.get("/api/obras", (req, res) => {
  try {
    const type = req.query.tipo as string;
    let list = localDb.getObras();
    if (type) {
      list = list.filter(o => o.tipo === type);
    }
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao buscar obras." });
  }
});

app.get("/api/obras/:id", async (req, res) => {
  try {
    const obra = localDb.getObras().find(o => o.id === req.params.id);
    if (!obra) {
      return res.status(404).json({ error: "Obra não encontrada." });
    }
    
    // Se for um canal e estiver usando um banner genérico, tentar buscar o banner real do YouTube se houver chave configurada
    if (obra.tipo === 'canal') {
      const isPlaceholder = !obra.banner || 
                            obra.banner.includes('unsplash.com') || 
                            obra.banner.includes('photo-1611162617474-5b21e879e113') ||
                            obra.banner.includes('photo-1618005182384-a83a8bd57fbe');
      const apiKey = process.env.YOUTUBE_API_KEY;
      const hasKey = apiKey && apiKey !== "MY_YOUTUBE_API_KEY";
      
      if (isPlaceholder && hasKey && obra.channelId) {
        try {
          console.log(`[YouTube Banner Sync] Buscando banner e avatar real para ${obra.titulo} (${obra.channelId})...`);
          const detailUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&id=${obra.channelId}&key=${apiKey}`;
          const detailRes = await safeFetch(detailUrl);
          if (detailRes && detailRes.ok) {
            const detailData: any = await detailRes.json();
            const item = detailData.items?.[0];
            if (item) {
              const bannerUrl = item.brandingSettings?.image?.bannerExternalUrl;
              const avatarUrl = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url;
              
              let changed = false;
              if (bannerUrl && obra.banner !== bannerUrl) {
                obra.banner = bannerUrl;
                changed = true;
                console.log(`[YouTube Banner Sync] Banner atualizado com sucesso para: ${obra.titulo}`);
              }
              if (avatarUrl && obra.poster !== avatarUrl) {
                obra.poster = avatarUrl;
                changed = true;
              }
              if (changed) {
                localDb.saveObra(obra);
              }
            }
          }
        } catch (err) {
          console.error("Erro ao sincronizar banner real do canal:", err);
        }
      }
    }

    // Get reacts
    let reacts = localDb.getReacts().filter(r => r.obraId === obra.id);

    // Se não houver reacts locais e tiver chave configurada, buscar dinamicamente do YouTube!
    if (reacts.length === 0 && process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY !== "MY_YOUTUBE_API_KEY") {
      const query = `${obra.titulo} react`;
      reacts = await searchAndSaveReacts(obra.id, query, 5);
    }

    // Get comments
    const comentarios = localDb.getComentarios(obra.id);
    // Calculate average score safely
    const avgScore = comentarios.length > 0
      ? Number((comentarios.reduce((acc, curr) => acc + (curr.nota || 5), 0) / comentarios.length).toFixed(1))
      : 4.8;

    res.json({
      ...obra,
      reacts,
      comentarios,
      notaMedia: avgScore
    });
  } catch (error: any) {
    console.error("Erro ao carregar detalhes da obra:", error);
    res.status(500).json({ error: "Erro ao buscar detalhes da obra." });
  }
});

interface ResolvedYouTubeChannel {
  channelId: string;
  titulo: string;
  sinopse: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  source: 'api' | 'scrape' | 'oembed';
}

const YOUTUBE_BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
};

function extractVideoIdFromUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function resolveChannelViaOEmbed(videoUrl: string): Promise<{ authorUrl: string; authorName: string; thumbnailUrl?: string } | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
    const res = await safeFetch(oembedUrl);
    if (!res?.ok) return null;
    const data: any = await res.json();
    if (!data?.author_url || !data?.author_name) return null;
    return {
      authorUrl: data.author_url,
      authorName: data.author_name,
      thumbnailUrl: data.thumbnail_url,
    };
  } catch (err) {
    console.warn('[YouTube oEmbed] Falha ao resolver vídeo:', err);
    return null;
  }
}

async function scrapeYouTubeChannelPage(pageUrl: string): Promise<ResolvedYouTubeChannel | null> {
  try {
    const normalizedUrl = pageUrl.startsWith('http')
      ? pageUrl.split('?')[0]
      : `https://www.youtube.com/@${pageUrl.replace(/^@/, '')}`;

    const res = await safeFetch(normalizedUrl, { headers: YOUTUBE_BROWSER_HEADERS });
    if (!res?.ok) {
      console.warn(`[YouTube Scrape] HTTP ${res?.status || 'erro'} para ${normalizedUrl}`);
      return null;
    }

    const html = await res.text();
    const channelId =
      html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/)?.[1] ||
      html.match(/"externalId":"(UC[a-zA-Z0-9_-]{22})"/)?.[1] ||
      html.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/)?.[1] ||
      null;

    const ogTitle =
      html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)?.[1] ||
      html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i)?.[1];
    const titulo = decodeHtmlEntities(ogTitle || '').replace(/\s*-\s*YouTube\s*$/i, '').trim();

    const ogImage =
      html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)?.[1] ||
      html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i)?.[1];
    const avatarUrl = ogImage && !ogImage.includes('youtube_logo') && !ogImage.includes('yt_logo')
      ? decodeHtmlEntities(ogImage)
      : null;

    const bannerMatch =
      html.match(/"bannerExternalUrl":"(https:\\\/\\\/[^"]+)"/)?.[1] ||
      html.match(/"bannerExternalUrl":"(https:\/\/[^"]+)"/)?.[1];
    const bannerUrl = bannerMatch ? decodeHtmlEntities(bannerMatch.replace(/\\\//g, '/')) : null;

    const ogDesc =
      html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i)?.[1] ||
      html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:description"/i)?.[1];
    const sinopse = decodeHtmlEntities(ogDesc || '').trim();

    if (!channelId && !titulo) return null;

    return {
      channelId: channelId || '',
      titulo: titulo || 'Canal do YouTube',
      sinopse: sinopse || 'Canal de reacts no YouTube.',
      avatarUrl,
      bannerUrl,
      source: 'scrape',
    };
  } catch (err) {
    console.error('[YouTube Scrape] Erro ao extrair metadados:', err);
    return null;
  }
}

async function fetchChannelViaYouTubeApi(
  idObj: { type: 'id' | 'handle' | 'username' | 'search'; value: string },
  apiKey: string
): Promise<ResolvedYouTubeChannel | null> {
  try {
    let apiUrl = '';
    if (idObj.type === 'id') {
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&id=${idObj.value}&key=${apiKey}`;
    } else if (idObj.type === 'handle') {
      const handle = idObj.value.startsWith('@') ? idObj.value : `@${idObj.value}`;
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`;
    } else if (idObj.type === 'username') {
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&forUsername=${encodeURIComponent(idObj.value)}&key=${apiKey}`;
    } else {
      apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(idObj.value)}&key=${apiKey}&maxResults=1`;
    }

    let channelRes = await safeFetch(apiUrl);
    if (!channelRes?.ok && idObj.type === 'handle') {
      const handleWithoutAt = idObj.value.replace(/^@/, '');
      const retryUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&forHandle=${encodeURIComponent(handleWithoutAt)}&key=${apiKey}`;
      channelRes = await safeFetch(retryUrl);
    }

    if (!channelRes?.ok) {
      const errText = channelRes ? await channelRes.text().catch(() => '') : 'network error';
      console.warn(`[YouTube API] Falha ao buscar canal (${idObj.type}):`, errText.slice(0, 200));
      return null;
    }

    const channelData: any = await channelRes.json();
    let item = null;

    if (idObj.type === 'search' && channelData.items?.[0]) {
      const foundChannelId = channelData.items[0].id?.channelId || channelData.items[0].snippet?.channelId;
      if (foundChannelId) {
        return fetchChannelViaYouTubeApi({ type: 'id', value: foundChannelId }, apiKey);
      }
    } else if (channelData.items?.[0]) {
      item = channelData.items[0];
    }

    if (!item) return null;

    const snippet = item.snippet || {};
    const branding = item.brandingSettings || {};

    return {
      channelId: item.id,
      titulo: snippet.title || 'Canal do YouTube',
      sinopse: snippet.description || 'Canal de reacts no YouTube.',
      avatarUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || null,
      bannerUrl: branding.image?.bannerExternalUrl || null,
      source: 'api',
    };
  } catch (err) {
    console.error('[YouTube API] Erro ao buscar canal:', err);
    return null;
  }
}

function buildChannelPageUrl(
  input: string,
  idObj: { type: 'id' | 'handle' | 'username' | 'search'; value: string }
): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('http')) return trimmed.split('?')[0];

  if (idObj.type === 'handle') {
    const handle = idObj.value.startsWith('@') ? idObj.value : `@${idObj.value}`;
    return `https://www.youtube.com/${handle}`;
  }
  if (idObj.type === 'id') return `https://www.youtube.com/channel/${idObj.value}`;
  if (idObj.type === 'username') return `https://www.youtube.com/user/${idObj.value}`;
  if (idObj.type === 'search' && trimmed.includes('youtube.com/c/')) {
    return trimmed.startsWith('http') ? trimmed : `https://www.youtube.com/c/${idObj.value}`;
  }
  return `https://www.youtube.com/@${trimmed.replace(/^@/, '')}`;
}

async function resolveYouTubeChannel(inputUrl: string): Promise<ResolvedYouTubeChannel | null> {
  const trimmed = inputUrl.trim();
  const apiKey = getYoutubeApiKey();

  const videoId = extractVideoIdFromUrl(trimmed);
  if (videoId) {
    const videoUrl = trimmed.startsWith('http') ? trimmed : `https://www.youtube.com/watch?v=${videoId}`;
    const oembed = await resolveChannelViaOEmbed(videoUrl);
    if (oembed) {
      const fromAuthorPage = await scrapeYouTubeChannelPage(oembed.authorUrl);
      if (fromAuthorPage) {
        return {
          ...fromAuthorPage,
          titulo: fromAuthorPage.titulo !== 'Canal do YouTube' ? fromAuthorPage.titulo : oembed.authorName,
          avatarUrl: fromAuthorPage.avatarUrl || oembed.thumbnailUrl || null,
          source: fromAuthorPage.source,
        };
      }

      const authorIdObj = extractYouTubeIdentifier(oembed.authorUrl);
      if (apiKey) {
        const fromApi = await fetchChannelViaYouTubeApi(authorIdObj, apiKey);
        if (fromApi) {
          return { ...fromApi, titulo: fromApi.titulo || oembed.authorName };
        }
      }

      const authorChannelId = authorIdObj.type === 'id'
        ? authorIdObj.value
        : (oembed.authorUrl.match(/channel\/(UC[a-zA-Z0-9_-]{22})/)?.[1] || '');

      return {
        channelId: authorChannelId,
        titulo: oembed.authorName,
        sinopse: 'Canal de reacts no YouTube.',
        avatarUrl: oembed.thumbnailUrl || null,
        bannerUrl: null,
        source: 'oembed',
      };
    }
  }

  const idObj = extractYouTubeIdentifier(trimmed);

  if (apiKey) {
    const fromApi = await fetchChannelViaYouTubeApi(idObj, apiKey);
    if (fromApi) return fromApi;
  }

  const pageUrl = buildChannelPageUrl(trimmed, idObj);
  const scraped = await scrapeYouTubeChannelPage(pageUrl);
  if (!scraped) return null;

  if (apiKey && scraped.channelId.startsWith('UC')) {
    const enriched = await fetchChannelViaYouTubeApi({ type: 'id', value: scraped.channelId }, apiKey);
    if (enriched) {
      return {
        ...enriched,
        titulo: enriched.titulo || scraped.titulo,
        sinopse: enriched.sinopse || scraped.sinopse,
        avatarUrl: enriched.avatarUrl || scraped.avatarUrl,
        bannerUrl: enriched.bannerUrl || scraped.bannerUrl,
      };
    }
  }

  return scraped;
}

function extractYouTubeIdentifier(url: string): { type: 'id' | 'handle' | 'username' | 'search'; value: string } {
  const cleanedUrl = url.trim().split('?')[0].replace(/\/+$/, '');

  const channelIdMatch = cleanedUrl.match(/(?:youtube\.com\/channel\/|youtube\.com\/channels\/)(UC[a-zA-Z0-9_-]{22})/);
  if (channelIdMatch) {
    return { type: 'id', value: channelIdMatch[1] };
  }

  const handleMatch = cleanedUrl.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([a-zA-Z0-9_.-]+)/i);
  if (handleMatch) {
    return { type: 'handle', value: '@' + handleMatch[1] };
  }

  if (cleanedUrl.startsWith('@')) {
    return { type: 'handle', value: cleanedUrl };
  }

  const userMatch = cleanedUrl.match(/youtube\.com\/user\/([a-zA-Z0-9_.-]+)/i);
  if (userMatch) {
    return { type: 'username', value: userMatch[1] };
  }

  const customMatch = cleanedUrl.match(/youtube\.com\/c\/([a-zA-Z0-9_.-]+)/i);
  if (customMatch) {
    return { type: 'search', value: customMatch[1] };
  }

  return { type: 'search', value: cleanedUrl.replace(/^@/, '').trim() };
}

function buildCanalSlugFromTitle(titulo: string): string {
  const cleanName = titulo.replace(/^Canal\s+/i, '').trim();
  return `canal-${cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
}

interface ResolvedVideoMetadata {
  videoId: string;
  titulo: string;
  canalNome: string;
  authorUrl: string;
  thumbnailUrl: string;
  source: 'oembed' | 'scrape';
}

async function resolveVideoViaOEmbed(videoUrl: string): Promise<ResolvedVideoMetadata | null> {
  const videoId = extractVideoIdFromUrl(videoUrl.trim());
  if (!videoId) return null;

  const normalizedUrl = videoUrl.trim().startsWith('http')
    ? videoUrl.trim()
    : `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(normalizedUrl)}&format=json`;
    const res = await safeFetch(oembedUrl);
    if (!res?.ok) return null;
    const data: any = await res.json();
    if (!data?.title) return null;

    return {
      videoId,
      titulo: data.title,
      canalNome: data.author_name || 'Canal do YouTube',
      authorUrl: data.author_url || '',
      thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      source: 'oembed',
    };
  } catch (err) {
    console.warn('[Catálogo] Falha ao resolver vídeo via oEmbed:', err);
    return null;
  }
}

function obraFromResolvedChannel(
  resolved: ResolvedYouTubeChannel,
  inputUrl: string,
  existingId?: string
) {
  const titulo = resolved.titulo.startsWith('Canal') ? resolved.titulo : `Canal ${resolved.titulo}`;
  const canalSlug = existingId || buildCanalSlugFromTitle(titulo);
  const defaultBanner = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200';
  const defaultPoster = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300';
  const idObj = extractYouTubeIdentifier(inputUrl);

  return {
    id: canalSlug,
    titulo,
    tipo: 'canal' as const,
    sinopse: resolved.sinopse || 'Canal de reacts no YouTube.',
    ano: new Date().getFullYear(),
    generos: ['React', 'Entretenimento', 'YouTube'],
    banner: resolved.bannerUrl || resolved.avatarUrl || defaultBanner,
    poster: resolved.avatarUrl || defaultPoster,
    trailerUrl: resolved.channelId.startsWith('UC')
      ? `https://www.youtube.com/channel/${resolved.channelId}`
      : buildChannelPageUrl(inputUrl, idObj),
    channelId: resolved.channelId.startsWith('UC') ? resolved.channelId : undefined,
  };
}

async function resolveCanalObraForVideo(
  canalNome: string,
  authorUrl: string
) {
  const existingObras = localDb.getObras();
  const cleanName = canalNome.trim().toLowerCase();

  let matchingObra = existingObras.find(o =>
    o.tipo === 'canal' && (
      o.titulo.toLowerCase().includes(cleanName) ||
      cleanName.includes(o.titulo.replace(/^canal\s+/i, '').toLowerCase())
    )
  );

  if (matchingObra) return matchingObra;

  if (authorUrl) {
    const resolved = await resolveYouTubeChannel(authorUrl);
    if (resolved?.titulo) {
      const slug = buildCanalSlugFromTitle(resolved.titulo);
      matchingObra = existingObras.find(o => o.id === slug || o.channelId === resolved.channelId);
      if (matchingObra) return matchingObra;

      return obraFromResolvedChannel(resolved, authorUrl, slug);
    }
  }

  const canalSlug = buildCanalSlugFromTitle(canalNome);
  matchingObra = existingObras.find(o => o.id === canalSlug);
  if (matchingObra) return matchingObra;

  return {
    id: canalSlug,
    titulo: canalNome.startsWith('Canal') ? canalNome : `Canal ${canalNome}`,
    tipo: 'canal' as const,
    sinopse: `Categoria exclusiva para os reacts do canal ${canalNome}.`,
    ano: new Date().getFullYear(),
    generos: ['Reacts', 'YouTube'],
    banner: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1600',
    poster: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300',
    trailerUrl: authorUrl || 'https://www.youtube.com',
  };
}

async function findOrCreateCanalObraForVideo(
  canalNome: string,
  authorUrl: string
) {
  const resolved = await resolveCanalObraForVideo(canalNome, authorUrl);
  const existing = localDb.getObras().find(o => o.id === resolved.id);
  if (existing) return existing;
  return localDb.saveObra(resolved as Obra);
}

// ==========================================
// CATÁLOGO MANUAL (sem depender da API do YouTube)
// ==========================================

app.post('/api/catalogo/canal/preview', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { url } = req.body;
  if (!url?.trim()) {
    return res.status(400).json({ error: 'Informe o link do canal do YouTube.' });
  }

  try {
    const resolved = await resolveYouTubeChannel(url.trim());
    if (!resolved?.titulo) {
      return res.status(404).json({ error: 'Não foi possível obter os dados deste canal. Verifique o link.' });
    }

    const slug = buildCanalSlugFromTitle(resolved.titulo);
    const existing = localDb.getObras().find(o => o.id === slug || (resolved.channelId && o.channelId === resolved.channelId));

    res.json({
      preview: {
        id: existing?.id || slug,
        titulo: resolved.titulo.startsWith('Canal') ? resolved.titulo : `Canal ${resolved.titulo}`,
        sinopse: resolved.sinopse,
        poster: resolved.avatarUrl,
        banner: resolved.bannerUrl || resolved.avatarUrl,
        channelId: resolved.channelId || null,
        source: resolved.source,
        alreadyExists: !!existing,
      },
    });
  } catch (error: any) {
    console.error('[Catálogo] Erro no preview do canal:', error);
    res.status(500).json({ error: 'Erro ao carregar preview do canal.' });
  }
});

app.post('/api/catalogo/canal', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { url } = req.body;
  if (!url?.trim()) {
    return res.status(400).json({ error: 'Informe o link do canal do YouTube.' });
  }

  try {
    const resolved = await resolveYouTubeChannel(url.trim());
    if (!resolved?.titulo) {
      return res.status(404).json({ error: 'Não foi possível importar este canal. Verifique o link.' });
    }

    let avatarUrl = resolved.avatarUrl;
    if (!avatarUrl && resolved.channelId.startsWith('UC')) {
      avatarUrl = await fetchRealChannelAvatar(
        resolved.channelId,
        buildChannelPageUrl(url.trim(), extractYouTubeIdentifier(url.trim()))
      );
    }

    const obraData = obraFromResolvedChannel(
      { ...resolved, avatarUrl: avatarUrl || resolved.avatarUrl },
      url.trim()
    );

    const existing = localDb.getObras().find(o =>
      o.id === obraData.id || (obraData.channelId && o.channelId === obraData.channelId)
    );

    const saved = localDb.saveObra(existing ? { ...existing, ...obraData, id: existing.id } : obraData);

    res.json({
      success: true,
      obra: saved,
      mode: resolved.source,
      savedToSupabase: localDb.isSupabaseActive(),
      message: existing
        ? `Canal "${saved.titulo}" atualizado no catálogo.`
        : `Canal "${saved.titulo}" adicionado ao catálogo.`,
    });
  } catch (error: any) {
    console.error('[Catálogo] Erro ao salvar canal:', error);
    res.status(500).json({ error: 'Erro ao salvar canal no catálogo.' });
  }
});

app.post('/api/catalogo/video/preview', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { url } = req.body;
  if (!url?.trim()) {
    return res.status(400).json({ error: 'Informe o link do vídeo do YouTube.' });
  }

  try {
    const meta = await resolveVideoViaOEmbed(url.trim());
    if (!meta) {
      return res.status(404).json({ error: 'Não foi possível obter os dados deste vídeo. Verifique o link.' });
    }

    const existing = localDb.getReacts().find(r => r.id === meta.videoId);
    const canalObra = await resolveCanalObraForVideo(meta.canalNome, meta.authorUrl);

    res.json({
      preview: {
        id: meta.videoId,
        titulo: meta.titulo,
        canalNome: meta.canalNome,
        thumbnailUrl: meta.thumbnailUrl,
        obraId: canalObra.id,
        obraTitulo: canalObra.titulo,
        source: meta.source,
        alreadyExists: !!existing,
      },
    });
  } catch (error: any) {
    console.error('[Catálogo] Erro no preview do vídeo:', error);
    res.status(500).json({ error: 'Erro ao carregar preview do vídeo.' });
  }
});

app.post('/api/catalogo/video', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { url, obraId } = req.body;
  if (!url?.trim()) {
    return res.status(400).json({ error: 'Informe o link do vídeo do YouTube.' });
  }

  try {
    const meta = await resolveVideoViaOEmbed(url.trim());
    if (!meta) {
      return res.status(404).json({ error: 'Não foi possível importar este vídeo. Verifique o link.' });
    }

    let targetObra = obraId
      ? localDb.getObras().find(o => o.id === obraId)
      : null;

    if (!targetObra) {
      targetObra = await findOrCreateCanalObraForVideo(meta.canalNome, meta.authorUrl);
    }

    const existing = localDb.getReacts().find(r => r.id === meta.videoId);
    const reactPayload: ReactVideo = {
      id: meta.videoId,
      titulo: meta.titulo,
      canalNome: meta.canalNome,
      canalId: targetObra.channelId || '',
      publicadoEm: new Date().toISOString().split('T')[0],
      duracao: existing?.duracao || '--:--',
      visualizacoes: existing?.visualizacoes || 0,
      thumbnailUrl: meta.thumbnailUrl,
      obraId: targetObra.id,
      isRecomendado: existing?.isRecomendado || false,
      likes: existing?.likes || 0,
    };

    const saved = localDb.saveReact(reactPayload);

    res.json({
      success: true,
      react: saved,
      obra: targetObra,
      mode: meta.source,
      savedToSupabase: localDb.isSupabaseActive(),
      message: existing
        ? `Vídeo "${saved.titulo}" atualizado no catálogo.`
        : `Vídeo "${saved.titulo}" adicionado ao catálogo de ${targetObra.titulo}.`,
    });
  } catch (error: any) {
    console.error('[Catálogo] Erro ao salvar vídeo:', error);
    res.status(500).json({ error: 'Erro ao salvar vídeo no catálogo.' });
  }
});

app.post("/api/canais/importar", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "O link ou identificador do canal é obrigatório." });
  }

  try {
    console.log(`[Importar Canal] Resolvendo metadados para: ${url}`);
    const resolved = await resolveYouTubeChannel(url);

    if (resolved && resolved.titulo) {
      let avatarUrl = resolved.avatarUrl;
      let bannerUrl = resolved.bannerUrl;

      if (!avatarUrl && resolved.channelId.startsWith('UC')) {
        avatarUrl = await fetchRealChannelAvatar(resolved.channelId, buildChannelPageUrl(url, extractYouTubeIdentifier(url)));
      }

      const titulo = resolved.titulo;
      const cleanName = titulo.replace(/^Canal\s+/i, '').trim();
      const canalSlug = `canal-${cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

      const defaultBanner = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200";
      const defaultPoster = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300";

      const novaObra = localDb.saveObra({
        id: canalSlug,
        titulo: titulo.startsWith("Canal") ? titulo : `Canal ${titulo}`,
        tipo: 'canal',
        sinopse: resolved.sinopse || `Canal focado em reacts no YouTube.`,
        ano: new Date().getFullYear(),
        generos: ["React", "Entretenimento", "YouTube"],
        banner: bannerUrl || avatarUrl || defaultBanner,
        poster: avatarUrl || defaultPoster,
        trailerUrl: resolved.channelId.startsWith('UC')
          ? `https://www.youtube.com/channel/${resolved.channelId}`
          : buildChannelPageUrl(url, extractYouTubeIdentifier(url)),
        channelId: resolved.channelId.startsWith('UC') ? resolved.channelId : undefined,
      });

      if (resolved.channelId.startsWith('UC')) {
        await syncChannelVideos(resolved.channelId, canalSlug);
      } else {
        const reactsAdded = await discoverReactsFromYouTube(titulo, canalSlug, 12);
        console.log(`[Importar Canal] ${reactsAdded} reacts encontrados via busca para ${titulo}`);
      }

      localDb.addNotificacao({
        titulo: `Novo Canal Importado: ${titulo}`,
        mensagem: `O canal ${titulo} foi importado com dados reais do YouTube (${resolved.source}).`,
        canalNome: titulo,
        usuarioEmail: req.body.email
      });

      return res.status(200).json({
        success: true,
        obra: novaObra,
        mode: resolved.source === 'api' ? 'real' : resolved.source,
      });
    }

    // Fallback para simulação do Gemini se houver chave do Gemini configurada
    if (ai) {
      try {
        console.log(`[Importar Canal] Simulando canal com Gemini para "${url}"...`);
        const cleanQuery = url.replace(/(https?:\/\/)?(www\.)?youtube\.com\/(channel\/|c\/|@|user\/)?/, "").replace(/@/, "").trim();
        const prompt = `Gere dados realistas em formato JSON para um canal do YouTube de reacts baseado no termo/link: "${cleanQuery}".
        Retorne APENAS o JSON no formato abaixo, sem formatação markdown de código, sem blocos de código markdown \`\`\`json. O JSON deve ser perfeitamente parseável.
        
        Formato do JSON esperado:
        {
          "titulo": "Nome do Criador (ex: Casimiro)",
          "sinopse": "Uma descrição divertida e animada sobre os reacts do canal e seu carisma.",
          "banner": "URL de uma imagem do unsplash (ex: https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200)",
          "poster": "URL de uma foto de perfil ou avatar do unsplash (ex: https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300)",
          "ano": 2021,
          "generos": ["React", "Divertido", "Humor"],
          "videos": [
            {
              "id": "mock_id_1",
              "titulo": "REACT - ASSISTINDO OS VÍDEOS MAIS ENGRAÇADOS DA INTERNET",
              "duracao": "18:45",
              "visualizacoes": 345000,
              "publicadoEm": "2026-07-15"
            },
            {
              "id": "mock_id_2",
              "titulo": "ELE REAGIU AO MELHOR EPISÓDIO DE ANIME DO ANO",
              "duracao": "24:12",
              "visualizacoes": 512000,
              "publicadoEm": "2026-07-12"
            },
            {
              "id": "mock_id_3",
              "titulo": "REAGINDO À GAMEPLAY COMPLETA DE MEDO",
              "duracao": "15:30",
              "visualizacoes": 220000,
              "publicadoEm": "2026-07-10"
            },
            {
              "id": "mock_id_4",
              "titulo": "REACT - COMPILADO DE MOMENTOS INCRÍVEIS DOS JOGOS",
              "duracao": "12:05",
              "visualizacoes": 180000,
              "publicadoEm": "2026-07-08"
            },
            {
              "id": "mock_id_5",
              "titulo": "ESSE REACT VAI TE FAZER RIR MUITO - MELHORES JOGADAS",
              "duracao": "20:18",
              "visualizacoes": 420000,
              "publicadoEm": "2026-07-05"
            }
          ]
        }`;

        const geminiRes = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const text = geminiRes.text;
        if (text) {
          let cleanText = text.trim();
          if (cleanText.startsWith("```")) {
            cleanText = cleanText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
          }

          const data = JSON.parse(cleanText);
          const title = data.titulo || "Canal Reativo";
          const canalSlug = `canal-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

          const novaObra = localDb.saveObra({
            id: canalSlug,
            titulo: title.startsWith("Canal") ? title : `Canal ${title}`,
            tipo: 'canal',
            sinopse: data.sinopse || `Canal focado em reacts super divertidos.`,
            ano: Number(data.ano) || 2021,
            generos: Array.isArray(data.generos) ? data.generos : ["React", "Entretenimento"],
            banner: data.banner || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200",
            poster: data.poster || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300",
            trailerUrl: "https://www.youtube.com",
            channelId: `simulated_${Math.random().toString(36).substring(2, 12)}`
          });

          if (Array.isArray(data.videos)) {
            data.videos.forEach((vid: any, i: number) => {
              localDb.saveReact({
                id: vid.id || `mock_${canalSlug}_${i}`,
                titulo: vid.titulo || "Vídeo de React",
                canalNome: title,
                canalId: novaObra.channelId || '',
                publicadoEm: vid.publicadoEm || new Date().toISOString().split('T')[0],
                duracao: vid.duracao || "15:00",
                visualizacoes: Number(vid.visualizacoes) || 150000,
                thumbnailUrl: `https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=400`,
                obraId: canalSlug
              });
            });
          }

          localDb.addNotificacao({
            titulo: `Canal Sincronizado por IA: ${title}`,
            mensagem: `O canal ${title} foi criado com simulação inteligente de reacts!`,
            canalNome: title,
            usuarioEmail: req.body.email
          });

          return res.status(200).json({ success: true, obra: novaObra, mode: 'simulated' });
        }
      } catch (geminiError) {
        console.error("Erro na simulação do Gemini:", geminiError);
      }
    }

    // 3. Fallback estático se nada mais funcionar
    console.log(`[Importar Canal] Usando fallback estático de segurança...`);
    const cleanUrl = url.replace(/(https?:\/\/)?(www\.)?youtube\.com\/(channel\/|c\/|@|user\/)?/, "").replace(/@/, "").trim();
    const title = cleanUrl.charAt(0).toUpperCase() + cleanUrl.slice(1);
    const canalSlug = `canal-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    const novaObra = localDb.saveObra({
      id: canalSlug,
      titulo: `Canal ${title}`,
      tipo: 'canal',
      sinopse: `Canal de reacts repleto de entretenimento e comentários inteligentes sobre filmes, séries e animes.`,
      ano: 2023,
      generos: ["React", "Entretenimento"],
      banner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200",
      poster: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300",
      trailerUrl: "https://www.youtube.com",
      channelId: `static_${Math.random().toString(36).substring(2, 10)}`
    });

    for (let i = 1; i <= 5; i++) {
      localDb.saveReact({
        id: `mock_static_${canalSlug}_${i}`,
        titulo: `REACT ${i} - REAGINDO AOS MELHORES MOMENTOS DO FILME DO ANO!`,
        canalNome: title,
        canalId: novaObra.channelId || '',
        publicadoEm: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duracao: `${10 + i}:${15 + i * 5}`,
        visualizacoes: 50000 * i,
        thumbnailUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=400",
        obraId: canalSlug
      });
    }

    localDb.addNotificacao({
      titulo: `Novo Canal Cadastrado (Mock): ${title}`,
      mensagem: `O canal ${title} foi criado com dados mockados de segurança.`,
      canalNome: title,
      usuarioEmail: req.body.email
    });

    return res.status(200).json({ success: true, obra: novaObra, mode: 'static' });

  } catch (error: any) {
    console.error("Erro interno ao importar canal:", error);
    res.status(500).json({ error: "Erro interno no servidor ao tentar importar o canal." });
  }
});

app.post("/api/obras", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { id, titulo, tipo, sinopse, ano, generos, banner, poster, trailerUrl, destacado, channelId } = req.body;
    if (!id || !titulo || !tipo) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }
    const novaObra = localDb.saveObra({
      id,
      titulo,
      tipo,
      sinopse,
      ano: Number(ano) || new Date().getFullYear(),
      generos: Array.isArray(generos) ? generos : [generos],
      banner: banner || "https://images.unsplash.com/photo-1618944913480-b67ee16d7b77?q=80&w=1600&auto=format&fit=crop",
      poster: poster || "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=600&auto=format&fit=crop",
      trailerUrl: trailerUrl || "https://www.youtube.com/watch?v=VyHV0BRZKoI",
      destacado: !!destacado,
      channelId
    });
    res.status(201).json(novaObra);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao criar obra." });
  }
});

app.put("/api/obras/:id", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { id } = req.params;
    const existing = localDb.getObras().find(o => o.id === id);
    if (!existing) {
      return res.status(404).json({ error: "Obra não encontrada." });
    }

    const { titulo, tipo, sinopse, ano, generos, banner, poster, trailerUrl, destacado, channelId } = req.body;
    const updated = localDb.saveObra({
      ...existing,
      titulo: titulo ?? existing.titulo,
      tipo: tipo ?? existing.tipo,
      sinopse: sinopse ?? existing.sinopse,
      ano: ano !== undefined ? Number(ano) : existing.ano,
      generos: Array.isArray(generos) ? generos : (typeof generos === "string" ? generos.split(",").map((s: string) => s.trim()) : existing.generos),
      banner: banner ?? existing.banner,
      poster: poster ?? existing.poster,
      trailerUrl: trailerUrl ?? existing.trailerUrl,
      destacado: destacado !== undefined ? !!destacado : existing.destacado,
      channelId: channelId ?? existing.channelId,
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao atualizar obra." });
  }
});

app.delete("/api/obras/:id", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    localDb.deleteObra(req.params.id);
    res.json({ message: "Obra excluída com sucesso." });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao excluir obra." });
  }
});

// Reacts routes
app.get("/api/reacts", (req, res) => {
  try {
    const obraId = req.query.obraId as string | undefined;
    const canalId = req.query.canalId as string | undefined;
    const adminEmail = getAdminEmailFromRequest(req);
    const isAdmin = verifyAdminEmailSync(adminEmail);

    let allReacts = localDb.getReacts().filter(r => !isShortOrInvalidReact(r));

    if (obraId) {
      allReacts = allReacts.filter(r => r.obraId === obraId);
    } else if (canalId) {
      allReacts = allReacts.filter(r => r.canalId === canalId);
    }

    allReacts.sort((a, b) => new Date(b.publicadoEm || 0).getTime() - new Date(a.publicadoEm || 0).getTime());

    const shouldLimit = !obraId && !canalId && !isAdmin;
    const result = shouldLimit ? allReacts.slice(0, 500) : allReacts;
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao buscar reacts." });
  }
});

app.post("/api/reacts", async (req, res) => {
  try {
    const { id, obraId, titulo, canalNome, duracao, episodioNum } = req.body;
    if (!id || !obraId) {
      return res.status(400).json({ error: "Campos obrigatórios (id, obraId) ausentes." });
    }

    // Validar vídeo com o YouTube Data API v3
    const validation = await validateYouTubeVideo(id);
    if (!validation.isValid) {
      return res.status(400).json({ error: "Este vídeo do YouTube está indisponível, privado, removido ou não permite incorporação em outros sites." });
    }

    const videoData = validation.videoData;
    const finalTitulo = videoData ? videoData.snippet?.title : (titulo || "React Video");
    const finalCanalNome = videoData ? videoData.snippet?.channelTitle : (canalNome || "Canal do YouTube");
    const finalCanalId = videoData ? videoData.snippet?.channelId : "";
    const finalPublicadoEm = videoData?.snippet?.publishedAt ? videoData.snippet.publishedAt.split('T')[0] : new Date().toISOString().split('T')[0];
    
    let finalDuracao = duracao || "15:00";
    if (videoData?.contentDetails?.duration) {
      finalDuracao = parseISO8601Duration(videoData.contentDetails.duration);
    }

    const finalVisualizacoes = videoData?.statistics?.viewCount ? Number(videoData.statistics.viewCount) : 10000;
    
    const finalThumbnailUrl = videoData?.snippet?.thumbnails?.high?.url || 
                             videoData?.snippet?.thumbnails?.medium?.url || 
                             `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

    const novoReact = localDb.saveReact({
      id,
      titulo: finalTitulo,
      canalNome: finalCanalNome,
      canalId: finalCanalId,
      publicadoEm: finalPublicadoEm,
      duracao: finalDuracao,
      visualizacoes: finalVisualizacoes,
      thumbnailUrl: finalThumbnailUrl,
      obraId,
      episodioNum: episodioNum ? Number(episodioNum) : undefined
    });

    // Adiciona uma notificação aos seguidores do canal!
    localDb.addNotificacao({
      titulo: `Novo React de ${finalCanalNome}`,
      mensagem: `O canal ${finalCanalNome} acabou de postar um react para a obra: "${finalTitulo.slice(0, 40)}..."`,
      canalNome: finalCanalNome,
      obraId
    });

    res.status(201).json(novoReact);
  } catch (error: any) {
    console.error("Erro ao criar react:", error);
    res.status(500).json({ error: "Erro ao criar react." });
  }
});

app.delete("/api/reacts/:id", (req, res) => {
  try {
    localDb.deleteReact(req.params.id);
    res.json({ message: "React excluído com sucesso." });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao excluir react." });
  }
});

app.post("/api/reacts/:id/like", (req, res) => {
  try {
    const { action } = req.body; // 'like' | 'unlike'
    const newLikes = localDb.likeReact(req.params.id, action === 'unlike' ? 'unlike' : 'like');
    res.json({ success: true, likes: newLikes });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao curtir vídeo de react." });
  }
});

app.post("/api/reacts/:id/recomendar", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { id } = req.params;
    const { recomendado } = req.body;
    const reacts = localDb.getReacts();
    const react = reacts.find(r => r.id === id);
    if (!react) {
      return res.status(404).json({ error: "React não encontrado." });
    }
    react.isRecomendado = recomendado !== undefined ? !!recomendado : !react.isRecomendado;
    localDb.saveReact(react);
    res.json(react);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao atualizar status de recomendação." });
  }
});

app.post("/api/reacts/recomendar-link", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: "O link do vídeo do YouTube é obrigatório." });
    }

    // Extrator de ID do vídeo do YouTube
    const extractYouTubeVideoId = (ytUrl: string): string | null => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
      const match = ytUrl.match(regExp);
      if (match && match[2].length === 11) {
        return match[2];
      }
      const cleaned = ytUrl.trim();
      if (cleaned.length === 11 && !cleaned.includes('/') && !cleaned.includes('.')) {
        return cleaned;
      }
      return null;
    };

    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: "Não foi possível extrair um ID de vídeo válido a partir do link fornecido. Certifique-se de que é um link de vídeo do YouTube válido." });
    }

    // 1. Verificar se o vídeo já existe no DB local
    const existingReact = localDb.getReacts().find(r => r.id === videoId);
    if (existingReact) {
      existingReact.isRecomendado = true;
      localDb.saveReact(existingReact);
      return res.json(existingReact);
    }

    // 2. Se não existir, tentar buscar ou validar via API do YouTube
    const validation = await validateYouTubeVideo(videoId);
    if (validation.isValid && validation.videoData) {
      const video = validation.videoData;
      const snippet = video.snippet || {};
      const contentDetails = video.contentDetails || {};
      const statistics = video.statistics || {};

      const channelId = snippet.channelId || 'canal-recomendados-default';
      const canalNome = snippet.channelTitle || 'Canal do YouTube';
      const canalSlug = canalNome.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-canal';

      const existingObras = localDb.getObras();
      let matchingObra = existingObras.find(o => o.tipo === 'canal' && (o.channelId === channelId || o.id === canalSlug));
      
      if (!matchingObra) {
        let banner = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1200';
        let poster = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300';
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (apiKey && apiKey !== "MY_YOUTUBE_API_KEY") {
          try {
            console.log(`[Recomendar Link] Buscando banner real para o novo canal ${canalNome} (${channelId})...`);
            const detailUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&id=${channelId}&key=${apiKey}`;
            const detailRes = await safeFetch(detailUrl);
            if (detailRes && detailRes.ok) {
              const detailData: any = await detailRes.json();
              const item = detailData.items?.[0];
              if (item) {
                banner = item.brandingSettings?.image?.bannerExternalUrl || banner;
                poster = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || poster;
              }
            }
          } catch (err) {
            console.error("Erro ao obter banner do canal:", err);
          }
        }

        matchingObra = {
          id: canalSlug,
          titulo: canalNome,
          tipo: 'canal',
          sinopse: `Categoria exclusiva para os reacts do canal ${canalNome}. Assista e acompanhe todas as reações maravilhosas deste criador!`,
          ano: new Date().getFullYear(),
          generos: ['Reacts', 'YouTube'],
          banner,
          poster,
          trailerUrl: `https://www.youtube.com/channel/${channelId}`,
          channelId: channelId
        };
        localDb.saveObra(matchingObra);
      }
      const obraId = matchingObra.id;

      const duracao = parseISO8601Duration(contentDetails.duration || '');
      const visualizacoes = Number(statistics.viewCount) || 15000;
      const publicadoEm = snippet.publishedAt ? snippet.publishedAt.split('T')[0] : new Date().toISOString().split('T')[0];
      const thumbnailUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      const newReact: ReactVideo = {
        id: videoId,
        titulo: snippet.title || 'Vídeo Recomendado',
        canalNome,
        canalId: channelId,
        publicadoEm,
        duracao,
        visualizacoes,
        thumbnailUrl,
        obraId,
        isRecomendado: true
      };

      localDb.saveReact(newReact);
      return res.json(newReact);
    }

    // 3. Fallback inteligente usando o Gemini AI se a API do YouTube falhar/não houver chave
    if (ai) {
      try {
        console.log(`[Recomendar Link] Simulando dados do vídeo ${videoId} com Gemini...`);
        const prompt = `Gere dados realistas em formato JSON para um vídeo de react do YouTube com o ID do YouTube "${videoId}" e link original "${url}".
        Como o CineReact é um site de reacts de filmes, séries e animes, invente um título de react focado em obras famosas atuais, um nome de canal de react realista (ex: "Canal do Luan", "Casimiro", "React do Mateus", etc) e estatísticas plausíveis.
        Retorne APENAS o JSON no formato abaixo, sem formatação markdown de código, sem blocos de código markdown \`\`\`json. O JSON deve ser perfeitamente parseável.
        
        Formato do JSON esperado:
        {
          "titulo": "Título do Vídeo em Caixa Alta (ex: REACT - REAGINDO AO TRAILER DE AVATAR 3!)",
          "canalNome": "Nome do canal de react",
          "duracao": "15:40",
          "visualizacoes": 250000
        }`;

        const geminiRes = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const text = geminiRes.text;
        if (text) {
          let cleanText = text.trim();
          if (cleanText.startsWith("```")) {
            cleanText = cleanText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
          }
          const data = JSON.parse(cleanText);

          const canalNome = data.canalNome || 'Canal do YouTube';
          const canalSlug = canalNome.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') + '-canal';

          const existingObras = localDb.getObras();
          let matchingObra = existingObras.find(o => o.tipo === 'canal' && o.id === canalSlug);
          if (!matchingObra) {
            matchingObra = {
              id: canalSlug,
              titulo: canalNome,
              tipo: 'canal',
              sinopse: `Categoria exclusiva para os reacts do canal ${canalNome}. Assista e acompanhe todas as reações maravilhosas deste criador!`,
              ano: new Date().getFullYear(),
              generos: ['Reacts', 'YouTube'],
              banner: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1600',
              poster: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300',
              trailerUrl: `https://www.youtube.com`,
              channelId: 'simulated_' + canalSlug
            };
            localDb.saveObra(matchingObra);
          }
          const obraId = matchingObra.id;

          const newReact: ReactVideo = {
            id: videoId,
            titulo: data.titulo || `REACT - VÍDEO COMPLETO (${videoId})`,
            canalNome: canalNome,
            canalId: matchingObra.channelId,
            publicadoEm: new Date().toISOString().split('T')[0],
            duracao: data.duracao || "14:20",
            visualizacoes: Number(data.visualizacoes) || 85000,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            obraId,
            isRecomendado: true
          };

          localDb.saveReact(newReact);
          return res.json(newReact);
        }
      } catch (geminiErr) {
        console.error("Erro na simulação do Gemini para o link do vídeo:", geminiErr);
      }
    }

    // 4. Fallback estático se nada mais funcionar
    const canalNome = 'CineReact Recomenda';
    const canalSlug = 'cinereact-recomenda-canal';
    const existingObras = localDb.getObras();
    let matchingObra = existingObras.find(o => o.tipo === 'canal' && o.id === canalSlug);
    if (!matchingObra) {
      matchingObra = {
        id: canalSlug,
        titulo: canalNome,
        tipo: 'canal',
        sinopse: 'Vídeos recomendados diretamente pelos editores do CineReact.',
        ano: new Date().getFullYear(),
        generos: ['Destaques', 'Recomendações'],
        banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200',
        poster: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300',
        trailerUrl: 'https://www.youtube.com',
        channelId: 'canal-recomendados-default'
      };
      localDb.saveObra(matchingObra);
    }
    const obraId = matchingObra.id;

    const newReact: ReactVideo = {
      id: videoId,
      titulo: `REACT - RECOMENDAÇÃO EXCLUSIVA DO CINEREACT (${videoId})`,
      canalNome: canalNome,
      canalId: matchingObra.channelId,
      publicadoEm: new Date().toISOString().split('T')[0],
      duracao: '15:30',
      visualizacoes: 105000,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      obraId,
      isRecomendado: true
    };

    localDb.saveReact(newReact);
    return res.json(newReact);

  } catch (error: any) {
    console.error("Erro ao adicionar link recomendado:", error);
    res.status(500).json({ error: "Erro interno no servidor ao processar o link recomendado." });
  }
});

// Comentarios routes
app.get("/api/comentarios", (req, res) => {
  try {
    const obraId = req.query.obraId as string;
    const rawComments = localDb.getComentarios(obraId);
    
    // Enrich comments with user's isDonor status, avatar URL and equipped cosmetics
    const enriched = rawComments.map(c => {
      const userAcct = localDb.findUsuarioByEmailSync(c.usuarioEmail);
      const publicProfile = getPublicUserProfile(c.usuarioEmail);
      return {
        ...c,
        isDonor: userAcct?.isDonor || (c.usuarioEmail === "mateusvini.t10@gmail.com" ? true : false),
        avatar: userAcct?.avatar || "",
        profileDisplay: publicProfile?.profileDisplay ?? getPublicProfileForEmail(c.usuarioEmail),
        publicProfile: publicProfile ?? undefined,
      };
    });
    
    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao buscar comentários." });
  }
});

app.post("/api/comentarios", (req, res) => {
  try {
    const { obraId, usuarioNome, usuarioEmail, texto } = req.body;
    if (!obraId || !usuarioNome || !usuarioEmail || !texto) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }
    const novo = localDb.addComentario({
      id: Math.random().toString(36).substring(2),
      obraId,
      usuarioNome,
      usuarioEmail,
      texto,
      likes: 0,
      criadoEm: new Date().toISOString()
    });
    const gamificationReward = handleGamificationEvent(usuarioEmail, 'comment');
    const publicProfile = getPublicUserProfile(usuarioEmail);
    res.status(201).json({
      ...novo,
      avatar: localDb.findUsuarioByEmailSync(usuarioEmail)?.avatar || "",
      profileDisplay: publicProfile?.profileDisplay ?? getPublicProfileForEmail(usuarioEmail),
      publicProfile: publicProfile ?? undefined,
      gamificationReward,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao adicionar comentário." });
  }
});

app.post("/api/comentarios/:id/like", (req, res) => {
  try {
    const { action } = req.body; // 'like' | 'unlike'
    const newLikes = localDb.likeComentario(req.params.id, action === 'unlike' ? 'unlike' : 'like');
    res.json({ success: true, likes: newLikes });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao atualizar curtida do comentário." });
  }
});

app.delete("/api/comentarios/:id", async (req, res) => {
  try {
    const adminEmail = getAdminEmailFromRequest(req);
    const isAdmin = verifyAdminEmailSync(adminEmail);
    const comentario = localDb.getComentarios().find(c => c.id === req.params.id);
    if (!comentario) {
      return res.status(404).json({ error: "Comentário não encontrado." });
    }

    const requesterEmail = (req.query.email as string) || req.body?.email;
    const isAuthor = requesterEmail && comentario.usuarioEmail.toLowerCase() === requesterEmail.toLowerCase();

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ error: "Sem permissão para remover este comentário." });
    }

    localDb.deleteComentario(req.params.id);
    res.json({ message: "Comentário removido." });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao remover comentário." });
  }
});

// Favoritos routes
app.get("/api/favoritos", (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ error: "Email requerido." });
    res.json(localDb.getFavoritos(email));
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao buscar favoritos." });
  }
});

app.post("/api/favoritos/toggle", (req, res) => {
  try {
    const { email, obraId } = req.body;
    if (!email || !obraId) return res.status(400).json({ error: "Email e ObraId requeridos." });
    const favoritado = localDb.toggleFavorito(email, obraId);
    const gamificationReward = favoritado ? handleGamificationEvent(email, 'favorite') : null;
    res.json({ favoritado, gamificationReward });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao alterar favorito." });
  }
});

// Canais de seguir routes
app.get("/api/canais/seguidos", (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ error: "Email requerido." });
    res.json(localDb.getCanaisSeguidos(email));
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao buscar canais seguidos." });
  }
});

app.get("/api/canais/:canalNome/seguidores", (req, res) => {
  try {
    const { canalNome } = req.params;
    if (!canalNome) return res.status(400).json({ error: "CanalNome requerido." });
    res.json(localDb.getSeguidoresDoCanal(canalNome));
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao buscar seguidores." });
  }
});

app.post("/api/canais/seguir", (req, res) => {
  try {
    const { email, canalNome } = req.body;
    if (!email || !canalNome) return res.status(400).json({ error: "Email e canalNome requeridos." });
    const seguindo = localDb.toggleSeguirCanal(email, canalNome);
    const gamificationReward = seguindo
      ? handleGamificationEvent(email, 'follow_creator', {
          creatorName: canalNome,
          creatorId: resolveCreatorId(canalNome) || undefined,
        })
      : null;
    res.json({ seguindo, gamificationReward });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao seguir canal." });
  }
});

// Listas Personalizadas
app.get("/api/listas", (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ error: "Email requerido." });
    res.json(localDb.getListas(email));
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao buscar listas." });
  }
});

app.post("/api/listas", (req, res) => {
  try {
    const { nome, descricao, usuarioEmail, obraIds } = req.body;
    if (!nome || !usuarioEmail) return res.status(400).json({ error: "Nome e Email requeridos." });
    const nova = localDb.createLista({
      nome,
      descricao: descricao || "",
      usuarioEmail,
      obraIds: Array.isArray(obraIds) ? obraIds : []
    });
    const gamificationReward = handleGamificationEvent(usuarioEmail, 'list_create');
    res.status(201).json({ ...nova, gamificationReward });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao criar lista." });
  }
});

app.put("/api/listas/:id", (req, res) => {
  try {
    const { nome, descricao, usuarioEmail, obraIds } = req.body;
    const atualizada = localDb.updateLista({
      id: req.params.id,
      nome,
      descricao,
      usuarioEmail,
      obraIds
    });
    res.json(atualizada);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao atualizar lista." });
  }
});

app.delete("/api/listas/:id", (req, res) => {
  try {
    localDb.deleteLista(req.params.id);
    res.json({ message: "Lista removida com sucesso." });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao remover lista." });
  }
});

// Notificações
app.get("/api/notificacoes", (req, res) => {
  try {
    const email = req.query.email as string;
    res.json(localDb.getNotificacoes(email));
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar notificações." });
  }
});

app.post("/api/notificacoes/:id/ler", (req, res) => {
  try {
    localDb.marcarNotificacaoComoLida(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar notificação." });
  }
});

app.delete("/api/notificacoes", (req, res) => {
  try {
    const email = req.query.email as string;
    localDb.limparNotificacoes(email);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao limpar notificações." });
  }
});

// Solicitações de adição de canais por criadores de conteúdo
app.post("/api/solicitacoes-canal", (req, res) => {
  try {
    const { canalNome, canalUrl, emailContato } = req.body;
    if (!canalNome || !canalUrl || !emailContato) {
      return res.status(400).json({ error: "Todos os campos (canalNome, canalUrl, emailContato) são obrigatórios." });
    }
    
    // Cria uma notificação que o admin poderá ver
    localDb.addNotificacao({
      titulo: `Solicitação: Novo Canal por Criador`,
      mensagem: `O criador de conteúdo solicitou a inclusão do canal "${canalNome}" (${canalUrl}). E-mail de contato: ${emailContato}`,
      canalNome: canalNome
    });

    res.status(201).json({ success: true, message: "Solicitação enviada com sucesso! Analisaremos o canal em breve." });
  } catch (error: any) {
    console.error("Erro ao enviar solicitação de canal:", error);
    res.status(500).json({ error: "Erro interno no servidor ao processar a solicitação." });
  }
});

// Cadastro de novos usuários
app.post("/api/cadastro", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    const existing = await localDb.findUsuarioByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Este e-mail já está cadastrado." });
    }

    const isSupabase = localDb.isSupabaseActive();
    let novoUsuario;
    let requiresVerification = false;

    if (isSupabase) {
      const supabase = localDb.getSupabaseClient();
      // SignUp using Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (authError) {
        console.error("Erro ao registrar no Supabase Auth:", authError);
        let errorMsg = `Erro no Supabase Auth: ${authError.message}`;
        if (authError.message.toLowerCase().includes("rate limit") || authError.message.toLowerCase().includes("limiar")) {
          errorMsg = "Limite de envio de e-mails excedido no Supabase (limite padrão de 3 e-mails por hora). Para facilitar os testes e liberar acesso instantâneo sem precisar confirmar e-mail, acesse o painel do Supabase -> Authentication -> Providers -> Email e DESATIVE a opção 'Confirm email'.";
        }
        return res.status(400).json({ error: errorMsg });
      }

      const userId = authData.user?.id || Math.random().toString(36).substring(2);

      // Check if registration requires email verification
      if (!authData.session && authData.user && !authData.user.confirmed_at) {
        requiresVerification = true;
      }

      // Now create profile in public table
      novoUsuario = await localDb.addUsuario({
        username,
        email,
        password,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120",
        isAdmin: email.toLowerCase() === "mateusvini.t10@gmail.com",
        isDonor: false
      }, userId);
    } else {
      novoUsuario = await localDb.addUsuario({
        username,
        email,
        password,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120",
        isAdmin: email.toLowerCase() === "mateusvini.t10@gmail.com",
        isDonor: false
      });
    }

    res.status(201).json({
      success: true,
      requiresVerification,
      email: novoUsuario.email,
      user: requiresVerification ? null : serializeUserState(novoUsuario)
    });
  } catch (error: any) {
    console.error("Erro no cadastro de usuário:", error);
    res.status(500).json({ error: error.message || "Erro interno no servidor ao realizar cadastro." });
  }
});

// Login de usuários
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Master admin credentials check for mateusvini.t10@gmail.com
    if (cleanEmail === "mateusvini.t10@gmail.com" && (password === "admin" || password === "Zantnoar12")) {
      let dbAdmin = await localDb.findUsuarioByEmail(cleanEmail);
      if (!dbAdmin) {
        dbAdmin = await localDb.addUsuario({
          username: "Mateus Vinícius",
          email: "mateusvini.t10@gmail.com",
          password: password,
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120",
          isAdmin: true,
          isDonor: false
        });
      } else {
        if (!dbAdmin.isAdmin || dbAdmin.password !== password) {
          await localDb.updateUsuario(cleanEmail, { isAdmin: true, password });
        }
      }
      return res.json({
        success: true,
        user: serializeUserState(dbAdmin, { isAdmin: true }),
      });
    }

    const isSupabase = localDb.isSupabaseActive();

    if (isSupabase) {
      const supabase = localDb.getSupabaseClient();
      // Login using Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (authError) {
        console.error("Erro ao autenticar no Supabase Auth:", authError);
        let errorMsg = 'E-mail ou senha incorretos. Verifique e tente novamente.';
        if (authError.message.toLowerCase().includes("confirm")) {
          return res.status(401).json({
            error: "Seu e-mail ainda não foi verificado. Insira o código de confirmação enviado para o seu e-mail.",
            requiresVerification: true,
            email: cleanEmail
          });
        }
        return res.status(401).json({ error: errorMsg });
      }

      // Fetch user profile from public table
      let user = await localDb.findUsuarioByEmail(cleanEmail);
      if (!user) {
        // Fallback user profile creation if they exist in auth but not public table
        user = await localDb.addUsuario({
          username: authData.user?.user_metadata?.username || cleanEmail.split('@')[0],
          email: cleanEmail,
          password: password,
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120",
          isAdmin: cleanEmail === "mateusvini.t10@gmail.com",
          isDonor: false
        }, authData.user?.id);
      }

      return res.json({
        success: true,
        user: serializeUserState(user, {
          isAdmin: user.isAdmin || user.email.toLowerCase() === "mateusvini.t10@gmail.com",
        }),
      });
    } else {
      const user = await localDb.findUsuarioByEmail(cleanEmail);
      if (!user) {
        return res.status(401).json({ error: "E-mail não cadastrado." });
      }

      if (user.password !== password) {
        return res.status(401).json({ error: "Senha incorreta." });
      }

      res.json({
        success: true,
        user: serializeUserState(user, {
          isAdmin: user.isAdmin || user.email.toLowerCase() === "mateusvini.t10@gmail.com",
        }),
      });
    }
  } catch (error) {
    console.error("Erro no login de usuário:", error);
    res.status(500).json({ error: "Erro interno no servidor ao realizar login." });
  }
});

// Verificar código de e-mail OTP do Supabase
app.post("/api/verificar-codigo", async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ error: "E-mail e código de verificação são obrigatórios." });
    }

    const isSupabase = localDb.isSupabaseActive();
    if (!isSupabase) {
      return res.status(400).json({ error: "O Supabase não está ativo no momento." });
    }

    const supabase = localDb.getSupabaseClient();
    // Verify the OTP/token sent to the user's email
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    });

    if (authError) {
      console.error("Erro ao verificar OTP no Supabase:", authError);
      return res.status(400).json({ error: `Código de confirmação inválido ou expirado: ${authError.message}` });
    }

    // Now retrieve or create their user profile in public table
    let user = await localDb.findUsuarioByEmail(email);
    if (!user) {
      user = await localDb.addUsuario({
        username: authData.user?.user_metadata?.username || email.split('@')[0],
        email: email,
        password: '', // Password handled by auth
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120",
        isAdmin: email.toLowerCase() === "mateusvini.t10@gmail.com",
        isDonor: false
      }, authData.user?.id);
    }

    res.json({
      success: true,
      user: serializeUserState(user),
    });
  } catch (error: any) {
    console.error("Erro ao verificar código OTP:", error);
    res.status(500).json({ error: error.message || "Erro interno ao realizar verificação." });
  }
});

// Reenviar código de verificação do Supabase
app.post("/api/reenviar-codigo", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "E-mail é obrigatório." });
    }

    const isSupabase = localDb.isSupabaseActive();
    if (!isSupabase) {
      return res.status(400).json({ error: "O Supabase não está ativo no momento." });
    }

    const supabase = localDb.getSupabaseClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    });

    if (error) {
      console.error("Erro ao reenviar OTP no Supabase:", error);
      let errorMsg = `Erro ao reenviar código: ${error.message}`;
      if (error.message.toLowerCase().includes("rate limit") || error.message.toLowerCase().includes("limiar")) {
        errorMsg = "Limite de envio de e-mails excedido no Supabase (limite de 3 e-mails por hora no provedor padrão). Recomendamos desativar 'Confirm email' nas configurações do Supabase Dashboard (Authentication -> Providers -> Email) para testes sem limitações.";
      }
      return res.status(400).json({ error: errorMsg });
    }

    res.json({
      success: true,
      message: "Um novo código de confirmação foi enviado para o seu e-mail."
    });
  } catch (error: any) {
    console.error("Erro ao reenviar OTP:", error);
    res.status(500).json({ error: error.message || "Erro interno ao reenviar código." });
  }
});

// Obter informações atualizadas do usuário
app.get("/api/usuario/me", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "E-mail é obrigatório." });
    }

    const user = await localDb.findUsuarioByEmail(email as string);
    if (!user) {
      // Default hardcoded admin fallback
      if ((email as string).toLowerCase() === "mateusvini.t10@gmail.com") {
        return res.json({
          success: true,
          user: {
            isLoggedIn: true,
            nome: "Mateus Vinícius",
            email: "mateusvini.t10@gmail.com",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120",
            isAdmin: true,
            isDonor: false,
            continueWatching: [],
            descricao: ""
          }
        });
      }
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json({
      success: true,
      user: serializeUserState(user),
    });
  } catch (error) {
    console.error("Erro ao obter perfil do usuário:", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

// Atualizar progresso do "Continue Assistindo"
app.post("/api/usuario/continue-watching", async (req, res) => {
  try {
    const { email, reactId, obraId, progress } = req.body;
    if (!email || !reactId || !obraId) {
      return res.status(400).json({ error: "Parâmetros inválidos." });
    }

    const user = await localDb.findUsuarioByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const currentList = user.continueWatching || [];
    const filtered = currentList.filter(item => item.reactId !== reactId);
    const updatedList = [
      { reactId, obraId, progress, updatedAt: Date.now() },
      ...filtered
    ].slice(0, 20);

    await localDb.updateUsuario(email, { continueWatching: updatedList });

    const react = localDb.getReacts().find((r) => r.id === reactId);
    const obra = localDb.getObras().find((o) => o.id === obraId);
    const creatorId = obra?.tipo === 'canal' ? obraId : resolveCreatorId(react?.canalNome || '', obraId);
    let gamificationReward = handleGamificationEvent(email, 'watch_progress', {
      reactId,
      obraId,
      progress,
      durationMinutes: 1,
      category: obra?.tipo,
      franchiseId: obra?.tipo === 'canal' ? undefined : obraId,
      creatorName: react?.canalNome,
      creatorId: creatorId || undefined,
    });
    if (progress >= 95) {
      const completeReward = handleGamificationEvent(email, 'watch_complete', {
        reactId,
        obraId,
        category: obra?.tipo,
        franchiseId: obra?.tipo === 'canal' ? undefined : obraId,
        creatorName: react?.canalNome,
        creatorId: creatorId || undefined,
      });
      gamificationReward = completeReward;
    }

    res.json({ success: true, continueWatching: updatedList, gamificationReward });
  } catch (error) {
    console.error("Erro ao salvar progresso de reprodução:", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

// Perfil público de usuário (cosméticos + redes para criadores verificados)
app.get("/api/criadores", (_req, res) => {
  try {
    const creators = listVideoCreators();
    res.json({ success: true, creators });
  } catch (error) {
    console.error("Erro ao listar criadores:", error);
    res.status(500).json({ error: "Erro interno ao listar criadores." });
  }
});

app.get("/api/usuario/public/:email", (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email || "");
    if (!email) return res.status(400).json({ error: "E-mail é obrigatório." });
    const profile = getPublicUserProfile(email);
    if (!profile) return res.status(404).json({ error: "Perfil não encontrado." });
    res.json({ success: true, profile });
  } catch (error) {
    console.error("Erro ao obter perfil público:", error);
    res.status(500).json({ error: "Erro interno ao obter perfil público." });
  }
});

// Perfil oficial do criador vinculado a um canal
app.get("/api/canais/:canalId/perfil-oficial", (req, res) => {
  try {
    const canalId = decodeURIComponent(req.params.canalId || "");
    const obra = localDb.getObras().find((o) => o.id === canalId && o.tipo === "canal");
    if (!obra) return res.status(404).json({ error: "Canal não encontrado." });

    const creatorEmail = findOfficialCreatorEmailForChannel(canalId, obra.officialCreatorEmail);
    if (!creatorEmail) {
      return res.json({ success: true, profile: null });
    }

    const profile = getPublicUserProfile(creatorEmail);
    res.json({ success: true, profile });
  } catch (error) {
    console.error("Erro ao obter perfil oficial do canal:", error);
    res.status(500).json({ error: "Erro interno ao obter perfil oficial do canal." });
  }
});

// Atualizar perfil do usuário (Avatar, Descricao & Senha)
app.post("/api/usuario/update", async (req, res) => {
  try {
    const { email, avatar, descricao, password, socialLinks } = req.body;
    if (!email) {
      return res.status(400).json({ error: "E-mail é obrigatório para identificação." });
    }

    const existingUser = await localDb.findUsuarioByEmail(email);
    if (!existingUser) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const updates: Partial<UserAccount> = {};
    if (avatar !== undefined) updates.avatar = avatar;
    if (descricao !== undefined) updates.descricao = descricao;
    if (password) updates.password = password;

    if (socialLinks !== undefined) {
      const gamification = localDb.getGamificationProfile(email);
      migrateProfile(gamification);
      const canEditSocialLinks =
        isVerifiedCreatorLoadout(gamification.loadout) ||
        hasReward(gamification, VERIFIED_PROFILE_BADGE_ID);
      if (canEditSocialLinks) {
        updates.socialLinks = {
          ...sanitizeSocialLinks(existingUser.socialLinks),
          ...sanitizeSocialLinks(socialLinks),
        };
      }
    }

    const user = await localDb.updateUsuario(email, updates);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json({
      success: true,
      user: serializeUserState(user),
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ error: "Erro interno ao atualizar perfil." });
  }
});

// Registrar doação e conceder tag de Doador VIP
app.post("/api/usuario/donate", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "E-mail é obrigatório." });
    }

    const user = await localDb.updateUsuario(email, { isDonor: true });
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // Criar uma notificação no sistema informando a doação de sucesso
    localDb.addNotificacao({
      titulo: "🎖️ Doação Confirmada!",
      mensagem: `Olá ${user.username}, agradecemos imensamente o seu apoio financeiro! Você acaba de receber a Tag Exclusiva de Apoiador/Doador do Cine React! Seu nome agora brilha no chat.`
    });

    res.json({
      success: true,
      user: serializeUserState(user, { isDonor: true }),
    });
  } catch (error) {
    console.error("Erro ao processar doação:", error);
    res.status(500).json({ error: "Erro interno ao processar doação." });
  }
});

// Lista todos os usuários cadastrados (apenas para exibição no painel admin)
app.get("/api/usuarios", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const list = localDb.getUsuarios().map(sanitizeUsuario);
    res.json(list);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({ error: "Erro ao listar usuários." });
  }
});

// Toggle VIP (Apoiador) de usuário — apenas admin
app.post("/api/usuarios/:email/vip", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const targetEmail = decodeURIComponent(req.params.email);
    const { isDonor } = req.body;

    const updated = await localDb.updateUsuario(targetEmail, { isDonor: !!isDonor });
    if (!updated) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json({ success: true, user: sanitizeUsuario(updated) });
  } catch (error: any) {
    console.error("Erro ao atualizar VIP:", error);
    res.status(500).json({ error: "Erro ao atualizar status VIP." });
  }
});

// Toggle admin de usuário — apenas super admin
app.post("/api/usuarios/:email/admin", async (req, res) => {
  try {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    if (adminEmail.toLowerCase() !== "mateusvini.t10@gmail.com") {
      return res.status(403).json({ error: "Apenas o super administrador pode alterar privilégios de admin." });
    }

    const targetEmail = decodeURIComponent(req.params.email);
    const { isAdmin } = req.body;
    const updated = await localDb.updateUsuario(targetEmail, { isAdmin: !!isAdmin });
    if (!updated) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json({ success: true, user: sanitizeUsuario(updated) });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao atualizar privilégios de admin." });
  }
});

// Notificações administrativas (solicitações de criadores, etc.)
app.get("/api/admin/notificacoes", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const tipo = req.query.tipo as string;
    let list = localDb.getAllNotificacoes();
    if (tipo === "solicitacoes") {
      list = list.filter(n => n.titulo.toLowerCase().includes("solicitação"));
    }
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar notificações administrativas." });
  }
});

app.delete("/api/notificacoes/:id", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const deleted = localDb.deleteNotificacao(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Notificação não encontrada." });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao remover notificação." });
  }
});

// Descoberta inteligente de obras com Gemini + reacts do YouTube
app.post("/api/admin/discover", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { query } = req.body;
    if (!query?.trim()) {
      return res.status(400).json({ error: "Informe o nome da obra para descobrir." });
    }

    const normalizedQuery = query.trim();
    const existing = localDb.getObras().find(o =>
      o.id === normalizedQuery.toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
      o.titulo.toLowerCase() === normalizedQuery.toLowerCase()
    );

    if (existing) {
      const reactsAdded = await discoverReactsFromYouTube(existing.titulo, existing.id);
      return res.json({
        success: true,
        mode: "existing",
        obra: existing,
        reactsAdded,
        message: reactsAdded > 0
          ? `Obra já existia. ${reactsAdded} react(s) adicionado(s) do YouTube.`
          : "Obra já cadastrada no catálogo.",
      });
    }

    let obra;
    let mode = "fallback";

    if (ai) {
      try {
        obra = await discoverObraWithGemini(normalizedQuery);
        mode = "gemini";
      } catch (geminiErr) {
        console.error("[Discover] Erro no Gemini:", geminiErr);
      }
    }

    if (!obra) {
      const slug = normalizedQuery.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      obra = localDb.saveObra({
        id: slug,
        titulo: normalizedQuery,
        tipo: "filme",
        sinopse: `${normalizedQuery} catalogado no CineReact.`,
        ano: new Date().getFullYear(),
        generos: ["Entretenimento"],
        banner: "https://images.unsplash.com/photo-1618944913480-b67ee16d7b77?q=80&w=1600",
        poster: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=600",
        trailerUrl: "https://www.youtube.com/watch?v=VyHV0BRZKoI",
        destacado: false,
      });
      mode = "manual";
    }

    const reactsAdded = await discoverReactsFromYouTube(obra.titulo, obra.id);

    res.json({
      success: true,
      mode,
      obra,
      reactsAdded,
      message: `Obra "${obra.titulo}" cadastrada com sucesso${reactsAdded > 0 ? ` e ${reactsAdded} react(s) encontrado(s) no YouTube` : ""}.`,
    });
  } catch (error: any) {
    console.error("Erro na descoberta inteligente:", error);
    res.status(500).json({ error: error.message || "Erro ao descobrir conteúdo." });
  }
});

// ==========================================
// INTELICENT SEARCH — busca local no catálogo
app.get("/api/search", (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: "Consulta de pesquisa vazia." });
  }
  try {
    const fallbackResults = localDb.getObras().filter(o => 
      o.titulo.toLowerCase().includes(query.toLowerCase()) ||
      o.tipo.toLowerCase().includes(query.toLowerCase()) ||
      o.generos.some(g => g.toLowerCase().includes(query.toLowerCase()))
    );

    res.json({
      type: "local",
      obras: fallbackResults
    });
  } catch (error: any) {
    res.status(500).json({ error: "Erro interno no servidor ao realizar a pesquisa." });
  }
});

// ==========================================
// GAMIFICATION
// ==========================================
registerGamificationRoutes(app);
registerAdminPanelRoutes(app, requireAdmin);

// ==========================================
// VITE MIDDLEWARE & STATIC ASSET SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders(res, filePath) {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cine React executando em http://0.0.0.0:${PORT}`);

    ensureDemoCreatorProfile();
    
    // Inicialização da sincronização com Supabase se ativo
    if (localDb.isSupabaseActive()) {
      console.log("[Supabase] Detectado e ativo! Sincronizando dados...");
      localDb.syncFromSupabase()
        .then(success => {
          ensureDemoCreatorProfile();
          if (success) {
            console.log("[Supabase] Sincronização inicial na inicialização concluída!");
          } else {
            console.warn("[Supabase] Falha ao sincronizar dados iniciais do Supabase ou tabelas não criadas ainda.");
          }
        })
        .catch(err => {
          console.warn("[Supabase] Erro ou timeout ao sincronizar dados na inicialização:", err?.message || err);
        });
    }

    // Sincroniza fotos de perfil reais dos canais
    syncChannelAvatars().catch(err => {
      console.warn("Aviso ao sincronizar avatares dos canais:", err?.message || err);
    });
    // Pré-carrega reacts do YouTube se necessário
    prefillDefaultReacts().catch(err => {
      console.warn("Aviso ao executar pré-carregamento inicial:", err?.message || err);
    });
  });
}

startServer();
