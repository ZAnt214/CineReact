import { useCallback, useEffect, useRef, useState } from 'react';
import type { DonationRequest } from '../types/donations.ts';
import { DONATION_MP_LINK } from '../types/donations.ts';

interface DonationStatus {
  isDonor: boolean;
  request: DonationRequest | null;
}

export function useDonationStatus(email?: string, isLoggedIn?: boolean) {
  const [data, setData] = useState<DonationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!email || !isLoggedIn) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/donations/me?email=${encodeURIComponent(email)}`);
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
    const shouldPoll = data?.request?.status === 'pending' && !data.isDonor;
    if (!shouldPoll) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(fetchStatus, 12000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [data?.request?.status, data?.isDonor, email, isLoggedIn, fetchStatus]);

  const startDonation = useCallback(async () => {
    if (!email || !isLoggedIn) return null;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/donations/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Não foi possível iniciar a doação');

      window.open(body.paymentLink || DONATION_MP_LINK, '_blank', 'noopener,noreferrer');
      await fetchStatus();
      return body.request as DonationRequest;
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar doação');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [email, isLoggedIn, fetchStatus]);

  return {
    data,
    loading,
    submitting,
    error,
    refresh: fetchStatus,
    startDonation,
  };
}
