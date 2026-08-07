import {
  applyCineClipsPayload,
  buildCineClipsPayload,
  CINECLIPS_PAYLOAD_ID,
  mergeCineClipsPayload,
  type CineClipsPayload,
} from './cineclipsPayload.ts';
import { getDataDir } from './dataPaths.ts';

type SupabaseClient = {
  from: (table: string) => {
    select: (cols: string) => { eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: any; error: any }> } };
    upsert: (row: Record<string, unknown>) => Promise<{ error: any }>;
  };
};

type DbSlice = Parameters<typeof buildCineClipsPayload>[0];

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let restorePromise: Promise<boolean> | null = null;
let cineclipsSupabaseDisabled = false;
let lastCineclipsIssueLogAt = 0;

function isMissingCineclipsTableError(error: unknown): boolean {
  const msg = String((error as { message?: string })?.message || error || '');
  return msg.includes('cineclips_payload') || msg.includes('schema cache');
}

function logCineclipsSupabaseIssue(kind: 'missing_table' | 'other', detail?: string): void {
  const now = Date.now();
  if (cineclipsSupabaseDisabled && now - lastCineclipsIssueLogAt < 5 * 60 * 1000) return;
  lastCineclipsIssueLogAt = now;

  if (kind === 'missing_table') {
    cineclipsSupabaseDisabled = true;
    console.warn(
      '[CineClips] Tabela cineclips_payload ausente no Supabase. ' +
        'Execute supabase_cineclips_migration.sql no SQL Editor e configure SUPABASE_SERVICE_ROLE_KEY no Railway.'
    );
    return;
  }

  console.warn('[CineClips] Falha ao salvar no Supabase:', detail || 'erro desconhecido');
}

export function getPersistenceDiagnostics() {
  const dataDir = getDataDir();
  const onRailway = !!(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID);
  const volumeMounted = !!process.env.RAILWAY_VOLUME_MOUNT_PATH;

  return {
    dataDir,
    onRailway,
    volumeMounted,
    volumePath: process.env.RAILWAY_VOLUME_MOUNT_PATH || null,
    envDataDir: process.env.CINE_REACT_DATA_DIR || null,
  };
}

export async function fetchCineClipsPayloadFromSupabase(
  client: SupabaseClient
): Promise<CineClipsPayload | null> {
  if (cineclipsSupabaseDisabled) return null;

  try {
    const { data, error } = await client
      .from('cineclips_payload')
      .select('payload')
      .eq('id', CINECLIPS_PAYLOAD_ID)
      .maybeSingle();

    if (error) {
      if (isMissingCineclipsTableError(error)) {
        logCineclipsSupabaseIssue('missing_table');
      } else {
        console.warn('[CineClips] Falha ao buscar payload no Supabase:', error.message || error);
      }
      return null;
    }

    if (!data?.payload) return null;
    const payload = data.payload as CineClipsPayload;
    if (!Array.isArray(payload.cineClips)) return null;
    return payload;
  } catch (err: any) {
    console.warn('[CineClips] Erro ao ler Supabase:', err?.message || err);
    return null;
  }
}

export async function persistCineClipsToSupabase(
  client: SupabaseClient,
  db: DbSlice,
  options?: { immediate?: boolean }
): Promise<void> {
  if (cineclipsSupabaseDisabled) return;

  const run = async () => {
    let localPayload = buildCineClipsPayload(db);
    const remote = await fetchCineClipsPayloadFromSupabase(client);

    // Nunca apagar clips do Supabase com cache local vazio (ex.: container novo antes do restore)
    if (localPayload.cineClips.length === 0 && remote && remote.cineClips.length > 0) {
      console.warn(
        `[CineClips] Sync ignorado: local vazio (${localPayload.cineClips.length}) mas Supabase tem ${remote.cineClips.length} clips`
      );
      return;
    }

    const payload = remote ? mergeCineClipsPayload(localPayload, remote) : localPayload;

    const { error } = await client.from('cineclips_payload').upsert({
      id: CINECLIPS_PAYLOAD_ID,
      payload,
      updated_at: payload.updatedAt,
    });

    if (error) {
      if (isMissingCineclipsTableError(error)) {
        logCineclipsSupabaseIssue('missing_table');
      } else {
        logCineclipsSupabaseIssue('other', String(error.message || error));
      }
    } else {
      console.log(`[CineClips] Persistidos ${payload.cineClips.length} clips no Supabase`);
    }
  };

  if (options?.immediate) {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    await run();
    return;
  }

  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    run().catch(() => undefined);
  }, 800);
}

export async function restoreCineClipsOnStartup(
  client: SupabaseClient | null,
  db: DbSlice,
  saveDb: (data?: DbSlice, immediate?: boolean) => void
): Promise<boolean> {
  if (!restorePromise) {
    restorePromise = (async () => {
      const diag = getPersistenceDiagnostics();
      console.log('[CineClips] Persistência:', JSON.stringify(diag));

      const localPayload = buildCineClipsPayload(db);
      let merged = localPayload;
      let remote: CineClipsPayload | null = null;

      if (client) {
        remote = await fetchCineClipsPayloadFromSupabase(client);
        if (remote) {
          merged = mergeCineClipsPayload(localPayload, remote);
          console.log(
            `[CineClips] Restaurado do Supabase: local=${localPayload.cineClips.length}, remoto=${remote.cineClips.length}, final=${merged.cineClips.length}`
          );
        } else if (localPayload.cineClips.length > 0) {
          await persistCineClipsToSupabase(client, db, { immediate: true });
        }
      }

      const clipsChanged =
        merged.cineClips.length !== localPayload.cineClips.length ||
        JSON.stringify(merged.cineClips.map((c) => c.id).sort()) !==
          JSON.stringify(localPayload.cineClips.map((c) => c.id).sort()) ||
        merged.cineClips.some((clip, i) => {
          const local = localPayload.cineClips.find((c) => c.id === clip.id);
          return !local || local.videoUrl !== clip.videoUrl || local.status !== clip.status;
        });

      if (clipsChanged) {
        applyCineClipsPayload(db, merged);
        saveDb(db as any, true);
        if (client && merged.cineClips.length > 0) {
          await persistCineClipsToSupabase(client, db, { immediate: true });
        }
      }

      if (diag.onRailway && !diag.volumeMounted && !diag.envDataDir) {
        console.warn(
          '[CineClips] AVISO: Railway sem volume em /data. Vídeos locais podem sumir no deploy — use Supabase + volume Railway.'
        );
      }

      return true;
    })();
  }

  return restorePromise;
}
