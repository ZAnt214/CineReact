import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Obra, ReactVideo, Comentario, ListaPersonalizada, Notificacao, UserAccount } from '../types.ts';
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
import { GamificationProfile } from '../types/gamification.ts';
import { AdminConfig, createDefaultAdminConfig, AdminAuditLog } from '../types/admin.ts';
import { createDefaultProfile } from '../gamification/engine.ts';
import { migrateProfile } from '../gamification/rewardsEngine.ts';
import { hasSocialLinks } from '../utils/socialLinks.ts';
import { OBRAS_INICIAIS, VIDEOS_INICIAIS } from '../data.ts';
import { getDataDir, migrateLegacyFile } from './dataPaths.ts';

function mergeUsuarioFromRemote(local: UserAccount | undefined, remote: UserAccount): UserAccount {
  const merged: UserAccount = { ...remote };

  if (!local) return merged;

  if (hasSocialLinks(local.socialLinks) && !hasSocialLinks(merged.socialLinks)) {
    merged.socialLinks = local.socialLinks;
  }

  if (local.descricao?.trim() && !merged.descricao?.trim()) {
    merged.descricao = local.descricao;
  }

  if (local.role) merged.role = local.role;
  if (local.isBanned) merged.isBanned = true;
  if (local.isSuspended) merged.isSuspended = true;
  if (local.suspendedUntil) merged.suspendedUntil = local.suspendedUntil;
  if (local.bannedAt) merged.bannedAt = local.bannedAt;
  if (local.lastActiveAt) merged.lastActiveAt = local.lastActiveAt;

  return merged;
}

const DB_PATH = path.join(getDataDir(), 'db_cine_react.json');

migrateLegacyFile(DB_PATH, [
  path.join('/tmp', 'db_cine_react.json'),
  path.join(process.cwd(), 'db_cine_react.json'),
]);

interface DbSchema {
  obras: Obra[];
  reacts: ReactVideo[];
  comentarios: Comentario[];
  favoritos: { usuarioEmail: string; obraId: string }[];
  canaisSeguidos: { usuarioEmail: string; canalNome: string }[];
  listas: ListaPersonalizada[];
  notificacoes: Notificacao[];
  usuarios: UserAccount[];
  gamificationProfiles: Record<string, GamificationProfile>;
  adminConfig: AdminConfig;
  cineClips: CineClip[];
  cineClipComments: CineClipComment[];
  cineClipLikes: CineClipLike[];
  cineClipFavorites: CineClipFavorite[];
  cineClipShares: CineClipShare[];
  cineClipReports: CineClipReport[];
  cineClipImportJobs: CineClipImportJob[];
  cineClipWatchHistory: CineClipWatchEvent[];
}

function initDb(): DbSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Auto-migrate to include usuarios if not exists
      if (!parsed.usuarios) {
        parsed.usuarios = [
          {
            id: 'admin',
            username: 'Mateus Vinícius',
            email: 'mateusvini.t10@gmail.com',
            password: 'Zantnoar12',
            createdAt: new Date().toISOString(),
            isAdmin: true
          }
        ];
        saveDb(parsed);
      }

      // Auto-migrate to recommend first 3 videos if none recommended
      if (parsed.reacts && parsed.reacts.length > 0) {
        const hasRecomendados = parsed.reacts.some((r: any) => r.isRecomendado);
        if (!hasRecomendados) {
          parsed.reacts.slice(0, 3).forEach((r: any) => {
            r.isRecomendado = true;
          });
          saveDb(parsed);
        }
      }

      // Auto-migrate gamification profiles
      if (!parsed.gamificationProfiles) {
        parsed.gamificationProfiles = {};
        saveDb(parsed);
      }

      if (!parsed.adminConfig) {
        parsed.adminConfig = createDefaultAdminConfig();
        saveDb(parsed);
      }

      if (!parsed.cineClips) {
        parsed.cineClips = [];
        parsed.cineClipComments = [];
        parsed.cineClipLikes = [];
        parsed.cineClipFavorites = [];
        parsed.cineClipShares = [];
        parsed.cineClipReports = [];
        parsed.cineClipImportJobs = [];
        parsed.cineClipWatchHistory = [];
        saveDb(parsed);
      }

      return parsed;
    }
  } catch (error) {
    console.error('Erro ao ler banco de dados local, reiniciando:', error);
  }

  const initialDb: DbSchema = {
    obras: [...OBRAS_INICIAIS],
    reacts: [...VIDEOS_INICIAIS],
    comentarios: [
      {
        id: '1',
        obraId: 'harry-potter',
        usuarioNome: 'Mateus Vinicius',
        usuarioEmail: 'mateusvini.t10@gmail.com',
        texto: 'Casimiro assistindo Harry Potter é simplesmente épico! Dei muita risada.',
        likes: 18,
        criadoEm: new Date().toISOString()
      },
      {
        id: '2',
        obraId: 'the-last-of-us',
        usuarioNome: 'Ana Souza',
        usuarioEmail: 'ana@gmail.com',
        texto: 'A gameplay do Alanzoka é maravilhosa, mas o react do Luan é insano demais!',
        likes: 12,
        criadoEm: new Date().toISOString()
      }
    ],
    favoritos: [],
    canaisSeguidos: [],
    listas: [],
    notificacoes: [],
    gamificationProfiles: {},
    adminConfig: createDefaultAdminConfig(),
    usuarios: [
      {
        id: 'admin',
        username: 'Mateus Vinícius',
        email: 'mateusvini.t10@gmail.com',
        password: 'Zantnoar12',
        createdAt: new Date().toISOString(),
        isAdmin: true
      }
    ],
    cineClips: [],
    cineClipComments: [],
    cineClipLikes: [],
    cineClipFavorites: [],
    cineClipShares: [],
    cineClipReports: [],
    cineClipImportJobs: [],
    cineClipWatchHistory: [],
  };

  saveDb(initialDb);
  return initialDb;
}

let dbCache: DbSchema = {
  obras: [],
  reacts: [],
  comentarios: [],
  favoritos: [],
  canaisSeguidos: [],
  listas: [],
  notificacoes: [],
  gamificationProfiles: {},
  adminConfig: createDefaultAdminConfig(),
  usuarios: [],
  cineClips: [],
  cineClipComments: [],
  cineClipLikes: [],
  cineClipFavorites: [],
  cineClipShares: [],
  cineClipReports: [],
  cineClipImportJobs: [],
  cineClipWatchHistory: [],
};

let saveDbTimer: NodeJS.Timeout | null = null;
let pendingSave = false;
let isWriting = false;

function saveDb(data?: DbSchema, immediate = false) {
  if (data) {
    dbCache = data;
  }
  pendingSave = true;

  if (immediate) {
    if (saveDbTimer) {
      clearTimeout(saveDbTimer);
      saveDbTimer = null;
    }
    doSaveAsync();
    return;
  }

  if (saveDbTimer) return;

  saveDbTimer = setTimeout(() => {
    saveDbTimer = null;
    doSaveAsync();
  }, 300);
}

async function doSaveAsync() {
  if (!pendingSave || isWriting) return;
  isWriting = true;
  pendingSave = false;

  try {
    const tempPath = `${DB_PATH}.tmp`;
    const jsonStr = JSON.stringify(dbCache, null, 2);
    await fs.promises.writeFile(tempPath, jsonStr, 'utf-8');
    await fs.promises.rename(tempPath, DB_PATH);
  } catch (error) {
    console.error('Erro ao salvar banco de dados local:', error);
  } finally {
    isWriting = false;
    if (pendingSave) {
      doSaveAsync();
    }
  }
}

dbCache = initDb();

// Supabase Client lazy setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
let supabaseClient: any = null;

const supabaseFetchWithTimeout = async (input: any, init?: any) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn("[Supabase] Requisição em background cancelada por timeout (4s). Mantendo operação local.");
    } else {
      console.warn("[Supabase] Operação em background off-line. Mantendo operação local.");
    }
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "" && supabaseAnonKey !== "") {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        fetch: supabaseFetchWithTimeout
      }
    });
    console.log("[Supabase] Cliente inicializado com sucesso.");
  } catch (err) {
    console.error("[Supabase] Erro ao inicializar cliente:", err);
  }
}

export const localDb = {
  // Supabase Connection Check
  isSupabaseActive: () => {
    return !!supabaseClient;
  },

  getSupabaseClient: () => {
    return supabaseClient;
  },

  // Pull data from Supabase and refresh the memory cache
  syncFromSupabase: async () => {
    if (!supabaseClient) return false;
    try {
      console.log("[Supabase] Sincronizando dados do Supabase...");
      
      const { data: obras, error: errObras } = await supabaseClient.from('obras').select('*');
      const { data: reacts, error: errReacts } = await supabaseClient.from('reacts').select('*');
      const { data: comentarios, error: errComentarios } = await supabaseClient.from('comentarios').select('*');
      const { data: favoritos, error: errFavoritos } = await supabaseClient.from('favoritos').select('*');
      const { data: canaisSeguidos, error: errCanaisSeguidos } = await supabaseClient.from('canais_seguidos').select('*');
      const { data: listas, error: errListas } = await supabaseClient.from('listas').select('*');
      const { data: notificacoes, error: errNotificacoes } = await supabaseClient.from('notificacoes').select('*');
      const { data: usuarios, error: errUsuarios } = await supabaseClient.from('usuarios').select('*');

      if (errObras || errReacts || errComentarios || errUsuarios) {
        console.error("[Supabase] Erro ao buscar dados do Supabase. Verifique se as tabelas existem.", {
          errObras, errReacts, errComentarios, errUsuarios
        });
        return false;
      }

      // If remote Supabase is completely empty, upload local data automatically!
      if (obras.length === 0 && reacts.length === 0) {
        console.log("[Supabase] Banco de dados Supabase vazio. Enviando dados locais...");
        await localDb.uploadLocalDataToSupabase();
        return true;
      }

      // Otherwise, Supabase is the single source of truth - override local memory cache!
      dbCache.obras = obras || [];
      dbCache.reacts = (reacts || []).map((r: any) => ({
        ...r,
        thumbnailUrl: r.thumbnailUrl || r.thumbnail
      }));
      dbCache.comentarios = comentarios || [];
      dbCache.favoritos = favoritos || [];
      dbCache.canaisSeguidos = canaisSeguidos || [];
      dbCache.listas = (listas || []).map((l: any) => ({
        ...l,
        obraIds: l.obraIds || []
      }));
      dbCache.notificacoes = notificacoes || [];
      const previousUsuarios = dbCache.usuarios || [];
      const previousByEmail = new Map(
        previousUsuarios.map((u) => [u.email.toLowerCase(), u])
      );
      dbCache.usuarios = (usuarios || []).map((remote: UserAccount) => {
        const local = previousByEmail.get(remote.email.toLowerCase());
        return mergeUsuarioFromRemote(local, remote);
      });
      saveDb(dbCache);

      console.log("[Supabase] Sincronização de volta para o cache concluída com sucesso!");
      return true;
    } catch (error) {
      console.error("[Supabase] Falha ao sincronizar dados:", error);
      return false;
    }
  },

  // Export local JSON cache up to Supabase manually
  uploadLocalDataToSupabase: async () => {
    if (!supabaseClient) return false;
    try {
      console.log("[Supabase] Enviando dados do cache local para o Supabase...");

      // 1. Obras
      if (dbCache.obras.length > 0) {
        const { error } = await supabaseClient.from('obras').upsert(
          dbCache.obras.map(o => ({
            id: o.id,
            titulo: o.titulo,
            sinopse: o.sinopse,
            synopsis: o.synopsis || '',
            poster: o.poster,
            banner: o.banner,
            ano: o.ano,
            generos: o.generos || [],
            tipo: o.tipo,
            channelId: o.channelId,
            trailerUrl: o.trailerUrl,
            destacado: !!o.destacado
          }))
        );
        if (error) console.error("[Supabase Upload] Erro nas obras:", error);
      }

      // 2. Reacts
      if (dbCache.reacts.length > 0) {
        const { error } = await supabaseClient.from('reacts').upsert(
          dbCache.reacts.map(r => ({
            id: r.id,
            obraId: r.obraId,
            titulo: r.titulo,
            videoUrl: 'https://www.youtube.com/watch?v=' + r.id,
            thumbnailUrl: r.thumbnailUrl || '',
            duracao: r.duracao,
            canalNome: r.canalNome,
            visualizacoes: r.visualizacoes || 0,
            isRecomendado: !!r.isRecomendado
          }))
        );
        if (error) console.error("[Supabase Upload] Erro nos reacts:", error);
      }

      // 3. Comentarios
      if (dbCache.comentarios.length > 0) {
        const { error } = await supabaseClient.from('comentarios').upsert(
          dbCache.comentarios.map(c => ({
            id: c.id,
            obraId: c.obraId,
            usuarioNome: c.usuarioNome,
            usuarioEmail: c.usuarioEmail,
            texto: c.texto,
            nota: c.nota,
            criadoEm: c.criadoEm
          }))
        );
        if (error) console.error("[Supabase Upload] Erro nos comentarios:", error);
      }

      // 4. Favoritos
      if (dbCache.favoritos.length > 0) {
        await supabaseClient.from('favoritos').delete().neq('id', 0);
        const { error } = await supabaseClient.from('favoritos').insert(
          dbCache.favoritos.map(f => ({
            usuarioEmail: f.usuarioEmail,
            obraId: f.obraId
          }))
        );
        if (error) console.error("[Supabase Upload] Erro nos favoritos:", error);
      }

      // 5. Canais Seguidos
      if (dbCache.canaisSeguidos.length > 0) {
        await supabaseClient.from('canais_seguidos').delete().neq('id', 0);
        const { error } = await supabaseClient.from('canais_seguidos').insert(
          dbCache.canaisSeguidos.map(c => ({
            usuarioEmail: c.usuarioEmail,
            canalNome: c.canalNome
          }))
        );
        if (error) console.error("[Supabase Upload] Erro nos canais seguidos:", error);
      }

      // 6. Listas
      if (dbCache.listas.length > 0) {
        const { error } = await supabaseClient.from('listas').upsert(
          dbCache.listas.map(l => ({
            id: l.id,
            nome: l.nome,
            descricao: l.descricao,
            usuarioEmail: l.usuarioEmail,
            obraIds: l.obraIds || []
          }))
        );
        if (error) console.error("[Supabase Upload] Erro nas listas:", error);
      }

      // 7. Notificações
      if (dbCache.notificacoes.length > 0) {
        const { error } = await supabaseClient.from('notificacoes').upsert(
          dbCache.notificacoes.map(n => ({
            id: n.id,
            titulo: n.titulo,
            mensagem: n.mensagem,
            lida: !!n.lida,
            criadoEm: n.criadoEm,
            canalNome: n.canalNome,
            usuarioEmail: n.usuarioEmail
          }))
        );
        if (error) console.error("[Supabase Upload] Erro nas notificacoes:", error);
      }

      // 8. Usuários
      if (dbCache.usuarios.length > 0) {
        const { error } = await supabaseClient.from('usuarios').upsert(
          dbCache.usuarios.map(u => ({
            email: u.email,
            id: u.id,
            username: u.username,
            password: u.password,
            createdAt: u.createdAt,
            avatar: u.avatar,
            isAdmin: !!u.isAdmin,
            isDonor: !!u.isDonor,
            continueWatching: u.continueWatching || [],
            descricao: u.descricao || '',
            socialLinks: u.socialLinks || {},
          }))
        );
        if (error) console.error("[Supabase Upload] Erro nos usuarios:", error);
      }

      console.log("[Supabase] Upload de dados manuais com sucesso!");
      return true;
    } catch (error) {
      console.error("[Supabase] Erro ao enviar dados:", error);
      return false;
    }
  },

  getObras: () => {
    return dbCache.obras;
  },
  
  saveObra: (obra: Obra) => {
    const idx = dbCache.obras.findIndex(o => o.id === obra.id);
    if (idx >= 0) {
      dbCache.obras[idx] = obra;
    } else {
      dbCache.obras.push(obra);
    }
    saveDb(dbCache);

    // Propagate to Supabase background
    if (supabaseClient) {
      supabaseClient.from('obras').upsert({
        id: obra.id,
        titulo: obra.titulo,
        sinopse: obra.sinopse,
        synopsis: obra.synopsis || '',
        poster: obra.poster,
        banner: obra.banner,
        ano: obra.ano,
        generos: obra.generos || [],
        tipo: obra.tipo,
        channelId: obra.channelId,
        trailerUrl: obra.trailerUrl,
        destacado: !!obra.destacado
      }).then(({ error }: any) => {
        if (error) console.warn("[Supabase Async] Aviso ao salvar obra:", error);
      }).catch((err: any) => {
        console.warn("[Supabase Async Network Error] Erro ao salvar obra:", err?.message || err);
      });
    }

    return obra;
  },

  deleteObra: (id: string) => {
    dbCache.obras = dbCache.obras.filter(o => o.id !== id);
    dbCache.reacts = dbCache.reacts.filter(r => r.obraId !== id);
    dbCache.comentarios = dbCache.comentarios.filter(c => c.obraId !== id);
    saveDb(dbCache);

    if (supabaseClient) {
      supabaseClient.from('obras').delete().eq('id', id).then(({ error }: any) => {
        if (error) console.warn("[Supabase Async] Aviso ao deletar obra:", error);
      }).catch((err: any) => {
        console.warn("[Supabase Async Network Error] Erro ao deletar obra:", err?.message || err);
      });
    }
  },

  getReacts: () => {
    return dbCache.reacts;
  },

  likeReact: (id: string, action: 'like' | 'unlike') => {
    const idx = dbCache.reacts.findIndex(r => r.id === id);
    if (idx >= 0) {
      const baseLikes = dbCache.reacts[idx].likes ?? 0;
      const newLikes = action === 'like' ? baseLikes + 1 : Math.max(0, baseLikes - 1);
      dbCache.reacts[idx].likes = newLikes;
      saveDb(dbCache);
      return newLikes;
    }
    return 0;
  },

  saveReact: (react: ReactVideo) => {
    const idx = dbCache.reacts.findIndex(r => r.id === react.id);
    if (idx >= 0) {
      dbCache.reacts[idx] = react;
    } else {
      dbCache.reacts.push(react);
    }
    saveDb(dbCache);

    if (supabaseClient) {
      supabaseClient.from('reacts').upsert({
        id: react.id,
        obraId: react.obraId,
        titulo: react.titulo,
        videoUrl: 'https://www.youtube.com/watch?v=' + react.id,
        thumbnailUrl: react.thumbnailUrl || '',
        duracao: react.duracao,
        canalNome: react.canalNome,
        visualizacoes: react.visualizacoes || 0,
        isRecomendado: !!react.isRecomendado
      }).then(({ error }: any) => {
        if (error) console.warn("[Supabase Async] Aviso ao salvar react:", error);
      }).catch((err: any) => {
        console.warn("[Supabase Async Network Error] Erro ao salvar react:", err?.message || err);
      });
    }

    return react;
  },

  deleteReact: (id: string) => {
    dbCache.reacts = dbCache.reacts.filter(r => r.id !== id);
    saveDb(dbCache);

    if (supabaseClient) {
      supabaseClient.from('reacts').delete().eq('id', id).then(({ error }: any) => {
        if (error) console.warn("[Supabase Async] Aviso ao deletar react:", error);
      }).catch((err: any) => {
        console.warn("[Supabase Async Network Error] Erro ao deletar react:", err?.message || err);
      });
    }
  },

  getComentarios: (obraId?: string) => {
    if (obraId) {
      return dbCache.comentarios.filter(c => c.obraId === obraId);
    }
    return dbCache.comentarios;
  },

  addComentario: (comentario: Comentario) => {
    dbCache.comentarios.push(comentario);
    saveDb(dbCache);

    if (supabaseClient) {
      supabaseClient.from('comentarios').insert({
        id: comentario.id,
        obraId: comentario.obraId,
        usuarioNome: comentario.usuarioNome,
        usuarioEmail: comentario.usuarioEmail,
        texto: comentario.texto,
        nota: comentario.nota,
        criadoEm: comentario.criadoEm
      }).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao salvar comentario:", error);
      }).catch((err: any) => {
        console.warn("[Supabase Async Network Error] Erro ao salvar comentario:", err?.message || err);
      });
    }

    return comentario;
  },

  deleteComentario: (id: string) => {
    dbCache.comentarios = dbCache.comentarios.filter(c => c.id !== id);
    saveDb(dbCache);

    if (supabaseClient) {
      supabaseClient.from('comentarios').delete().eq('id', id).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao deletar comentario:", error);
      }).catch((err: any) => {
        console.warn("[Supabase Async Network Error] Erro ao deletar comentario:", err?.message || err);
      });
    }
  },

  updateComentario: (id: string, updates: Partial<Comentario>) => {
    const idx = dbCache.comentarios.findIndex(c => c.id === id);
    if (idx < 0) return null;
    dbCache.comentarios[idx] = { ...dbCache.comentarios[idx], ...updates };
    saveDb(dbCache);
    return dbCache.comentarios[idx];
  },

  likeComentario: (id: string, action: 'like' | 'unlike') => {
    const idx = dbCache.comentarios.findIndex(c => c.id === id);
    if (idx !== -1) {
      const currentLikes = dbCache.comentarios[idx].likes || 0;
      const newLikes = action === 'like' ? currentLikes + 1 : Math.max(0, currentLikes - 1);
      dbCache.comentarios[idx].likes = newLikes;
      saveDb(dbCache);
      return newLikes;
    }
    return 0;
  },

  getFavoritos: (email: string) => {
    return dbCache.favoritos.filter(f => f.usuarioEmail === email).map(f => f.obraId);
  },

  toggleFavorito: (email: string, obraId: string) => {
    const idx = dbCache.favoritos.findIndex(f => f.usuarioEmail === email && f.obraId === obraId);
    let favoritado = false;
    if (idx >= 0) {
      dbCache.favoritos.splice(idx, 1);
    } else {
      dbCache.favoritos.push({ usuarioEmail: email, obraId });
      favoritado = true;
    }
    saveDb(dbCache);

    if (supabaseClient) {
      if (favoritado) {
        supabaseClient.from('favoritos').insert({
          usuarioEmail: email,
          obraId: obraId
        }).then(({ error }: any) => {
          if (error) console.error("[Supabase Async] Erro ao salvar favorito:", error);
        }).catch((err: any) => {
          console.warn("[Supabase Async Network Error] Erro ao salvar favorito:", err?.message || err);
        });
      } else {
        supabaseClient.from('favoritos').delete()
          .eq('usuarioEmail', email)
          .eq('obraId', obraId)
          .then(({ error }: any) => {
            if (error) console.error("[Supabase Async] Erro ao deletar favorito:", error);
          }).catch((err: any) => {
            console.warn("[Supabase Async Network Error] Erro ao deletar favorito:", err?.message || err);
          });
      }
    }

    return favoritado;
  },

  getCanaisSeguidos: (email: string) => {
    return dbCache.canaisSeguidos.filter(c => c.usuarioEmail === email).map(c => c.canalNome);
  },

  toggleSeguirCanal: (email: string, canalNome: string) => {
    const idx = dbCache.canaisSeguidos.findIndex(c => c.usuarioEmail === email && c.canalNome === canalNome);
    let seguindo = false;
    if (idx >= 0) {
      dbCache.canaisSeguidos.splice(idx, 1);
    } else {
      dbCache.canaisSeguidos.push({ usuarioEmail: email, canalNome });
      seguindo = true;
      
      dbCache.notificacoes.push({
        id: Math.random().toString(36).substring(2),
        titulo: `Canal Seguido: ${canalNome}`,
        mensagem: `Você começou a seguir os reacts do canal ${canalNome}. Você será notificado sobre novos vídeos!`,
        lida: false,
        criadoEm: new Date().toISOString(),
        canalNome,
        usuarioEmail: email
      });
    }
    saveDb(dbCache);

    if (supabaseClient) {
      if (seguindo) {
        supabaseClient.from('canais_seguidos').insert({
          usuarioEmail: email,
          canalNome: canalNome
        }).then(({ error }: any) => {
          if (error) console.error("[Supabase Async] Erro ao seguir canal:", error);
        }).catch((err: any) => {
          console.warn("[Supabase Async Network Error] Erro ao seguir canal:", err?.message || err);
        });
        
        // Also sync notification
        const lastNotif = dbCache.notificacoes[dbCache.notificacoes.length - 1];
        supabaseClient.from('notificacoes').insert({
          id: lastNotif.id,
          titulo: lastNotif.titulo,
          mensagem: lastNotif.mensagem,
          lida: false,
          criadoEm: lastNotif.criadoEm,
          canalNome: lastNotif.canalNome,
          usuarioEmail: lastNotif.usuarioEmail
        }).then(({ error }: any) => {
          if (error) console.error("[Supabase Async] Erro ao postar notificacao de canal seguido:", error);
        }).catch((err: any) => {
          console.warn("[Supabase Async Network Error] Erro ao postar notificacao:", err?.message || err);
        });
      } else {
        supabaseClient.from('canais_seguidos').delete()
          .eq('usuarioEmail', email)
          .eq('canalNome', canalNome)
          .then(({ error }: any) => {
            if (error) console.error("[Supabase Async] Erro ao deixar de seguir canal:", error);
          }).catch((err: any) => {
            console.warn("[Supabase Async Network Error] Erro ao deixar de seguir canal:", err?.message || err);
          });
      }
    }

    return seguindo;
  },

  getSeguidoresDoCanal: (canalNome: string) => {
    const emails = dbCache.canaisSeguidos
      .filter(c => c.canalNome.toLowerCase() === canalNome.toLowerCase())
      .map(c => c.usuarioEmail);
    
    return emails.map(email => {
      const u = (dbCache.usuarios || []).find(user => user.email.toLowerCase() === email.toLowerCase());
      return {
        username: u ? u.username : email.split('@')[0],
        email: email,
        avatar: u ? u.avatar : undefined,
        isDonor: u ? u.isDonor : false
      };
    });
  },

  getListas: (email: string) => {
    return dbCache.listas.filter(l => l.usuarioEmail === email);
  },

  createLista: (lista: Omit<ListaPersonalizada, 'id'>) => {
    const novaLista: ListaPersonalizada = {
      ...lista,
      id: Math.random().toString(36).substring(2)
    };
    dbCache.listas.push(novaLista);
    saveDb(dbCache);

    if (supabaseClient) {
      supabaseClient.from('listas').insert({
        id: novaLista.id,
        nome: novaLista.nome,
        descricao: novaLista.descricao,
        usuarioEmail: novaLista.usuarioEmail,
        obraIds: novaLista.obraIds || []
      }).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao salvar lista:", error);
      }).catch((err: any) => {
        console.warn("[Supabase Async Network Error] Erro ao salvar lista:", err?.message || err);
      });
    }

    return novaLista;
  },

  updateLista: (lista: ListaPersonalizada) => {
    const idx = dbCache.listas.findIndex(l => l.id === lista.id);
    if (idx >= 0) {
      dbCache.listas[idx] = lista;
      saveDb(dbCache);
    }

    if (supabaseClient) {
      supabaseClient.from('listas').upsert({
        id: lista.id,
        nome: lista.nome,
        descricao: lista.descricao,
        usuarioEmail: lista.usuarioEmail,
        obraIds: lista.obraIds || []
      }).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao atualizar lista:", error);
      }).catch((err: any) => {
        console.warn("[Supabase Async Network Error] Erro ao atualizar lista:", err?.message || err);
      });
    }

    return lista;
  },

  deleteLista: (id: string) => {
    dbCache.listas = dbCache.listas.filter(l => l.id !== id);
    saveDb(dbCache);

    if (supabaseClient) {
      supabaseClient.from('listas').delete().eq('id', id).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao deletar lista:", error);
      }).catch((err: any) => {
        console.warn("[Supabase Async Network Error] Erro ao deletar lista:", err?.message || err);
      });
    }
  },

  getNotificacoes: (email?: string) => {
    if (!email) return [];
    const followedChannels = dbCache.canaisSeguidos
      .filter(c => c.usuarioEmail.toLowerCase() === email.toLowerCase())
      .map(c => c.canalNome);

    return dbCache.notificacoes.filter(n => {
      if (n.usuarioEmail && n.usuarioEmail.toLowerCase() === email.toLowerCase()) {
        return true;
      }
      if (!n.usuarioEmail && n.canalNome && followedChannels.includes(n.canalNome)) {
        return true;
      }
      return false;
    });
  },

  marcarNotificacaoComoLida: (id: string) => {
    const idx = dbCache.notificacoes.findIndex(n => n.id === id);
    if (idx >= 0) {
      dbCache.notificacoes[idx].lida = true;
      saveDb(dbCache);
    }

    if (supabaseClient) {
      supabaseClient.from('notificacoes').update({ lida: true }).eq('id', id).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao marcar notificacao como lida:", error);
      }).catch((err: any) => {
        console.warn("[Supabase Async Network Error] Erro ao marcar notificacao:", err?.message || err);
      });
    }
  },

  limparNotificacoes: (email?: string) => {
    if (email) {
      dbCache.notificacoes = dbCache.notificacoes.filter(n => {
        if (n.usuarioEmail && n.usuarioEmail.toLowerCase() === email.toLowerCase()) {
          return false;
        }
        return true;
      });
    } else {
      dbCache.notificacoes = [];
    }
    saveDb(dbCache);

    if (supabaseClient) {
      if (email) {
        supabaseClient.from('notificacoes').delete().eq('usuarioEmail', email).then(({ error }: any) => {
          if (error) console.error("[Supabase Async] Erro ao limpar notificacoes do usuario:", error);
        }).catch((err: any) => {
          console.warn("[Supabase Async Network Error] Erro ao limpar notificacoes:", err?.message || err);
        });
      } else {
        supabaseClient.from('notificacoes').delete().neq('id', 'dummy').then(({ error }: any) => {
          if (error) console.error("[Supabase Async] Erro ao limpar notificacoes:", error);
        }).catch((err: any) => {
          console.warn("[Supabase Async Network Error] Erro ao limpar notificacoes:", err?.message || err);
        });
      }
    }
  },
  
  addNotificacao: (notificacao: Omit<Notificacao, 'id' | 'lida' | 'criadoEm'>) => {
    const nova: Notificacao = {
      ...notificacao,
      id: Math.random().toString(36).substring(2),
      lida: false,
      criadoEm: new Date().toISOString()
    };
    dbCache.notificacoes.unshift(nova);
    saveDb(dbCache);

    if (supabaseClient) {
      supabaseClient.from('notificacoes').insert({
        id: nova.id,
        titulo: nova.titulo,
        mensagem: nova.mensagem,
        lida: false,
        criadoEm: nova.criadoEm,
        canalNome: nova.canalNome,
        usuarioEmail: nova.usuarioEmail
      }).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao salvar nova notificacao:", error);
      }).catch((err: any) => {
        console.warn("[Supabase Async Network Error] Erro ao salvar nova notificacao:", err?.message || err);
      });
    }

    return nova;
  },

  getAllNotificacoes: () => {
    return dbCache.notificacoes || [];
  },

  getNotificacaoById: (id: string) => {
    return (dbCache.notificacoes || []).find(n => n.id === id) || null;
  },

  deleteNotificacao: (id: string) => {
    const before = dbCache.notificacoes?.length || 0;
    dbCache.notificacoes = (dbCache.notificacoes || []).filter(n => n.id !== id);
    if (dbCache.notificacoes.length !== before) {
      saveDb(dbCache);

      if (supabaseClient) {
        supabaseClient.from('notificacoes').delete().eq('id', id).then(({ error }: any) => {
          if (error) console.error("[Supabase Async] Erro ao deletar notificacao:", error);
        }).catch((err: any) => {
          console.warn("[Supabase Async Network Error] Erro ao deletar notificacao:", err?.message || err);
        });
      }
      return true;
    }
    return false;
  },

  getUsuarios: () => {
    return dbCache.usuarios || [];
  },

  replaceUsuarios: (usuarios: UserAccount[]) => {
    dbCache.usuarios = usuarios;
    saveDb(dbCache);
  },

  addUsuario: async (usuario: Omit<UserAccount, 'id' | 'createdAt'>, forcedId?: string) => {
    if (!dbCache.usuarios) dbCache.usuarios = [];
    const novo: UserAccount = {
      ...usuario,
      id: forcedId || Math.random().toString(36).substring(2),
      createdAt: new Date().toISOString()
    };

    if (supabaseClient) {
      const { error } = await supabaseClient.from('usuarios').insert({
        email: novo.email,
        id: novo.id,
        username: novo.username,
        password: novo.password,
        createdAt: novo.createdAt,
        avatar: novo.avatar,
        isAdmin: !!novo.isAdmin,
        isDonor: !!novo.isDonor,
        continueWatching: novo.continueWatching || []
      });
      if (error) {
        console.error("[Supabase Async] Erro ao salvar novo usuario:", error);
        let msg = error.message || "Erro ao salvar no banco Supabase.";
        if (error.code === '42501' || msg.includes('row-level security')) {
          msg = "Erro de RLS (Row Level Security) no Supabase. Por favor, desative o RLS ou configure as políticas para a tabela 'usuarios' no editor SQL do Supabase Dashboard utilizando o script disponível no Painel de Admin.";
        }
        throw new Error(msg);
      }
    }

    dbCache.usuarios.push(novo);
    saveDb(dbCache);

    return novo;
  },

  findUsuarioByEmail: async (email: string) => {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('usuarios')
          .select('*')
          .eq('email', email)
          .maybeSingle();
        if (!error && data) {
          if (!dbCache.usuarios) dbCache.usuarios = [];
          const idx = dbCache.usuarios.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
          const localUser = idx >= 0 ? dbCache.usuarios[idx] : undefined;
          const merged = mergeUsuarioFromRemote(localUser, data as UserAccount);
          if (idx >= 0) {
            dbCache.usuarios[idx] = merged;
          } else {
            dbCache.usuarios.push(merged);
          }
          saveDb(dbCache);
          return merged;
        }
      } catch (err) {
        console.error("[Supabase] Erro ao buscar usuario por email:", err);
      }
    }

    if (!dbCache.usuarios) dbCache.usuarios = [];
    return dbCache.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  findUsuarioByEmailSync: (email: string) => {
    if (!dbCache.usuarios) dbCache.usuarios = [];
    return dbCache.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  updateUsuarioSync: (email: string, updates: Partial<UserAccount>) => {
    if (!dbCache.usuarios) dbCache.usuarios = [];
    const idx = dbCache.usuarios.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx < 0) return null;

    dbCache.usuarios[idx] = {
      ...dbCache.usuarios[idx],
      ...updates,
    };
    saveDb(dbCache);
    return dbCache.usuarios[idx];
  },

  updateUsuario: async (email: string, updates: Partial<UserAccount>) => {
    if (!dbCache.usuarios) dbCache.usuarios = [];
    const idx = dbCache.usuarios.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    let current: UserAccount | null = null;
    
    if (idx >= 0) {
      dbCache.usuarios[idx] = {
        ...dbCache.usuarios[idx],
        ...updates
      };
      current = dbCache.usuarios[idx];
      saveDb(dbCache);
    } else {
      const dbUser = await localDb.findUsuarioByEmail(email);
      if (dbUser) {
        const cacheIdx = dbCache.usuarios.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        if (cacheIdx >= 0) {
          dbCache.usuarios[cacheIdx] = { ...dbCache.usuarios[cacheIdx], ...updates };
          current = dbCache.usuarios[cacheIdx];
        } else {
          current = { ...dbUser, ...updates };
          dbCache.usuarios.push(current);
        }
        saveDb(dbCache);
      }
    }

    if (!current) return null;

    if (supabaseClient) {
      const { error } = await supabaseClient.from('usuarios').update({
        username: current.username,
        password: current.password,
        avatar: current.avatar,
        isAdmin: !!current.isAdmin,
        isDonor: !!current.isDonor,
        role: current.role,
        isBanned: !!current.isBanned,
        isSuspended: !!current.isSuspended,
        suspendedUntil: current.suspendedUntil || null,
        bannedAt: current.bannedAt || null,
        continueWatching: current.continueWatching || [],
        descricao: current.descricao || "",
        socialLinks: current.socialLinks || {}
      }).eq('email', email);
      if (error) {
        console.error("[Supabase Async] Erro ao atualizar usuario:", error);
      }
    }

    return current;
  },

  getGamificationProfile: (email: string): GamificationProfile => {
    if (!dbCache.gamificationProfiles) dbCache.gamificationProfiles = {};
    const key = email.toLowerCase();
    if (!dbCache.gamificationProfiles[key]) {
      dbCache.gamificationProfiles[key] = createDefaultProfile(email);
      saveDb(dbCache);
    }
    return migrateProfile(dbCache.gamificationProfiles[key]);
  },

  saveGamificationProfile: (profile: GamificationProfile): GamificationProfile => {
    if (!dbCache.gamificationProfiles) dbCache.gamificationProfiles = {};
    const key = profile.email.toLowerCase();
    dbCache.gamificationProfiles[key] = profile;
    saveDb(dbCache);
    return profile;
  },

  getAllGamificationProfiles: (): GamificationProfile[] => {
    if (!dbCache.gamificationProfiles) dbCache.gamificationProfiles = {};
    return Object.values(dbCache.gamificationProfiles);
  },

  getAdminConfig: (): AdminConfig => {
    if (!dbCache.adminConfig) dbCache.adminConfig = createDefaultAdminConfig();
    return dbCache.adminConfig;
  },

  saveAdminConfig: (config: AdminConfig): AdminConfig => {
    dbCache.adminConfig = config;
    saveDb(dbCache);
    return config;
  },

  updateAdminConfig: (updates: Partial<AdminConfig>): AdminConfig => {
    const current = dbCache.adminConfig || createDefaultAdminConfig();
    dbCache.adminConfig = { ...current, ...updates };
    saveDb(dbCache);
    return dbCache.adminConfig;
  },

  appendAuditLog: (log: Omit<AdminAuditLog, 'id' | 'createdAt'>): AdminAuditLog => {
    if (!dbCache.adminConfig) dbCache.adminConfig = createDefaultAdminConfig();
    const entry: AdminAuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    dbCache.adminConfig.auditLogs = [entry, ...(dbCache.adminConfig.auditLogs || [])].slice(0, 500);
    saveDb(dbCache);
    return entry;
  },

  // ── CineClips ──────────────────────────────────────────────
  getCineClips: (): CineClip[] => dbCache.cineClips || [],

  getCineClipById: (id: string): CineClip | undefined =>
    (dbCache.cineClips || []).find((c) => c.id === id),

  saveCineClip: (clip: CineClip): CineClip => {
    if (!dbCache.cineClips) dbCache.cineClips = [];
    const idx = dbCache.cineClips.findIndex((c) => c.id === clip.id);
    if (idx >= 0) dbCache.cineClips[idx] = clip;
    else dbCache.cineClips.push(clip);
    saveDb(dbCache, true);
    return clip;
  },

  deleteCineClip: (id: string): void => {
    dbCache.cineClips = (dbCache.cineClips || []).filter((c) => c.id !== id);
    dbCache.cineClipComments = (dbCache.cineClipComments || []).filter((c) => c.clipId !== id);
    dbCache.cineClipLikes = (dbCache.cineClipLikes || []).filter((l) => l.clipId !== id);
    dbCache.cineClipFavorites = (dbCache.cineClipFavorites || []).filter((f) => f.clipId !== id);
    saveDb(dbCache);
  },

  incrementClipViews: (id: string): number => {
    const clip = (dbCache.cineClips || []).find((c) => c.id === id);
    if (!clip) return 0;
    clip.visualizacoes = (clip.visualizacoes || 0) + 1;
    clip.atualizadoEm = new Date().toISOString();
    saveDb(dbCache);
    return clip.visualizacoes;
  },

  likeCineClip: (clipId: string, email: string, action: 'like' | 'unlike'): { likes: number; liked: boolean } => {
    if (!dbCache.cineClipLikes) dbCache.cineClipLikes = [];
    const clip = (dbCache.cineClips || []).find((c) => c.id === clipId);
    if (!clip) return { likes: 0, liked: false };

    const key = email.toLowerCase();
    const existing = dbCache.cineClipLikes.find((l) => l.clipId === clipId && l.usuarioEmail.toLowerCase() === key);

    if (action === 'like' && !existing) {
      dbCache.cineClipLikes.push({ clipId, usuarioEmail: key, criadoEm: new Date().toISOString() });
      clip.likes = (clip.likes || 0) + 1;
    } else if (action === 'unlike' && existing) {
      dbCache.cineClipLikes = dbCache.cineClipLikes.filter((l) => !(l.clipId === clipId && l.usuarioEmail.toLowerCase() === key));
      clip.likes = Math.max(0, (clip.likes || 0) - 1);
    }

    clip.atualizadoEm = new Date().toISOString();
    saveDb(dbCache);
    return { likes: clip.likes, liked: action === 'like' && !existing ? true : !!existing && action !== 'unlike' };
  },

  isClipLikedBy: (clipId: string, email: string): boolean =>
    (dbCache.cineClipLikes || []).some((l) => l.clipId === clipId && l.usuarioEmail.toLowerCase() === email.toLowerCase()),

  favoriteCineClip: (clipId: string, email: string, action: 'favorite' | 'unfavorite'): { favorites: number; favorited: boolean } => {
    if (!dbCache.cineClipFavorites) dbCache.cineClipFavorites = [];
    const clip = (dbCache.cineClips || []).find((c) => c.id === clipId);
    if (!clip) return { favorites: 0, favorited: false };

    const key = email.toLowerCase();
    const existing = dbCache.cineClipFavorites.find((f) => f.clipId === clipId && f.usuarioEmail.toLowerCase() === key);

    if (action === 'favorite' && !existing) {
      dbCache.cineClipFavorites.push({ clipId, usuarioEmail: key, criadoEm: new Date().toISOString() });
      clip.favorites = (clip.favorites || 0) + 1;
    } else if (action === 'unfavorite' && existing) {
      dbCache.cineClipFavorites = dbCache.cineClipFavorites.filter((f) => !(f.clipId === clipId && f.usuarioEmail.toLowerCase() === key));
      clip.favorites = Math.max(0, (clip.favorites || 0) - 1);
    }

    clip.atualizadoEm = new Date().toISOString();
    saveDb(dbCache);
    return { favorites: clip.favorites, favorited: action === 'favorite' };
  },

  isClipFavoritedBy: (clipId: string, email: string): boolean =>
    (dbCache.cineClipFavorites || []).some((f) => f.clipId === clipId && f.usuarioEmail.toLowerCase() === email.toLowerCase()),

  shareCineClip: (clipId: string, email?: string): number => {
    if (!dbCache.cineClipShares) dbCache.cineClipShares = [];
    const clip = (dbCache.cineClips || []).find((c) => c.id === clipId);
    if (!clip) return 0;
    dbCache.cineClipShares.push({ clipId, usuarioEmail: email?.toLowerCase(), criadoEm: new Date().toISOString() });
    clip.shares = (clip.shares || 0) + 1;
    clip.atualizadoEm = new Date().toISOString();
    saveDb(dbCache);
    return clip.shares;
  },

  getCineClipComments: (clipId: string): CineClipComment[] =>
    (dbCache.cineClipComments || [])
      .filter((c) => c.clipId === clipId && c.moderationStatus !== 'hidden' && c.moderationStatus !== 'rejected')
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()),

  addCineClipComment: (comment: CineClipComment): CineClipComment => {
    if (!dbCache.cineClipComments) dbCache.cineClipComments = [];
    dbCache.cineClipComments.push(comment);
    const clip = (dbCache.cineClips || []).find((c) => c.id === comment.clipId);
    if (clip) {
      clip.commentsCount = (clip.commentsCount || 0) + 1;
      clip.atualizadoEm = new Date().toISOString();
    }
    saveDb(dbCache);
    return comment;
  },

  reportCineClip: (report: CineClipReport): CineClipReport => {
    if (!dbCache.cineClipReports) dbCache.cineClipReports = [];
    dbCache.cineClipReports.unshift(report);
    saveDb(dbCache);
    return report;
  },

  getCineClipReports: (): CineClipReport[] => dbCache.cineClipReports || [],

  recordClipWatch: (event: CineClipWatchEvent): void => {
    if (!dbCache.cineClipWatchHistory) dbCache.cineClipWatchHistory = [];
    const key = event.usuarioEmail.toLowerCase();
    const existing = dbCache.cineClipWatchHistory.find(
      (h) => h.clipId === event.clipId && h.usuarioEmail.toLowerCase() === key
    );
    if (existing) {
      existing.watchSeconds = Math.max(existing.watchSeconds, event.watchSeconds);
      existing.completed = existing.completed || event.completed;
      existing.criadoEm = event.criadoEm;
    } else {
      dbCache.cineClipWatchHistory.push({ ...event, usuarioEmail: key });
    }
    saveDb(dbCache);
  },

  getClipWatchHistory: (email?: string): CineClipWatchEvent[] => {
    const history = dbCache.cineClipWatchHistory || [];
    if (!email) return history;
    return history.filter((h) => h.usuarioEmail.toLowerCase() === email.toLowerCase());
  },

  getClipLikedIds: (email: string): string[] =>
    (dbCache.cineClipLikes || [])
      .filter((l) => l.usuarioEmail.toLowerCase() === email.toLowerCase())
      .map((l) => l.clipId),

  getClipImportJobs: (): CineClipImportJob[] =>
    (dbCache.cineClipImportJobs || []).sort(
      (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
    ),

  getClipImportJob: (id: string): CineClipImportJob | undefined =>
    (dbCache.cineClipImportJobs || []).find((j) => j.id === id),

  saveClipImportJob: (job: CineClipImportJob): CineClipImportJob => {
    if (!dbCache.cineClipImportJobs) dbCache.cineClipImportJobs = [];
    const idx = dbCache.cineClipImportJobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) dbCache.cineClipImportJobs[idx] = job;
    else dbCache.cineClipImportJobs.unshift(job);
    saveDb(dbCache, true);
    return job;
  },

  isDuplicateClip: (youtubeId?: string, sourceUrl?: string): boolean => {
    const clips = dbCache.cineClips || [];
    if (youtubeId && clips.some((c) => c.youtubeId === youtubeId || c.id === youtubeId)) return true;
    if (sourceUrl && clips.some((c) => c.sourceUrl === sourceUrl)) return true;
    return false;
  },

  exportDbSnapshot: (): DbSchema => {
    return JSON.parse(JSON.stringify(dbCache));
  },
};
