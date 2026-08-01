import { localDb } from '../db/local_db.ts';
import { buildLeaderboard,
  enrichProfileResponse,
  getUserRank,
  processGamificationEvent,
  type ProcessEventMeta,
} from './engine.ts';
import {
  findOfficialCreatorEmailForChannel,
  getPublicUserProfile,
} from './publicUserProfile.ts';
import { resolvePublicProfileDisplay, resolveUserProfileDisplay, applyDonorLoadout } from './profileDisplay.ts';
import {
  equipReward,
  ensureOwnerFullUnlock,
  migrateProfile,
  purchaseReward,
  redeemPromoCode,
  saveLoadout,
  unequipReward,
} from './rewardsEngine.ts';
import type { GamificationEventType, LeaderboardType, ProfileLoadout } from '../types/gamification.ts';

export function handleGamificationEvent(
  email: string,
  eventType: GamificationEventType,
  meta: ProcessEventMeta = {}
) {
  if (!email) return null;
  const profile = localDb.getGamificationProfile(email);
  migrateProfile(profile);
  const reward = processGamificationEvent(profile, eventType, meta);
  localDb.saveGamificationProfile(profile);
  return reward;
}

export function getGamificationMe(email: string) {
  const profile = localDb.getGamificationProfile(email);
  migrateProfile(profile);
  const account = localDb.findUsuarioByEmailSync(email);
  ensureOwnerFullUnlock(profile);
  localDb.saveGamificationProfile(profile);
  const allProfiles = localDb.getAllGamificationProfiles();
  const enriched = enrichProfileResponse(profile);
  if (account?.isDonor) {
    enriched.profile = {
      ...enriched.profile,
      loadout: applyDonorLoadout(enriched.profile.loadout, true),
    };
  }

  const rankTypes: LeaderboardType[] = ['xp', 'influence', 'streak', 'watch_time', 'comments', 'discoverers', 'curators'];
  const rankPositions: Partial<Record<LeaderboardType, number>> = {};
  for (const t of rankTypes) {
    rankPositions[t] = getUserRank(allProfiles, email, t);
  }

  return { ...enriched, rankPositions };
}

export function getGamificationLeaderboard(type: LeaderboardType, limit = 20) {
  const profiles = localDb.getAllGamificationProfiles().map((p) => migrateProfile(p));
  const usernames: Record<string, { username: string; avatar?: string }> = {};
  for (const u of localDb.getUsuarios()) {
    usernames[u.email.toLowerCase()] = { username: u.username, avatar: u.avatar };
  }
  return buildLeaderboard(profiles, usernames, type, limit);
}

export function getPublicProfileForEmail(email: string) {
  const account = localDb.findUsuarioByEmailSync(email);
  const publicProfile = getPublicUserProfile(email);
  if (publicProfile) return publicProfile.profileDisplay;
  return resolveUserProfileDisplay(undefined, !!account?.isDonor);
}

/** Enriquece comentários com cosméticos públicos do autor — mesma visão para todos os espectadores. */
export function enrichCommentAuthorProfile<T extends { usuarioEmail: string }>(comment: T) {
  const publicProfile = getPublicUserProfile(comment.usuarioEmail);
  const userAcct = localDb.findUsuarioByEmailSync(comment.usuarioEmail);
  return {
    ...comment,
    isDonor: !!publicProfile?.isDonor || !!userAcct?.isDonor,
    avatar: userAcct?.avatar || publicProfile?.avatar || '',
    profileDisplay: publicProfile?.profileDisplay ?? getPublicProfileForEmail(comment.usuarioEmail),
    publicProfile: publicProfile ?? undefined,
  };
}

export function purchaseCosmetic(email: string, itemId: string) {
  const profile = localDb.getGamificationProfile(email);
  const result = purchaseReward(profile, itemId);
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

  app.get('/api/gamification/profile/:email', (req, res) => {
    try {
      const email = decodeURIComponent(req.params.email || '');
      if (!email) return res.status(400).json({ error: 'Email requerido.' });
      const profile = getPublicUserProfile(email);
      if (!profile) return res.status(404).json({ error: 'Perfil não encontrado.' });
      res.json(profile);
    } catch (error) {
      console.error('Erro gamification/profile:', error);
      res.status(500).json({ error: 'Erro ao carregar perfil público.' });
    }
  });

  app.post('/api/gamification/purchase', (req, res) => {
    try {
      const { email, itemId, cosmeticId } = req.body;
      const id = itemId || cosmeticId;
      if (!email || !id) return res.status(400).json({ error: 'Parâmetros inválidos.' });
      const result = purchaseCosmetic(email, id);
      if (!result.success) return res.status(400).json(result);
      res.json({ ...result, ...getGamificationMe(email) });
    } catch (error) {
      console.error('Erro purchase:', error);
      res.status(500).json({ error: 'Erro na compra.' });
    }
  });

  app.post('/api/gamification/equip', (req, res) => {
    try {
      const { email, itemId } = req.body;
      if (!email || !itemId) return res.status(400).json({ error: 'Parâmetros inválidos.' });
      const profile = localDb.getGamificationProfile(email);
      const result = equipReward(profile, itemId);
      if (result.success) localDb.saveGamificationProfile(profile);
      res.json({ ...result, ...getGamificationMe(email) });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao equipar item.' });
    }
  });

  app.post('/api/gamification/unequip', (req, res) => {
    try {
      const { email, itemId } = req.body;
      if (!email || !itemId) return res.status(400).json({ error: 'Parâmetros inválidos.' });
      const profile = localDb.getGamificationProfile(email);
      const result = unequipReward(profile, itemId);
      if (result.success) localDb.saveGamificationProfile(profile);
      res.json({ ...result, ...getGamificationMe(email) });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao desequipar item.' });
    }
  });

  app.post('/api/gamification/loadout', (req, res) => {
    try {
      const { email, loadout } = req.body as { email: string; loadout: ProfileLoadout };
      if (!email || !loadout) return res.status(400).json({ error: 'Parâmetros inválidos.' });
      const profile = localDb.getGamificationProfile(email);
      const result = saveLoadout(profile, loadout);
      if (!result.success) return res.status(400).json(result);
      localDb.saveGamificationProfile(profile);
      res.json({ ...result, ...getGamificationMe(email) });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao salvar personalização.' });
    }
  });

  app.post('/api/gamification/redeem', (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) return res.status(400).json({ error: 'Parâmetros inválidos.' });
      const profile = localDb.getGamificationProfile(email);
      const result = redeemPromoCode(profile, code);
      if (!result.success) return res.status(400).json(result);
      localDb.saveGamificationProfile(profile);
      res.json({ ...result, ...getGamificationMe(email) });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao resgatar código.' });
    }
  });
}
