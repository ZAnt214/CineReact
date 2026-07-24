import { localDb } from '../db/local_db.ts';
import {
  buildLeaderboard,
  enrichProfileResponse,
  getUserRank,
  processGamificationEvent,
  spendSpotlight,
  type ProcessEventMeta,
} from './engine.ts';
import type { GamificationEventType, LeaderboardType } from '../types/gamification.ts';

export function handleGamificationEvent(
  email: string,
  eventType: GamificationEventType,
  meta: ProcessEventMeta = {}
) {
  if (!email) return null;
  const profile = localDb.getGamificationProfile(email);
  const reward = processGamificationEvent(profile, eventType, meta);
  localDb.saveGamificationProfile(profile);
  return reward;
}

export function getGamificationMe(email: string) {
  const profile = localDb.getGamificationProfile(email);
  const allProfiles = localDb.getAllGamificationProfiles();
  const enriched = enrichProfileResponse(profile);

  const usernames: Record<string, { username: string; avatar?: string }> = {};
  for (const u of localDb.getUsuarios()) {
    usernames[u.email.toLowerCase()] = { username: u.username, avatar: u.avatar };
  }

  const rankTypes: LeaderboardType[] = ['xp', 'influence', 'streak', 'watch_time', 'comments', 'discoverers', 'curators'];
  const rankPositions: Partial<Record<LeaderboardType, number>> = {};
  for (const t of rankTypes) {
    rankPositions[t] = getUserRank(allProfiles, email, t);
  }

  return { ...enriched, rankPositions };
}

export function getGamificationLeaderboard(type: LeaderboardType, limit = 20) {
  const profiles = localDb.getAllGamificationProfiles();
  const usernames: Record<string, { username: string; avatar?: string }> = {};
  for (const u of localDb.getUsuarios()) {
    usernames[u.email.toLowerCase()] = { username: u.username, avatar: u.avatar };
  }

  return buildLeaderboard(profiles, usernames, type, limit);
}

export function purchaseCosmetic(email: string, cosmeticId: string) {
  const profile = localDb.getGamificationProfile(email);
  const result = spendSpotlight(profile, cosmeticId);
  if (result.success) localDb.saveGamificationProfile(profile);
  return { ...result, profile };
}

export function registerGamificationRoutes(app: import('express').Express) {
  app.get('/api/gamification/me', (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) return res.status(400).json({ error: 'Email requerido.' });
      res.json(getGamificationMe(email));
    } catch (error) {
      console.error('Erro gamification/me:', error);
      res.status(500).json({ error: 'Erro ao carregar gamificação.' });
    }
  });

  app.post('/api/gamification/event', (req, res) => {
    try {
      const { email, eventType, meta } = req.body;
      if (!email || !eventType) return res.status(400).json({ error: 'Parâmetros inválidos.' });
      const reward = handleGamificationEvent(email, eventType, meta || {});
      const me = getGamificationMe(email);
      res.json({ reward, ...me });
    } catch (error) {
      console.error('Erro gamification/event:', error);
      res.status(500).json({ error: 'Erro ao processar evento.' });
    }
  });

  app.get('/api/gamification/leaderboard', (req, res) => {
    try {
      const type = (req.query.type as LeaderboardType) || 'xp';
      const limit = parseInt(req.query.limit as string) || 20;
      res.json(getGamificationLeaderboard(type, limit));
    } catch (error) {
      console.error('Erro leaderboard:', error);
      res.status(500).json({ error: 'Erro ao carregar ranking.' });
    }
  });

  app.post('/api/gamification/purchase', (req, res) => {
    try {
      const { email, cosmeticId } = req.body;
      if (!email || !cosmeticId) return res.status(400).json({ error: 'Parâmetros inválidos.' });
      const result = purchaseCosmetic(email, cosmeticId);
      if (!result.success) return res.status(400).json(result);
      res.json(result);
    } catch (error) {
      console.error('Erro purchase:', error);
      res.status(500).json({ error: 'Erro na compra.' });
    }
  });

  app.post('/api/gamification/equip', (req, res) => {
    try {
      const { email, cosmeticId } = req.body;
      if (!email || !cosmeticId) return res.status(400).json({ error: 'Parâmetros inválidos.' });
      const result = purchaseCosmetic(email, cosmeticId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao equipar item.' });
    }
  });
}
