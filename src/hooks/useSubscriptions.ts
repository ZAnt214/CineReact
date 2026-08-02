import { useCallback, useEffect, useRef, useState } from 'react';
import type { SubscriberEntitlements, SubscriptionCheckout } from '../types/finance.ts';

export function useSubscriptions(email?: string, isLoggedIn?: boolean) {
  const [data, setData] = useState<SubscriberEntitlements | null>(null);
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
      const res = await fetch(`/api/subscriptions/me?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Falha ao carregar assinaturas');
      }
      setData(await res.json());
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
    const hasPending = data?.checkouts?.some((c) => c.status === 'pending');
    if (!hasPending) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(fetchStatus, 12000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [data?.checkouts, email, isLoggedIn, fetchStatus]);

  const startCheckout = useCallback(
    async (plan: 'exclusive' | 'global', creatorEmail?: string) => {
      if (!email || !isLoggedIn) return null;
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch('/api/subscriptions/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, plan, creatorEmail }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Não foi possível iniciar checkout');

        window.open(body.paymentLink, '_blank', 'noopener,noreferrer');
        await fetchStatus();
        return body.checkout as SubscriptionCheckout;
      } catch (err: any) {
        setError(err.message || 'Erro no checkout');
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [email, isLoggedIn, fetchStatus]
  );

  const confirmPaid = useCallback(
    async (checkoutId: string) => {
      if (!email || !isLoggedIn) return false;
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch(`/api/subscriptions/checkouts/${checkoutId}/confirm-paid`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const body = await res.json();
        if (!res.ok && !body.pending) throw new Error(body.error || 'Erro ao confirmar');
        await fetchStatus();
        return !!body.activated;
      } catch (err: any) {
        setError(err.message || 'Erro ao confirmar');
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [email, isLoggedIn, fetchStatus]
  );

  const cancelSub = useCallback(
    async (subscriptionId: string) => {
      if (!email || !isLoggedIn) return false;
      setSubmitting(true);
      try {
        const res = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Erro ao cancelar');
        await fetchStatus();
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [email, isLoggedIn, fetchStatus]
  );

  return {
    data,
    loading,
    submitting,
    error,
    refresh: fetchStatus,
    startCheckout,
    confirmPaid,
    cancelSub,
  };
}
