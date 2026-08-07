import { useCallback, useState } from 'react';
import { adminFetch } from '../../utils/adminApi.ts';
import { useAdminToast } from '../components/AdminToast.tsx';

export function useAdminApi(adminEmail: string) {
  const { showToast } = useAdminToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T,>(
    url: string,
    options: RequestInit = {},
    successMessage?: string,
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(adminEmail, url, options);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.error || 'Erro na requisição';
        setError(message);
        showToast('error', message);
        return null;
      }
      if (successMessage) showToast('success', successMessage);
      return data as T;
    } catch {
      const message = 'Falha de conexão';
      setError(message);
      showToast('error', message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [adminEmail, showToast]);

  return { request, loading, error, setError };
}
