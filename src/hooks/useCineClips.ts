import { useCallback, useEffect, useRef, useState } from 'react';
import type { CineClip } from '../types/cineclips.ts';

interface FeedState {
  clips: CineClip[];
  trending: CineClip[];
  nextCursor: string | null;
  loading: boolean;
  error: string | null;
}

export function useCineClipsFeed(email?: string) {
  const [state, setState] = useState<FeedState>({
    clips: [],
    trending: [],
    nextCursor: null,
    loading: true,
    error: null,
  });
  const loadingMore = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const fetchFeed = useCallback(async (cursor?: string, options?: { silent?: boolean }) => {
    const isMore = !!cursor;
    if (isMore) loadingMore.current = true;
    else if (!options?.silent) setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const params = new URLSearchParams();
      if (email) params.set('email', email);
      if (cursor) params.set('cursor', cursor);
      params.set('limit', '6');

      const res = await fetch(`/api/cineclips/feed?${params}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Falha ao carregar feed');
      const data = await res.json();

      setState((s) => ({
        clips: isMore ? [...s.clips, ...data.clips] : data.clips,
        trending: data.trending || s.trending,
        nextCursor: data.nextCursor,
        loading: false,
        error: null,
      }));
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
    } finally {
      loadingMore.current = false;
    }
  }, [email]);

  const loadMore = useCallback(() => {
    if (!stateRef.current.nextCursor || loadingMore.current) return;
    fetchFeed(stateRef.current.nextCursor);
  }, [fetchFeed]);

  const reload = useCallback(() => fetchFeed(undefined, { silent: true }), [fetchFeed]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [reload]);

  return { ...state, reload: () => fetchFeed(), loadMore };
}

export async function clipAction(
  clipId: string,
  action: 'like' | 'unlike' | 'favorite' | 'unfavorite' | 'share' | 'view' | 'watch',
  payload: Record<string, unknown> = {}
) {
  const endpoints: Record<string, string> = {
    like: `/api/cineclips/${clipId}/like`,
    unlike: `/api/cineclips/${clipId}/like`,
    favorite: `/api/cineclips/${clipId}/favorite`,
    unfavorite: `/api/cineclips/${clipId}/favorite`,
    share: `/api/cineclips/${clipId}/share`,
    view: `/api/cineclips/${clipId}/view`,
    watch: `/api/cineclips/${clipId}/watch`,
  };

  const body: Record<string, unknown> = { ...payload };
  if (action === 'like') body.action = 'like';
  if (action === 'unlike') body.action = 'unlike';
  if (action === 'favorite') body.action = 'favorite';
  if (action === 'unfavorite') body.action = 'unfavorite';

  const res = await fetch(endpoints[action], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Ação falhou');
  return res.json();
}

export async function fetchHashtagClips(tag: string) {
  const clean = tag.replace(/^#/, '');
  const res = await fetch(`/api/cineclips/hashtag/${encodeURIComponent(clean)}`);
  if (!res.ok) throw new Error('Hashtag não encontrada');
  return res.json();
}

export async function postClipComment(clipId: string, email: string, nome: string, texto: string) {
  const res = await fetch(`/api/cineclips/${clipId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, nome, texto }),
  });
  if (!res.ok) throw new Error('Falha ao comentar');
  return res.json();
}

export async function fetchClipComments(clipId: string) {
  const res = await fetch(`/api/cineclips/${clipId}/comments`);
  if (!res.ok) throw new Error('Falha ao carregar comentários');
  return res.json();
}

export async function downloadClipVideo(clipId: string, options?: { adminEmail?: string }) {
  const endpoint = options?.adminEmail
    ? `/api/admin/cineclips/${clipId}/download`
    : `/api/cineclips/${clipId}/download`;

  const res = await fetch(endpoint, {
    headers: options?.adminEmail ? { 'x-admin-email': options.adminEmail } : undefined,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Falha ao baixar o vídeo.');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const disposition = res.headers.get('content-disposition') || '';
  const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
  link.download = match?.[1] || `cinereact-${clipId}.mp4`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function reportClip(
  clipId: string,
  email: string,
  nome: string,
  reason: string,
  details?: string
) {
  const res = await fetch(`/api/cineclips/${clipId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, nome, reason, details }),
  });
  if (!res.ok) throw new Error('Falha ao denunciar');
  return res.json();
}
