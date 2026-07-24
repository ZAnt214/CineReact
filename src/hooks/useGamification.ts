import { useCallback, useEffect, useState } from 'react';
import type {
  GamificationMeResponse,
  GamificationReward,
  LeaderboardEntry,
  LeaderboardType,
  ProfileLoadout,
} from '../types/gamification.ts';
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
      if (res.ok) setData(await res.json());
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
          if (
            json.reward &&
            (json.reward.xp > 0 ||
              json.reward.spotlight > 0 ||
              json.reward.achievements?.length ||
              json.reward.unlockedItems?.length)
          ) {
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

  const apiAction = useCallback(
    async (endpoint: string, body: Record<string, unknown>) => {
      if (!email) return false;
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, ...body }),
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
          return true;
        }
      } catch (e) {
        console.error(`Erro ${endpoint}:`, e);
      }
      return false;
    },
    [email]
  );

  const purchaseItem = useCallback((itemId: string) => apiAction('/api/gamification/purchase', { itemId }), [apiAction]);
  const equipItem = useCallback((itemId: string) => apiAction('/api/gamification/equip', { itemId }), [apiAction]);
  const unequipItem = useCallback((itemId: string) => apiAction('/api/gamification/unequip', { itemId }), [apiAction]);
  const saveLoadout = useCallback(
    (loadout: ProfileLoadout) => apiAction('/api/gamification/loadout', { loadout }),
    [apiAction]
  );
  const redeemCode = useCallback((code: string) => apiAction('/api/gamification/redeem', { code }), [apiAction]);

  const clearPendingReward = useCallback(() => setPendingReward(null), []);

  return {
    data,
    loading,
    refresh,
    trackEvent,
    loadLeaderboard,
    leaderboards,
    purchaseItem,
    equipItem,
    unequipItem,
    saveLoadout,
    redeemCode,
    pendingReward,
    clearPendingReward,
    purchaseCosmetic: purchaseItem,
  };
}
