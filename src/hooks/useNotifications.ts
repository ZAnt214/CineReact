import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Notificacao } from '../types.ts';
import { apiFetch } from '../utils/apiClient.ts';

const POLL_INTERVAL_MS = 30_000;

interface UseNotificationsOptions {
  email?: string;
  isOpen?: boolean;
}

export function useNotifications({ email, isOpen = false }: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  const buildUrl = useCallback(() => {
    return email
      ? `/api/notificacoes?email=${encodeURIComponent(email)}`
      : '/api/notificacoes';
  }, [email]);

  const fetchNotifications = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      const res = await apiFetch(buildUrl()).catch(() => null);
      if (!res?.ok || requestId !== requestIdRef.current) return;

      const data = (await res.json().catch(() => [])) as Notificacao[];
      if (requestId !== requestIdRef.current) return;

      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [buildUrl]);

  useEffect(() => {
    setLoading(true);
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isOpen) return;
    fetchNotifications();
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    const poll = () => {
      if (document.visibilityState !== 'visible') return;
      fetchNotifications();
    };

    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.reduce((count, item) => count + (item.lida ? 0 : 1), 0),
    [notifications]
  );

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, lida: true } : item))
    );

    try {
      await apiFetch(`/api/notificacoes/${id}/ler`, { method: 'POST' });
    } catch (error) {
      console.error(error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((item) => !item.lida).map((item) => item.id);
    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map((item) => ({ ...item, lida: true })));

    try {
      await Promise.all(
        unreadIds.map((id) => apiFetch(`/api/notificacoes/${id}/ler`, { method: 'POST' }))
      );
    } catch (error) {
      console.error(error);
      fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  const clearNotifications = useCallback(async () => {
    const previous = notifications;
    setNotifications([]);

    try {
      await apiFetch(buildUrl(), { method: 'DELETE' });
    } catch (error) {
      console.error(error);
      setNotifications(previous);
    }
  }, [buildUrl, notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}
