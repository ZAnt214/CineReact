import { useCallback, useEffect, useState } from 'react';
import type { GamificationMeResponse, GamificationReward, LeaderboardEntry, LeaderboardType } from '../types/gamification.ts';
import type { GamificationEventType } from '../types/gamification.ts';

interface UseGamificationOptions {
  email?: string;
  enabled?: boolean;
}

export function useGamification({ email, enabled = true }: UseGamificationOptions) {
  const [data, setData] = useState<GamificationMeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingReward, setPendingReward] = useState<GamificationReward | null>(null);
  const [leaderboards, setLeaderboards] = useState<Partial<Record<LeaderboardType, LeaderboardEntry[]>>>({});

  const refresh = useCallback(async () => {
    if (!email || !enabled) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/gamification/me?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Erro ao carregar gamificação:', e);
    } finally {
      setLoading(false);
    }
  }, [email, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const trackEvent = useCallback(
    async (eventType: GamificationEventType, meta: Record<string, unknown> = {}) => {
      if (!email) return null;
      try {
        const res = await fetch('/api/gamification/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, eventType, meta }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.reward && (json.reward.xp > 0 || json.reward.spotlight > 0 || json.reward.achievements?.length)) {
            setPendingReward(json.reward);
          }
          setData(json);
          return json.reward as GamificationReward;
        }
      } catch (e) {
        console.error('Erro ao registrar evento:', e);
      }
      return null;
    },
    [email]
  );

  const loadLeaderboard = useCallback(async (type: LeaderboardType) => {
    try {
      const res = await fetch(`/api/gamification/leaderboard?type=${type}&limit=15`);
      if (res.ok) {
        const json = await res.json();
        setLeaderboards((prev) => ({ ...prev, [type]: json }));
        return json as LeaderboardEntry[];
      }
    } catch (e) {
      console.error('Erro leaderboard:', e);
    }
    return [];
  }, []);

  const purchaseCosmetic = useCallback(
    async (cosmeticId: string) => {
      if (!email) return false;
      try {
        const res = await fetch('/api/gamification/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, cosmeticId }),
        });
        if (res.ok) {
          await refresh();
          return true;
        }
      } catch (e) {
        console.error('Erro na compra:', e);
      }
      return false;
    },
    [email, refresh]
  );

  const clearPendingReward = useCallback(() => setPendingReward(null), []);

  return {
    data,
    loading,
    refresh,
    trackEvent,
    loadLeaderboard,
    leaderboards,
    purchaseCosmetic,
    pendingReward,
    clearPendingReward,
  };
}
