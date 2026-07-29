import { useCallback, useEffect, useState } from 'react';

export interface PublicPlatformSettings {
  siteName: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  globalBannerEnabled: boolean;
  globalBannerText: string;
  globalBannerLink: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  seoTitle: string;
  seoDescription: string;
}

export function usePlatformSettings() {
  const [settings, setSettings] = useState<PublicPlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/platform/settings');
      if (!res.ok) return;
      const data = await res.json();
      setSettings(data);
    } catch {
      // mantém último estado válido
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { settings, loading, refresh };
}
