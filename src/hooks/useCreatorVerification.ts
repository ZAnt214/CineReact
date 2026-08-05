import { useCallback, useEffect, useRef, useState } from 'react';
import type { CreatorVerificationRequest } from '../types/creatorVerification.ts';
import { apiFetch } from '../utils/apiClient.ts';

interface CreatorVerificationStatus {
  isVerifiedCreator: boolean;
  request: CreatorVerificationRequest | null;
}

export function useCreatorVerificationStatus(email?: string, isLoggedIn?: boolean) {
  const [data, setData] = useState<CreatorVerificationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!email || !isLoggedIn) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/creator-verification/me?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Falha ao carregar status');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [email, isLoggedIn]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!email || !isLoggedIn) return;
    const shouldPoll = data?.request?.status === 'pending' && !data.isVerifiedCreator;
    if (!shouldPoll) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(fetchStatus, 15000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [data?.request?.status, data?.isVerifiedCreator, email, isLoggedIn, fetchStatus]);

  const startVerification = useCallback(
    async (youtubeChannelUrl: string) => {
      if (!email || !isLoggedIn) return null;
      setSubmitting(true);
      setError(null);
      try {
        const res = await apiFetch('/api/creator-verification/request', {
          method: 'POST',
          body: JSON.stringify({ email, youtubeChannelUrl }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Não foi possível iniciar a verificação');

        await fetchStatus();
        return body.request as CreatorVerificationRequest;
      } catch (err: any) {
        setError(err.message || 'Erro ao iniciar verificação');
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [email, isLoggedIn, fetchStatus]
  );

  const checkDescription = useCallback(
    async (requestId: string) => {
      if (!email || !isLoggedIn) return false;
      setChecking(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/creator-verification/${requestId}/check-description`, {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
        const body = await res.json();
        if (!res.ok) {
          if (body.request) {
            setData((prev) =>
              prev ? { ...prev, request: body.request } : prev
            );
          }
          throw new Error(body.error || 'Código ainda não encontrado na descrição');
        }
        await fetchStatus();
        return true;
      } catch (err: any) {
        setError(err.message || 'Erro ao verificar descrição');
        return false;
      } finally {
        setChecking(false);
      }
    },
    [email, isLoggedIn, fetchStatus]
  );

  return {
    data,
    loading,
    submitting,
    checking,
    error,
    refresh: fetchStatus,
    startVerification,
    checkDescription,
  };
}
