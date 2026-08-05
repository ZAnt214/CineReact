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
import type { DonationRequest } from '../types/donations.ts';
import type { CreatorVerificationRequest } from '../types/creatorVerification.ts';
import type {
  CreatorPayout,
  FinanceTransaction,
  MonthlyCloseRecord,
  PlatformSubscription,
  SubscriptionCheckout,
} from '../types/finance.ts';
import type {
  AuthSession,
  CaptchaChallenge,
  FinancialAuditEntry,
  IdempotencyRecord,
  LoginAttempt,
  SecurityAlert,
} from '../security/types.ts';
import { hashPasswordIfNeeded } from '../security/password.ts';
import { hashToken } from '../security/crypto.ts';
import { createDefaultProfile } from '../gamification/engine.ts';
import { migrateProfile } from '../gamification/rewardsEngine.ts';
import { hasSocialLinks } from '../utils/socialLinks.ts';
import { OBRAS_INICIAIS, VIDEOS_INICIAIS } from '../data.ts';
import { getDataDir, isValidJsonFile, migrateLegacyFile } from './dataPaths.ts';
import {
  persistCineClipsToSupabase,
  restoreCineClipsOnStartup,
} from './cineclipsPersistence.ts';

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
  if (local.emailVerified !== undefined) merged.emailVerified = local.emailVerified;
  if (local.supabaseAuthId) merged.supabaseAuthId = local.supabaseAuthId;

  return merged;
}

const DB_PATH = path.join(getDataDir(), 'db_cine_react.json');

migrateLegacyFile(DB_PATH, [
  path.join('/tmp', 'db_cine_react.json'),
  path.join(process.cwd(), 'db_cine_react.json.bak'),
  path.join(process.cwd(), 'db_cine_react.json'),
  path.join(process.cwd(), 'data', 'db_cine_react.json'),
  '/app/db_cine_react.json.bak',
  '/app/db_cine_react.json',
  '/app/data/db_cine_react.json',
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
  donationRequests: DonationRequest[];
  creatorVerificationRequests: CreatorVerificationRequest[];
  financeTransactions: FinanceTransaction[];
  platformSubscriptions: PlatformSubscription[];
  creatorPayouts: CreatorPayout[];
  monthlyCloses: MonthlyCloseRecord[];
  subscriptionCheckouts: SubscriptionCheckout[];
  authSessions: AuthSession[];
  loginAttempts: LoginAttempt[];
  captchaChallenges: CaptchaChallenge[];
  securityAlerts: SecurityAlert[];
  idempotencyKeys: IdempotencyRecord[];
  financialAuditLog: FinancialAuditEntry[];
}

function loadDbFromPath(filePath: string): DbSchema | null {
  try {
    if (!isValidJsonFile(filePath)) return null;
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as DbSchema;
  } catch {
    return null;
  }
}

function quarantineCorruptDb(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const quarantinePath = `${filePath}.corrupt.${Date.now()}`;
  try {
    fs.renameSync(filePath, quarantinePath);
    console.warn(`[DB] Arquivo corrompido movido para ${quarantinePath}`);
  } catch (err) {
    console.warn('[DB] Não foi possível isolar arquivo corrompido:', err);
  }
}

function recoverDbFromBackups(): DbSchema | null {
  const candidates = [
    `${DB_PATH}.bak`,
    path.join(process.cwd(), 'db_cine_react.json.bak'),
    '/app/db_cine_react.json.bak',
    path.join(process.cwd(), 'db_cine_react.json'),
    '/app/db_cine_react.json',
  ];

  for (const candidate of candidates) {
    const parsed = loadDbFromPath(candidate);
    if (!parsed) continue;
    console.warn(`[DB] Recuperado a partir de ${candidate}`);
    setImmediate(() => saveDb(parsed, true));
    return parsed;
  }

  return null;
}

function initDb(): DbSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const parsed = loadDbFromPath(DB_PATH);
      if (!parsed) {
        throw new SyntaxError(`JSON inválido em ${DB_PATH}`);
      }
      
      // Auto-migrate to include usuarios if not exists
      if (!parsed.usuarios) {
        parsed.usuarios = [];
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

      if (!parsed.donationRequests) {
        parsed.donationRequests = [];
        saveDb(parsed);
      }

      if (!parsed.creatorVerificationRequests) {
        parsed.creatorVerificationRequests = [];
        saveDb(parsed);
      }

      if (!parsed.financeTransactions) parsed.financeTransactions = [];
      if (!parsed.platformSubscriptions) parsed.platformSubscriptions = [];
      if (!parsed.creatorPayouts) parsed.creatorPayouts = [];
      if (!parsed.monthlyCloses) parsed.monthlyCloses = [];
      if (!parsed.subscriptionCheckouts) parsed.subscriptionCheckouts = [];
      if (!parsed.authSessions) parsed.authSessions = [];
      if (!parsed.loginAttempts) parsed.loginAttempts = [];
      if (!parsed.captchaChallenges) parsed.captchaChallenges = [];
      if (!parsed.securityAlerts) parsed.securityAlerts = [];
      if (!parsed.idempotencyKeys) parsed.idempotencyKeys = [];
      if (!parsed.financialAuditLog) parsed.financialAuditLog = [];

      return parsed;
    }
  } catch (error) {
    console.error('Erro ao ler banco de dados local:', error);
    quarantineCorruptDb(DB_PATH);
    const recovered = recoverDbFromBackups();
    if (recovered) return recovered;
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
    usuarios: [],
    cineClips: [],
    cineClipComments: [],
    cineClipLikes: [],
    cineClipFavorites: [],
    cineClipShares: [],
    cineClipReports: [],
    cineClipImportJobs: [],
    cineClipWatchHistory: [],
    donationRequests: [],
    creatorVerificationRequests: [],
    financeTransactions: [],
    platformSubscriptions: [],
    creatorPayouts: [],
    monthlyCloses: [],
    subscriptionCheckouts: [],
    authSessions: [],
    loginAttempts: [],
    captchaChallenges: [],
    securityAlerts: [],
    idempotencyKeys: [],
    financialAuditLog: [],
  };

  saveDb(initialDb);
  return initialDb;
}

let dbCache: DbSchema;
try {
  dbCache = initDb();
} catch (error) {
  console.error('[DB] Falha crítica ao inicializar banco local, usando seed vazio:', error);
  dbCache = {
    obras: [...OBRAS_INICIAIS],
    reacts: [...VIDEOS_INICIAIS],
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
    donationRequests: [],
    creatorVerificationRequests: [],
    financeTransactions: [],
    platformSubscriptions: [],
    creatorPayouts: [],
    monthlyCloses: [],
    subscriptionCheckouts: [],
    authSessions: [],
    loginAttempts: [],
    captchaChallenges: [],
    securityAlerts: [],
    idempotencyKeys: [],
    financialAuditLog: [],
  };
  setImmediate(() => saveDb(dbCache, true));
}

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
    const compact = process.env.NODE_ENV === 'production';
    const jsonStr = compact ? JSON.stringify(dbCache) : JSON.stringify(dbCache, null, 2);
    await fs.promises.writeFile(tempPath, jsonStr, 'utf-8');
    await fs.promises.rename(tempPath, DB_PATH);
    try {
      await fs.promises.copyFile(DB_PATH, `${DB_PATH}.bak`);
    } catch {
      /* backup opcional */
    }
  } catch (error) {
    console.error('Erro ao salvar banco de dados local:', error);
  } finally {
    isWriting = false;
    if (pendingSave) {
      doSaveAsync();
    }
  }
}

// Supabase Client lazy setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';
let supabaseClient: any = null;

const SUPABASE_FETCH_TIMEOUT_MS = Number(process.env.SUPABASE_FETCH_TIMEOUT_MS || 15000);
const SUPABASE_SYNC_DEBOUNCE_MS = Number(process.env.SUPABASE_SYNC_DEBOUNCE_MS || 30000);
const SUPABASE_UPSERT_CHUNK_SIZE = 200;

let supabaseSyncPaused = 0;
let supabaseSyncTimer: NodeJS.Timeout | null = null;
let supabaseSyncDirty = false;
let lastSupabaseIssueLogAt = 0;

function logSupabaseBackgroundIssue(kind: 'timeout' | 'offline') {
  const now = Date.now();
  if (now - lastSupabaseIssueLogAt < 60_000) return;
  lastSupabaseIssueLogAt = now;
  console.warn(
    kind === 'timeout'
      ? '[Supabase] Requisições em background com timeout. Mantendo operação local.'
      : '[Supabase] Operações em background off-line. Mantendo operação local.'
  );
}

const supabaseFetchWithTimeout = async (input: any, init?: any) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SUPABASE_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      logSupabaseBackgroundIssue('timeout');
    } else {
      logSupabaseBackgroundIssue('offline');
    }
    return new Response(JSON.stringify({ message: 'supabase_unreachable' }), {
      status: 504,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

async function uploadCacheToSupabase(options?: { quiet?: boolean }): Promise<boolean> {
  if (!supabaseClient) return false;
  try {
    if (!options?.quiet) {
      console.log('[Supabase] Enviando dados do cache local para o Supabase...');
    }

    const upsertInChunks = async (table: string, rows: Record<string, unknown>[]) => {
      for (let i = 0; i < rows.length; i += SUPABASE_UPSERT_CHUNK_SIZE) {
        const chunk = rows.slice(i, i + SUPABASE_UPSERT_CHUNK_SIZE);
        const { error } = await supabaseClient.from(table).upsert(chunk);
        if (error) {
          console.error(`[Supabase Upload] Erro em ${table}:`, error);
          return false;
        }
      }
      return true;
    };

    if (dbCache.obras.length > 0) {
      await upsertInChunks(
        'obras',
        dbCache.obras.map((o) => ({
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
          destacado: !!o.destacado,
        }))
      );
    }

    if (dbCache.reacts.length > 0) {
      await upsertInChunks(
        'reacts',
        dbCache.reacts.map((r) => ({
          id: r.id,
          obraId: r.obraId,
          titulo: r.titulo,
          videoUrl: 'https://www.youtube.com/watch?v=' + r.id,
          thumbnailUrl: r.thumbnailUrl || '',
          duracao: r.duracao,
          canalNome: r.canalNome,
          visualizacoes: r.visualizacoes || 0,
          isRecomendado: !!r.isRecomendado,
        }))
      );
    }

    if (dbCache.comentarios.length > 0) {
      await upsertInChunks(
        'comentarios',
        dbCache.comentarios.map((c) => ({
          id: c.id,
          obraId: c.obraId,
          usuarioNome: c.usuarioNome,
          usuarioEmail: c.usuarioEmail,
          texto: c.texto,
          nota: c.nota,
          criadoEm: c.criadoEm,
        }))
      );
    }

    if (dbCache.favoritos.length > 0) {
      await supabaseClient.from('favoritos').delete().neq('id', 0);
      const { error } = await supabaseClient.from('favoritos').insert(
        dbCache.favoritos.map((f) => ({
          usuarioEmail: f.usuarioEmail,
          obraId: f.obraId,
        }))
      );
      if (error) console.error('[Supabase Upload] Erro nos favoritos:', error);
    }

    if (dbCache.canaisSeguidos.length > 0) {
      await supabaseClient.from('canais_seguidos').delete().neq('id', 0);
      const { error } = await supabaseClient.from('canais_seguidos').insert(
        dbCache.canaisSeguidos.map((c) => ({
          usuarioEmail: c.usuarioEmail,
          canalNome: c.canalNome,
        }))
      );
      if (error) console.error('[Supabase Upload] Erro nos canais seguidos:', error);
    }

    if (dbCache.listas.length > 0) {
      await upsertInChunks(
        'listas',
        dbCache.listas.map((l) => ({
          id: l.id,
          nome: l.nome,
          descricao: l.descricao,
          usuarioEmail: l.usuarioEmail,
          obraIds: l.obraIds || [],
        }))
      );
    }

    if (dbCache.notificacoes.length > 0) {
      await upsertInChunks(
        'notificacoes',
        dbCache.notificacoes.map((n) => ({
          id: n.id,
          titulo: n.titulo,
          mensagem: n.mensagem,
          lida: !!n.lida,
          criadoEm: n.criadoEm,
          canalNome: n.canalNome,
          usuarioEmail: n.usuarioEmail,
        }))
      );
    }

    if (dbCache.usuarios.length > 0) {
      await upsertInChunks(
        'usuarios',
        dbCache.usuarios.map((u) => ({
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
          emailVerified: u.emailVerified ?? true,
          supabaseAuthId: u.supabaseAuthId || null,
        }))
      );
    }

    if ((dbCache.cineClips || []).length > 0) {
      await persistCineClipsToSupabase(supabaseClient, dbCache, { immediate: true });
    }

    if (!options?.quiet) {
      console.log('[Supabase] Upload de dados concluído.');
    }
    return true;
  } catch (error) {
    console.error('[Supabase] Erro ao enviar dados:', error);
    return false;
  }
}

function scheduleSupabaseBackgroundSync() {
  if (!supabaseClient) return;
  supabaseSyncDirty = true;
  if (supabaseSyncPaused > 0 || supabaseSyncTimer) return;
  supabaseSyncTimer = setTimeout(() => {
    supabaseSyncTimer = null;
    void flushSupabaseBackgroundSync();
  }, SUPABASE_SYNC_DEBOUNCE_MS);
}

async function flushSupabaseBackgroundSync(): Promise<boolean> {
  if (!supabaseClient || !supabaseSyncDirty || supabaseSyncPaused > 0) return false;
  supabaseSyncDirty = false;
  const ok = await uploadCacheToSupabase({ quiet: true });
  if (!ok) {
    supabaseSyncDirty = true;
    scheduleSupabaseBackgroundSync();
  }
  return ok;
}

function pauseSupabaseBackgroundSync(): void {
  supabaseSyncPaused++;
}

function resumeSupabaseBackgroundSync(): void {
  supabaseSyncPaused = Math.max(0, supabaseSyncPaused - 1);
  if (supabaseSyncPaused === 0 && supabaseSyncDirty) {
    scheduleSupabaseBackgroundSync();
  }
}

if (supabaseUrl && supabaseKey && supabaseUrl !== "" && supabaseKey !== "") {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn(
        "[Supabase] SUPABASE_SERVICE_ROLE_KEY ausente — usando anon key. " +
        "Após habilitar RLS, configure a service role key no Railway."
      );
    }
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: supabaseFetchWithTimeout
      }
    });
    console.log("[Supabase] Cliente inicializado com sucesso.");
  } catch (err) {
    console.error("[Supabase] Erro ao inicializar cliente:", err);
  }
}

function queueCineClipsCloudSync(immediate = false) {
  if (!supabaseClient) return;
  persistCineClipsToSupabase(supabaseClient, dbCache, { immediate }).catch(() => undefined);
}

export const localDb = {
  // Supabase Connection Check
  isSupabaseActive: () => {
    return !!supabaseClient;
  },

  getSupabaseClient: () => {
    return supabaseClient;
  },

  ensureCineClipsRestored: async (): Promise<boolean> => {
    return restoreCineClipsOnStartup(supabaseClient, dbCache, (data, immediate) => {
      if (data) dbCache = data as DbSchema;
      saveDb(dbCache, immediate);
    });
  },

  // Pull data from Supabase and refresh the memory cache
  syncFromSupabase: async () => {
    if (!supabaseClient) return false;
    try {
      console.log("[Supabase] Sincronizando dados do Supabase...");

      await restoreCineClipsOnStartup(supabaseClient, dbCache, (data, immediate) => {
        if (data) dbCache = data as DbSchema;
        saveDb(dbCache, immediate);
      });
      
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

      if (!obras || !reacts) {
        console.warn("[Supabase] Resposta incompleta ao sincronizar — mantendo dados locais.");
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
      queueCineClipsCloudSync(true);

      console.log("[Supabase] Sincronização de volta para o cache concluída com sucesso!");
      return true;
    } catch (error) {
      console.error("[Supabase] Falha ao sincronizar dados:", error);
      return false;
    }
  },

  // Export local JSON cache up to Supabase manually
  uploadLocalDataToSupabase: () => uploadCacheToSupabase(),

  pauseSupabaseBackgroundSync,
  resumeSupabaseBackgroundSync,
  flushSupabaseBackgroundSync,

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
    scheduleSupabaseBackgroundSync();
    return obra;
  },

  deleteObra: (id: string) => {
    dbCache.obras = dbCache.obras.filter(o => o.id !== id);
    dbCache.reacts = dbCache.reacts.filter(r => r.obraId !== id);
    dbCache.comentarios = dbCache.comentarios.filter(c => c.obraId !== id);
    saveDb(dbCache);
    scheduleSupabaseBackgroundSync();
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
    scheduleSupabaseBackgroundSync();
    return react;
  },

  saveReactsBatch: (reacts: ReactVideo[]) => {
    if (reacts.length === 0) return;
    for (const react of reacts) {
      const idx = dbCache.reacts.findIndex((r) => r.id === react.id);
      if (idx >= 0) dbCache.reacts[idx] = react;
      else dbCache.reacts.push(react);
    }
    saveDb(dbCache);
    scheduleSupabaseBackgroundSync();
  },

  deleteReact: (id: string) => {
    dbCache.reacts = dbCache.reacts.filter(r => r.id !== id);
    saveDb(dbCache);
    scheduleSupabaseBackgroundSync();
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
    scheduleSupabaseBackgroundSync();
    return comentario;
  },

  deleteComentario: (id: string) => {
    dbCache.comentarios = dbCache.comentarios.filter(c => c.id !== id);
    saveDb(dbCache);
    scheduleSupabaseBackgroundSync();
  },

  updateComentario: (id: string, updates: Partial<Comentario>) => {
    const idx = dbCache.comentarios.findIndex(c => c.id === id);
    if (idx < 0) return null;
    dbCache.comentarios[idx] = { ...dbCache.comentarios[idx], ...updates };
    saveDb(dbCache);
    scheduleSupabaseBackgroundSync();
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
    scheduleSupabaseBackgroundSync();
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
    scheduleSupabaseBackgroundSync();
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
    scheduleSupabaseBackgroundSync();
    return novaLista;
  },

  updateLista: (lista: ListaPersonalizada) => {
    const idx = dbCache.listas.findIndex(l => l.id === lista.id);
    if (idx >= 0) {
      dbCache.listas[idx] = lista;
      saveDb(dbCache);
      scheduleSupabaseBackgroundSync();
    }
    return lista;
  },

  deleteLista: (id: string) => {
    dbCache.listas = dbCache.listas.filter(l => l.id !== id);
    saveDb(dbCache);
    scheduleSupabaseBackgroundSync();
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
      scheduleSupabaseBackgroundSync();
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
    scheduleSupabaseBackgroundSync();
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
    scheduleSupabaseBackgroundSync();
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
      scheduleSupabaseBackgroundSync();
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
    const hashedPassword = usuario.password
      ? await hashPasswordIfNeeded(usuario.password)
      : usuario.password;
    const novo: UserAccount = {
      ...usuario,
      password: hashedPassword,
      id: forcedId || Math.random().toString(36).substring(2),
      createdAt: new Date().toISOString()
    };

    dbCache.usuarios.push(novo);
    saveDb(dbCache);
    scheduleSupabaseBackgroundSync();
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
    const nextUpdates = { ...updates };
    if (nextUpdates.password) {
      nextUpdates.password = await hashPasswordIfNeeded(nextUpdates.password);
    }
    if (!dbCache.usuarios) dbCache.usuarios = [];
    const idx = dbCache.usuarios.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    let current: UserAccount | null = null;
    
    if (idx >= 0) {
      dbCache.usuarios[idx] = {
        ...dbCache.usuarios[idx],
        ...nextUpdates
      };
      current = dbCache.usuarios[idx];
      saveDb(dbCache);
    } else {
      const dbUser = await localDb.findUsuarioByEmail(email);
      if (dbUser) {
        const cacheIdx = dbCache.usuarios.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        if (cacheIdx >= 0) {
          dbCache.usuarios[cacheIdx] = { ...dbCache.usuarios[cacheIdx], ...nextUpdates };
          current = dbCache.usuarios[cacheIdx];
        } else {
          current = { ...dbUser, ...nextUpdates };
          dbCache.usuarios.push(current);
        }
        saveDb(dbCache);
      }
    }

    if (!current) return null;

    scheduleSupabaseBackgroundSync();
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
    dbCache.adminConfig.auditLogs = [entry, ...(dbCache.adminConfig.auditLogs || [])].slice(0, 5000);
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
    queueCineClipsCloudSync(true);
    return clip;
  },

  deleteCineClip: (id: string): void => {
    dbCache.cineClips = (dbCache.cineClips || []).filter((c) => c.id !== id);
    dbCache.cineClipComments = (dbCache.cineClipComments || []).filter((c) => c.clipId !== id);
    dbCache.cineClipLikes = (dbCache.cineClipLikes || []).filter((l) => l.clipId !== id);
    dbCache.cineClipFavorites = (dbCache.cineClipFavorites || []).filter((f) => f.clipId !== id);
    saveDb(dbCache, true);
    queueCineClipsCloudSync(true);
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

  getAllCineClipComments: (): CineClipComment[] => dbCache.cineClipComments || [],

  getAllCineClipLikes: (): CineClipLike[] => dbCache.cineClipLikes || [],

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
    queueCineClipsCloudSync(true);
    return job;
  },

  isDuplicateClip: (youtubeId?: string, sourceUrl?: string): boolean => {
    const clips = dbCache.cineClips || [];
    if (youtubeId && clips.some((c) => c.youtubeId === youtubeId || c.id === youtubeId)) return true;
    if (sourceUrl && clips.some((c) => c.sourceUrl === sourceUrl)) return true;
    return false;
  },

  createDonationRequest: (data: Omit<DonationRequest, 'id' | 'requestedAt' | 'status'>): DonationRequest => {
    if (!dbCache.donationRequests) dbCache.donationRequests = [];
    const request: DonationRequest = {
      ...data,
      id: `don-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    dbCache.donationRequests.unshift(request);
    saveDb(dbCache, true);
    return request;
  },

  getDonationRequests: (status?: DonationRequest['status']): DonationRequest[] => {
    const list = dbCache.donationRequests || [];
    if (!status) return [...list];
    return list.filter((r) => r.status === status);
  },

  getLatestDonationRequestForUser: (email: string): DonationRequest | null => {
    const key = email.toLowerCase();
    const list = dbCache.donationRequests || [];
    return list.find((r) => r.usuarioEmail.toLowerCase() === key) || null;
  },

  getPendingDonationRequestForUser: (email: string): DonationRequest | null => {
    const key = email.toLowerCase();
    const list = dbCache.donationRequests || [];
    return list.find((r) => r.usuarioEmail.toLowerCase() === key && r.status === 'pending') || null;
  },

  updateDonationRequest: (
    id: string,
    updates: Partial<Pick<DonationRequest, 'status' | 'reviewedAt' | 'reviewedBy' | 'adminNote'>>
  ): DonationRequest | null => {
    if (!dbCache.donationRequests) dbCache.donationRequests = [];
    const idx = dbCache.donationRequests.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    dbCache.donationRequests[idx] = { ...dbCache.donationRequests[idx], ...updates };
    saveDb(dbCache, true);
    return dbCache.donationRequests[idx];
  },

  createCreatorVerificationRequest: (
    data: Omit<
      CreatorVerificationRequest,
      'id' | 'requestedAt' | 'status' | 'verificationCode' | 'expiresAt'
    > & { verificationCode: string; expiresAt: string }
  ): CreatorVerificationRequest => {
    if (!dbCache.creatorVerificationRequests) dbCache.creatorVerificationRequests = [];
    const request: CreatorVerificationRequest = {
      ...data,
      id: `cvr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    dbCache.creatorVerificationRequests.unshift(request);
    saveDb(dbCache, true);
    return request;
  },

  getCreatorVerificationRequests: (
    status?: CreatorVerificationRequest['status']
  ): CreatorVerificationRequest[] => {
    const list = dbCache.creatorVerificationRequests || [];
    if (!status) return [...list];
    return list.filter((r) => r.status === status);
  },

  getLatestCreatorVerificationRequestForUser: (email: string): CreatorVerificationRequest | null => {
    const key = email.toLowerCase();
    const list = dbCache.creatorVerificationRequests || [];
    return list.find((r) => r.usuarioEmail.toLowerCase() === key) || null;
  },

  getPendingCreatorVerificationRequestForUser: (email: string): CreatorVerificationRequest | null => {
    const key = email.toLowerCase();
    const list = dbCache.creatorVerificationRequests || [];
    return (
      list.find(
        (r) =>
          r.usuarioEmail.toLowerCase() === key &&
          r.status === 'pending' &&
          new Date(r.expiresAt).getTime() > Date.now()
      ) || null
    );
  },

  updateCreatorVerificationRequest: (
    id: string,
    updates: Partial<
      Pick<
        CreatorVerificationRequest,
        | 'status'
        | 'reviewedAt'
        | 'reviewedBy'
        | 'adminNote'
        | 'codeFoundInDescription'
        | 'descriptionCheckedAt'
        | 'youtubeChannelId'
        | 'channelTitle'
      >
    >
  ): CreatorVerificationRequest | null => {
    if (!dbCache.creatorVerificationRequests) dbCache.creatorVerificationRequests = [];
    const idx = dbCache.creatorVerificationRequests.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    dbCache.creatorVerificationRequests[idx] = {
      ...dbCache.creatorVerificationRequests[idx],
      ...updates,
    };
    saveDb(dbCache, true);
    return dbCache.creatorVerificationRequests[idx];
  },

  expireStaleCreatorVerificationRequests: (): number => {
    if (!dbCache.creatorVerificationRequests) return 0;
    const now = Date.now();
    let count = 0;
    dbCache.creatorVerificationRequests = dbCache.creatorVerificationRequests.map((r) => {
      if (r.status !== 'pending' || new Date(r.expiresAt).getTime() > now) return r;
      count++;
      return { ...r, status: 'expired' as const };
    });
    if (count > 0) saveDb(dbCache, true);
    return count;
  },

  getFinanceTransactions: (): FinanceTransaction[] => dbCache.financeTransactions || [],

  saveFinanceTransaction: (tx: FinanceTransaction): FinanceTransaction => {
    if (!dbCache.financeTransactions) dbCache.financeTransactions = [];
    dbCache.financeTransactions.unshift(tx);
    saveDb(dbCache, true);
    return tx;
  },

  getPlatformSubscriptions: (): PlatformSubscription[] => dbCache.platformSubscriptions || [],

  savePlatformSubscription: (sub: PlatformSubscription): PlatformSubscription => {
    if (!dbCache.platformSubscriptions) dbCache.platformSubscriptions = [];
    const idx = dbCache.platformSubscriptions.findIndex((s) => s.id === sub.id);
    if (idx >= 0) dbCache.platformSubscriptions[idx] = sub;
    else dbCache.platformSubscriptions.push(sub);
    saveDb(dbCache, true);
    return sub;
  },

  getCreatorPayouts: (): CreatorPayout[] => dbCache.creatorPayouts || [],

  saveCreatorPayout: (payout: CreatorPayout): CreatorPayout => {
    if (!dbCache.creatorPayouts) dbCache.creatorPayouts = [];
    const idx = dbCache.creatorPayouts.findIndex((p) => p.id === payout.id);
    if (idx >= 0) dbCache.creatorPayouts[idx] = payout;
    else dbCache.creatorPayouts.push(payout);
    saveDb(dbCache, true);
    return payout;
  },

  getMonthlyCloses: (): MonthlyCloseRecord[] => dbCache.monthlyCloses || [],

  saveMonthlyClose: (record: MonthlyCloseRecord): MonthlyCloseRecord => {
    if (!dbCache.monthlyCloses) dbCache.monthlyCloses = [];
    dbCache.monthlyCloses.unshift(record);
    saveDb(dbCache, true);
    return record;
  },

  getSubscriptionCheckouts: (): SubscriptionCheckout[] => dbCache.subscriptionCheckouts || [],

  saveSubscriptionCheckout: (checkout: SubscriptionCheckout): SubscriptionCheckout => {
    if (!dbCache.subscriptionCheckouts) dbCache.subscriptionCheckouts = [];
    const idx = dbCache.subscriptionCheckouts.findIndex((c) => c.id === checkout.id);
    if (idx >= 0) dbCache.subscriptionCheckouts[idx] = checkout;
    else dbCache.subscriptionCheckouts.unshift(checkout);
    saveDb(dbCache, true);
    return checkout;
  },

  purgeFinanceDemoSeedData: (isDemoSubscriber: (email?: string) => boolean): boolean => {
    let changed = false;

    const filterBySubscriber = <T extends { subscriberEmail: string }>(items: T[] | undefined): T[] =>
      (items || []).filter((item) => !isDemoSubscriber(item.subscriberEmail));

    const nextTransactions = filterBySubscriber(dbCache.financeTransactions);
    if (nextTransactions.length !== (dbCache.financeTransactions || []).length) {
      dbCache.financeTransactions = nextTransactions;
      changed = true;
    }

    const nextSubscriptions = filterBySubscriber(dbCache.platformSubscriptions);
    if (nextSubscriptions.length !== (dbCache.platformSubscriptions || []).length) {
      dbCache.platformSubscriptions = nextSubscriptions;
      changed = true;
    }

    const nextCheckouts = filterBySubscriber(dbCache.subscriptionCheckouts);
    if (nextCheckouts.length !== (dbCache.subscriptionCheckouts || []).length) {
      dbCache.subscriptionCheckouts = nextCheckouts;
      changed = true;
    }

    const removedLikes = (dbCache.cineClipLikes || []).filter((like) =>
      isDemoSubscriber(like.usuarioEmail)
    );
    if (removedLikes.length > 0) {
      dbCache.cineClipLikes = (dbCache.cineClipLikes || []).filter(
        (like) => !isDemoSubscriber(like.usuarioEmail)
      );
      for (const like of removedLikes) {
        const clip = (dbCache.cineClips || []).find((c) => c.id === like.clipId);
        if (clip) clip.likes = Math.max(0, (clip.likes || 0) - 1);
      }
      changed = true;
    }

    if (changed) {
      dbCache.creatorPayouts = [];
      dbCache.monthlyCloses = [];
      saveDb(dbCache, true);
    }

    return changed;
  },

  saveAuthSession: (session: AuthSession): AuthSession => {
    if (!dbCache.authSessions) dbCache.authSessions = [];
    dbCache.authSessions = dbCache.authSessions.filter((s) => s.id !== session.id);
    dbCache.authSessions.unshift(session);
    saveDb(dbCache, true);
    return session;
  },

  getAuthSessionByTokenHash: (tokenHash: string): AuthSession | null =>
    (dbCache.authSessions || []).find((s) => s.tokenHash === tokenHash && !s.revokedAt) || null,

  getAuthSessionById: (id: string): AuthSession | null =>
    (dbCache.authSessions || []).find((s) => s.id === id) || null,

  getAuthSessionsForUser: (email: string): AuthSession[] =>
    (dbCache.authSessions || []).filter(
      (s) => s.userEmail === email.toLowerCase() && !s.revokedAt
    ),

  touchAuthSession: (id: string): void => {
    const session = (dbCache.authSessions || []).find((s) => s.id === id);
    if (!session) return;
    session.lastActivityAt = new Date().toISOString();
    saveDb(dbCache);
  },

  revokeAuthSession: (id: string): void => {
    const session = (dbCache.authSessions || []).find((s) => s.id === id);
    if (!session) return;
    session.revokedAt = new Date().toISOString();
    saveDb(dbCache, true);
  },

  revokeAuthSessionsForUser: (email: string, exceptSessionId?: string): number => {
    let count = 0;
    for (const session of dbCache.authSessions || []) {
      if (session.userEmail !== email.toLowerCase() || session.revokedAt) continue;
      if (exceptSessionId && session.id === exceptSessionId) continue;
      session.revokedAt = new Date().toISOString();
      count++;
    }
    if (count > 0) saveDb(dbCache, true);
    return count;
  },

  cleanupAuthSessions: (): number => {
    const now = Date.now();
    let count = 0;
    dbCache.authSessions = (dbCache.authSessions || []).filter((s) => {
      const expired = new Date(s.expiresAt).getTime() <= now || !!s.revokedAt;
      if (expired) count++;
      return !expired;
    });
    if (count > 0) saveDb(dbCache);
    return count;
  },

  appendLoginAttempt: (attempt: LoginAttempt): void => {
    if (!dbCache.loginAttempts) dbCache.loginAttempts = [];
    dbCache.loginAttempts.unshift(attempt);
    dbCache.loginAttempts = dbCache.loginAttempts.slice(0, 5000);
    saveDb(dbCache);
  },

  countRecentLoginFailures: (ip: string, windowMs: number): number => {
    const since = Date.now() - windowMs;
    return (dbCache.loginAttempts || []).filter(
      (a) => a.ip === ip && !a.success && new Date(a.createdAt).getTime() >= since
    ).length;
  },

  saveCaptchaChallenge: (challenge: CaptchaChallenge): void => {
    if (!dbCache.captchaChallenges) dbCache.captchaChallenges = [];
    dbCache.captchaChallenges.unshift(challenge);
    dbCache.captchaChallenges = dbCache.captchaChallenges.slice(0, 200);
    saveDb(dbCache);
  },

  consumeCaptchaChallenge: (id: string, answer: string): boolean => {
    const challenge = (dbCache.captchaChallenges || []).find((c) => c.id === id && !c.used);
    if (!challenge) return false;
    if (new Date(challenge.expiresAt).getTime() < Date.now()) return false;
    const answerHash = hashToken(`${id}:${String(answer).trim()}`);
    if (answerHash !== challenge.answerHash) return false;
    challenge.used = true;
    saveDb(dbCache);
    return true;
  },

  appendSecurityAlert: (alert: SecurityAlert): void => {
    if (!dbCache.securityAlerts) dbCache.securityAlerts = [];
    dbCache.securityAlerts.unshift(alert);
    dbCache.securityAlerts = dbCache.securityAlerts.slice(0, 1000);
    saveDb(dbCache, true);
  },

  getSecurityAlerts: (): SecurityAlert[] => dbCache.securityAlerts || [],

  claimIdempotencyKey: (scope: string, key: string, resultRef?: string): boolean => {
    if (!dbCache.idempotencyKeys) dbCache.idempotencyKeys = [];
    const composite = `${scope}:${key}`;
    if (dbCache.idempotencyKeys.some((r) => r.key === composite)) return false;
    dbCache.idempotencyKeys.unshift({
      key: composite,
      scope,
      resultRef,
      createdAt: new Date().toISOString(),
    });
    dbCache.idempotencyKeys = dbCache.idempotencyKeys.slice(0, 10000);
    saveDb(dbCache, true);
    return true;
  },

  hasIdempotencyKey: (scope: string, key: string): boolean =>
    (dbCache.idempotencyKeys || []).some((r) => r.key === `${scope}:${key}`),

  appendFinancialAuditLog: (entry: Omit<FinancialAuditEntry, 'id' | 'createdAt'>): FinancialAuditEntry => {
    if (!dbCache.financialAuditLog) dbCache.financialAuditLog = [];
    const row: FinancialAuditEntry = {
      ...entry,
      id: `fin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    dbCache.financialAuditLog.unshift(row);
    saveDb(dbCache, true);
    return row;
  },

  getFinancialAuditLog: (): FinancialAuditEntry[] => dbCache.financialAuditLog || [],

  saveBackupRecord: (record: import('../types/admin.ts').BackupRecord & { fileName?: string }): void => {
    if (!dbCache.adminConfig) dbCache.adminConfig = createDefaultAdminConfig();
    dbCache.adminConfig.backups = [record, ...(dbCache.adminConfig.backups || [])].slice(0, 50);
    saveDb(dbCache, true);
  },

  getBackupRecords: () => dbCache.adminConfig?.backups || [],

  exportDbSnapshot: (): DbSchema => {
    return JSON.parse(JSON.stringify(dbCache));
  },

  exportDbSnapshotRedacted: (): DbSchema => {
    const snapshot = JSON.parse(JSON.stringify(dbCache)) as DbSchema;
    snapshot.usuarios = (snapshot.usuarios || []).map((u) => ({
      ...u,
      password: u.password ? '[REDACTED]' : u.password,
      twoFactorSecretEnc: u.twoFactorSecretEnc ? '[REDACTED]' : undefined,
    }));
    snapshot.authSessions = (snapshot.authSessions || []).map((s) => ({
      ...s,
      tokenHash: '[REDACTED]',
    }));
    return snapshot;
  },
};
