import { useCallback, useState } from 'react';
import { adminFetch } from '../../utils/adminApi.ts';

export function useAdminApi(adminEmail: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T,>(url: string, options: RequestInit = {}): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(adminEmail, url, options);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Erro na requisição');
        return null;
      }
      return data as T;
    } catch {
      setError('Falha de conexão');
      return null;
    } finally {
      setLoading(false);
    }
  }, [adminEmail]);

  return { request, loading, error, setError };
}
