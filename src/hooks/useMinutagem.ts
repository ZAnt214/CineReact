import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../utils/apiClient.ts';
import type {
  MinutagemAnalysisRequest,
  MinutagemContentType,
  MinutagemMarker,
  MinutagemMarkerSubmission,
} from '../types/minutagem.ts';

export interface MinutagemCatalogEntry {
  obraId: string;
  obraTitulo: string;
  tipo: string;
  markerCount: number;
  poster?: string;
  banner?: string;
}

export interface MinutagemMeStatus {
  pendingSubmission: MinutagemMarkerSubmission | null;
  pendingAnalysis: MinutagemAnalysisRequest | null;
  submissions: MinutagemMarkerSubmission[];
  analysisRequests: MinutagemAnalysisRequest[];
}

export function useMinutagemCatalog() {
  const [catalog, setCatalog] = useState<MinutagemCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/minutagem/catalog');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Falha ao carregar catálogo');
      setCatalog(data.catalog || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { catalog, loading, error, refresh };
}

export function useMinutagemMarkers(obraId?: string) {
  const [markers, setMarkers] = useState<MinutagemMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!obraId) {
      setMarkers([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/minutagem/markers?obraId=${encodeURIComponent(obraId)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Falha ao carregar minutagem');
      setMarkers(data.markers || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { markers, loading, error, refresh };
}

export function useMinutagemMe(isLoggedIn?: boolean) {
  const [data, setData] = useState<MinutagemMeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isLoggedIn) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/minutagem/me');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Falha ao carregar status');
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submitMarker = useCallback(
    async (payload: {
      email: string;
      obraId: string;
      tipoConteudo: MinutagemContentType;
      label: string;
      minutagem: string;
      episodioNum?: number;
    }) => {
      setSubmitting(true);
      setError(null);
      try {
        const res = await apiFetch('/api/minutagem/markers/submit', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Não foi possível enviar');
        await refresh();
        return json;
      } catch (err: any) {
        setError(err.message || 'Erro ao enviar');
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const requestAnalysis = useCallback(
    async (payload: {
      email: string;
      obraTitulo: string;
      obraId?: string;
      tipoObra?: 'filme' | 'serie' | 'anime';
      mensagem?: string;
    }) => {
      setSubmitting(true);
      setError(null);
      try {
        const res = await apiFetch('/api/minutagem/analysis/request', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Não foi possível enviar pedido');
        await refresh();
        return json;
      } catch (err: any) {
        setError(err.message || 'Erro ao enviar pedido');
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  return {
    data,
    loading,
    submitting,
    error,
    refresh,
    submitMarker,
    requestAnalysis,
  };
}
