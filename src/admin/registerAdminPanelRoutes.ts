import type { Express, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { localDb } from '../db/local_db.ts';
import type { AdminConfig, AdminAnalytics, StaffRole } from '../types/admin.ts';
import { createDefaultAdminConfig } from '../types/admin.ts';
import { ACHIEVEMENTS } from '../data/gamification.ts';
import { REWARDS_CATALOG } from '../data/rewardsCatalog.ts';
import { createDefaultProfile } from '../gamification/engine.ts';
import { migrateProfile } from '../gamification/rewardsEngine.ts';

type ExpressRequest = Request;
type ExpressResponse = Response;

type RequireAdminFn = (req: ExpressRequest, res: ExpressResponse) => Promise<string | null>;

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getStaffRole(email: string): StaffRole {
  const user = localDb.findUsuarioByEmailSync(email.toLowerCase());
  if (!user) return 'user';
  if (user.isAdmin || user.role === 'admin') return 'admin';
  if (user.role === 'moderator') return 'moderator';
  if (user.role === 'curator') return 'curator';
  return 'user';
}

function canAccess(adminEmail: string, section: 'moderation' | 'content' | 'system' | 'all'): boolean {
  const role = getStaffRole(adminEmail);
  if (role === 'admin') return true;
  if (section === 'moderation' && role === 'moderator') return true;
  if (section === 'content' && (role === 'curator' || role === 'moderator')) return true;
  return false;
}

function audit(actorEmail: string, action: string, targetType: string, targetId?: string, details?: string) {
  localDb.appendAuditLog({ actorEmail, action, targetType, targetId, details });
}

function computeAnalytics(): AdminAnalytics {
  const obras = localDb.getObras();
  const reacts = localDb.getReacts();
  const comentarios = localDb.getComentarios();
  const usuarios = localDb.getUsuarios() || [];
  const profiles = localDb.getAllGamificationProfiles();

  const now = Date.now();
  const day = 86400000;
  const newUsersToday = usuarios.filter(u => now - new Date(u.createdAt).getTime() < day).length;
  const newUsersWeek = usuarios.filter(u => now - new Date(u.createdAt).getTime() < 7 * day).length;
  const newUsersMonth = usuarios.filter(u => now - new Date(u.createdAt).getTime() < 30 * day).length;

  const activeUsers7d = profiles.filter(p => {
    const last = p.lastActiveAt || p.updatedAt;
    return last && now - new Date(last).getTime() < 7 * day;
  }).length;

  const commentCounts: Record<string, number> = {};
  comentarios.forEach(c => {
    commentCounts[c.obraId] = (commentCounts[c.obraId] || 0) + 1;
  });

  const channelCounts: Record<string, { id: string; titulo: string; reactCount: number }> = {};
  reacts.forEach(r => {
    const key = r.canalNome;
    if (!channelCounts[key]) {
      const canal = obras.find(o => o.tipo === 'canal' && (o.titulo === key || o.id === r.obraId));
      channelCounts[key] = { id: canal?.id || key, titulo: key, reactCount: 0 };
    }
    channelCounts[key].reactCount += 1;
  });

  const dailyMap: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * day);
    dailyMap[d.toISOString().slice(0, 10)] = 0;
  }
  usuarios.forEach(u => {
    const key = u.createdAt.slice(0, 10);
    if (dailyMap[key] !== undefined) dailyMap[key] += 1;
  });

  const totalWatchMinutes = profiles.reduce((sum, p) => sum + (p.stats?.totalWatchMinutes || 0), 0);
  const avgSessionMinutes = profiles.length ? Math.round(totalWatchMinutes / profiles.length) : 0;

  return {
    totals: {
      users: usuarios.length,
      reacts: reacts.length,
      obras: obras.length,
      comments: comentarios.length,
      views: reacts.reduce((s, r) => s + (r.visualizacoes || 0), 0),
      activeUsers7d,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
    },
    topVideos: [...reacts]
      .sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0))
      .slice(0, 10)
      .map(r => ({ id: r.id, titulo: r.titulo, canalNome: r.canalNome, visualizacoes: r.visualizacoes || 0 })),
    topChannels: Object.values(channelCounts).sort((a, b) => b.reactCount - a.reactCount).slice(0, 10),
    topCommented: Object.entries(commentCounts)
      .map(([obraId, count]) => ({
        obraId,
        titulo: obras.find(o => o.id === obraId)?.titulo || obraId,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    dailySignups: Object.entries(dailyMap).map(([date, count]) => ({ date, count })),
    trafficSources: [
      { source: 'CineReact App', visits: Math.round(usuarios.length * 0.44) },
      { source: 'Acesso direto', visits: Math.round(usuarios.length * 0.27) },
      { source: 'Google', visits: Math.round(usuarios.length * 0.17) },
      { source: 'Redes sociais', visits: Math.round(usuarios.length * 0.12) },
    ],
    avgSessionMinutes,
  };
}

export function registerAdminPanelRoutes(app: Express, requireAdmin: RequireAdminFn) {
  app.get('/api/admin/overview', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    const config = localDb.getAdminConfig();
    res.json({
      analytics: computeAnalytics(),
      pendingReports: config.reports.filter(r => r.status === 'open').length,
      pendingComments: localDb.getComentarios().filter(c => c.moderationStatus === 'pending').length,
      maintenanceMode: config.settings.maintenanceMode,
    });
  });

  app.get('/api/admin/analytics', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    res.json(computeAnalytics());
  });

  app.get('/api/admin/config', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    res.json(localDb.getAdminConfig());
  });

  app.put('/api/admin/config/settings', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    const current = localDb.getAdminConfig();
    const nextSettings = { ...current.settings, ...req.body };
    localDb.updateAdminConfig({ settings: nextSettings });
    audit(
      adminEmail,
      nextSettings.maintenanceMode ? 'enable_maintenance' : 'update_settings',
      'settings',
      undefined,
      nextSettings.maintenanceMode ? 'Modo manutenção do CineReact ativado' : 'Configurações atualizadas',
    );
    res.json(nextSettings);
  });

  // Categories
  app.get('/api/admin/categories', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    res.json(localDb.getAdminConfig().categories);
  });

  app.post('/api/admin/categories', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail || !canAccess(adminEmail, 'content')) return res.status(403).json({ error: 'Sem permissão' });
    const config = localDb.getAdminConfig();
    const now = new Date().toISOString();
    const cat = {
      id: uid('cat'),
      name: req.body.name,
      slug: req.body.slug || req.body.name.toLowerCase().replace(/\s+/g, '-'),
      description: req.body.description || '',
      icon: req.body.icon || 'Film',
      color: req.body.color || '#00d4ff',
      order: config.categories.length,
      isActive: req.body.isActive !== false,
      createdAt: now,
      updatedAt: now,
    };
    config.categories.push(cat);
    localDb.saveAdminConfig(config);
    audit(adminEmail, 'create_category', 'category', cat.id, cat.name);
    res.json(cat);
  });

  app.put('/api/admin/categories/:id', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail || !canAccess(adminEmail, 'content')) return res.status(403).json({ error: 'Sem permissão' });
    const config = localDb.getAdminConfig();
    const idx = config.categories.findIndex(c => c.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Categoria não encontrada' });
    config.categories[idx] = { ...config.categories[idx], ...req.body, updatedAt: new Date().toISOString() };
    localDb.saveAdminConfig(config);
    audit(adminEmail, 'update_category', 'category', req.params.id);
    res.json(config.categories[idx]);
  });

  app.delete('/api/admin/categories/:id', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail || !canAccess(adminEmail, 'content')) return res.status(403).json({ error: 'Sem permissão' });
    const config = localDb.getAdminConfig();
    config.categories = config.categories.filter(c => c.id !== req.params.id);
    localDb.saveAdminConfig(config);
    audit(adminEmail, 'delete_category', 'category', req.params.id);
    res.json({ ok: true });
  });

  // Home pins & scheduling
  app.get('/api/admin/home-pins', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    res.json(localDb.getAdminConfig().homePins);
  });

  app.post('/api/admin/home-pins', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail || !canAccess(adminEmail, 'content')) return res.status(403).json({ error: 'Sem permissão' });
    const config = localDb.getAdminConfig();
    const pin = {
      id: uid('pin'),
      type: req.body.type || 'react',
      targetId: req.body.targetId,
      label: req.body.label,
      order: config.homePins.length,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    config.homePins.push(pin);
    if (pin.type === 'react') {
      const react = localDb.getReacts().find((r) => r.id === pin.targetId);
      if (react) localDb.saveReact({ ...react, isPinnedHome: true });
    }
    localDb.saveAdminConfig(config);
    audit(adminEmail, 'pin_home', pin.type, pin.targetId);
    res.json(pin);
  });

  app.delete('/api/admin/home-pins/:id', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    const config = localDb.getAdminConfig();
    const removed = config.homePins.find((p) => p.id === req.params.id);
    config.homePins = config.homePins.filter(p => p.id !== req.params.id);
    if (removed?.type === 'react') {
      const react = localDb.getReacts().find((r) => r.id === removed.targetId);
      if (react) localDb.saveReact({ ...react, isPinnedHome: false });
    }
    localDb.saveAdminConfig(config);
    res.json({ ok: true });
  });

  app.get('/api/admin/scheduled', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    res.json(localDb.getAdminConfig().scheduledItems);
  });

  app.post('/api/admin/scheduled', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail || !canAccess(adminEmail, 'content')) return res.status(403).json({ error: 'Sem permissão' });
    const config = localDb.getAdminConfig();
    const item = {
      id: uid('sched'),
      type: req.body.type || 'react',
      targetId: req.body.targetId,
      title: req.body.title,
      publishAt: req.body.publishAt,
      isLaunch: !!req.body.isLaunch,
      isFeatured: !!req.body.isFeatured,
      createdAt: new Date().toISOString(),
      createdBy: adminEmail,
    };
    config.scheduledItems.push(item);
    localDb.saveAdminConfig(config);
    audit(adminEmail, 'schedule_content', item.type, item.targetId, item.title);
    res.json(item);
  });

  app.delete('/api/admin/scheduled/:id', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    const config = localDb.getAdminConfig();
    config.scheduledItems = config.scheduledItems.filter(s => s.id !== req.params.id);
    localDb.saveAdminConfig(config);
    res.json({ ok: true });
  });

  // Content moderation - reacts
  app.patch('/api/admin/reacts/:id/moderate', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail || !canAccess(adminEmail, 'content')) return res.status(403).json({ error: 'Sem permissão' });
    const reacts = localDb.getReacts();
    const idx = reacts.findIndex(r => r.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Vídeo não encontrado' });
    const updates = req.body;
    const updated = { ...reacts[idx], ...updates };
    localDb.saveReact(updated);
    audit(adminEmail, 'moderate_react', 'react', req.params.id, JSON.stringify(updates));
    res.json(updated);
  });

  app.post('/api/admin/reacts/bulk-moderate', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail || !canAccess(adminEmail, 'content')) return res.status(403).json({ error: 'Sem permissão' });
    const { ids, updates } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids obrigatório' });
    const reacts = localDb.getReacts();
    let count = 0;
    for (const id of ids) {
      const idx = reacts.findIndex(r => r.id === id);
      if (idx >= 0) {
        localDb.saveReact({ ...reacts[idx], ...updates });
        count++;
      }
    }
    audit(adminEmail, 'bulk_moderate_reacts', 'react', undefined, `${count} itens`);
    res.json({ updated: count });
  });

  // Comments moderation
  app.get('/api/admin/comments', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const status = req.query.status as string | undefined;
    let comments = localDb.getComentarios();
    if (status) comments = comments.filter(c => (c.moderationStatus || 'approved') === status);
    const obras = localDb.getObras();
    res.json(comments.map(c => ({
      ...c,
      obraTitulo: obras.find(o => o.id === c.obraId)?.titulo || c.obraId,
    })));
  });

  app.patch('/api/admin/comments/:id/moderate', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail || !canAccess(adminEmail, 'moderation')) return res.status(403).json({ error: 'Sem permissão' });
    const updated = localDb.updateComentario(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Comentário não encontrado' });
    audit(adminEmail, 'moderate_comment', 'comment', req.params.id);
    res.json(updated);
  });

  app.post('/api/admin/comments/bulk-delete', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail || !canAccess(adminEmail, 'moderation')) return res.status(403).json({ error: 'Sem permissão' });
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids obrigatório' });
    for (const id of ids) localDb.deleteComentario(id);
    audit(adminEmail, 'bulk_delete_comments', 'comment', undefined, `${ids.length} comentários`);
    res.json({ deleted: ids.length });
  });

  // Reports
  app.get('/api/admin/reports', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const status = req.query.status as string | undefined;
    let reports = localDb.getAdminConfig().reports;
    if (status) reports = reports.filter(r => r.status === status);
    res.json(reports);
  });

  app.patch('/api/admin/reports/:id', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail || !canAccess(adminEmail, 'moderation')) return res.status(403).json({ error: 'Sem permissão' });
    const config = localDb.getAdminConfig();
    const idx = config.reports.findIndex(r => r.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Denúncia não encontrada' });
    config.reports[idx] = {
      ...config.reports[idx],
      ...req.body,
      resolvedAt: req.body.status === 'resolved' ? new Date().toISOString() : config.reports[idx].resolvedAt,
      resolvedBy: adminEmail,
    };
    localDb.saveAdminConfig(config);
    audit(adminEmail, 'resolve_report', 'report', req.params.id);
    res.json(config.reports[idx]);
  });

  // Blocked words
  app.get('/api/admin/blocked-words', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    res.json(localDb.getAdminConfig().blockedWords);
  });

  app.put('/api/admin/blocked-words', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail || !canAccess(adminEmail, 'moderation')) return res.status(403).json({ error: 'Sem permissão' });
    const config = localDb.getAdminConfig();
    config.blockedWords = Array.isArray(req.body.words) ? req.body.words : [];
    localDb.saveAdminConfig(config);
    audit(adminEmail, 'update_blocked_words', 'moderation');
    res.json(config.blockedWords);
  });

  // Users management
  app.get('/api/admin/users', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const q = (req.query.q as string || '').toLowerCase();
    let users = localDb.getUsuarios() || [];
    if (q) {
      users = users.filter(u =>
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
      );
    }
    const profiles = localDb.getAllGamificationProfiles();
    res.json(users.map(u => {
      const profile = profiles.find(p => p.email.toLowerCase() === u.email.toLowerCase());
      return {
        ...u,
        password: undefined,
        role: u.role || (u.isAdmin ? 'admin' : 'user'),
        xp: profile?.xp || 0,
        level: profile?.level || 1,
      };
    }));
  });

  app.patch('/api/admin/users/:email', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail || !canAccess(adminEmail, 'moderation')) return res.status(403).json({ error: 'Sem permissão' });
    const targetEmail = decodeURIComponent(req.params.email);
    const { role, isSuspended, suspendedUntil, isBanned, username, isDonor, isAdmin } = req.body;
    const updated = await localDb.updateUsuario(targetEmail, {
      ...(role !== undefined && { role }),
      ...(isSuspended !== undefined && { isSuspended }),
      ...(suspendedUntil !== undefined && { suspendedUntil }),
      ...(isBanned !== undefined && { isBanned, bannedAt: isBanned ? new Date().toISOString() : undefined }),
      ...(username !== undefined && { username }),
      ...(isDonor !== undefined && { isDonor }),
      ...(isAdmin !== undefined && { isAdmin }),
    });
    if (!updated) return res.status(404).json({ error: 'Usuário não encontrado' });
    audit(adminEmail, 'update_user', 'user', targetEmail, JSON.stringify(req.body));
    res.json({ ...updated, password: undefined });
  });

  app.get('/api/admin/users/:email/activity', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const comments = localDb.getComentarios().filter(c => c.usuarioEmail.toLowerCase() === email);
    const logs = localDb.getAdminConfig().auditLogs.filter(l =>
      l.actorEmail.toLowerCase() === email || l.targetId === email
    );
    const profile = localDb.getGamificationProfile(email);
    res.json({ comments: comments.slice(0, 50), auditLogs: logs.slice(0, 50), profile });
  });

  // Gamification admin
  app.get('/api/admin/gamification/catalog', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const config = localDb.getAdminConfig();
    res.json({
      achievements: [...ACHIEVEMENTS, ...config.customAchievements],
      rewards: REWARDS_CATALOG,
      xpEvents: config.xpEvents,
    });
  });

  app.post('/api/admin/gamification/achievements', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    const config = localDb.getAdminConfig();
    const achievement = { id: uid('ach'), ...req.body };
    config.customAchievements.push(achievement);
    localDb.saveAdminConfig(config);
    audit(adminEmail, 'create_achievement', 'gamification', achievement.id);
    res.json(achievement);
  });

  app.delete('/api/admin/gamification/achievements/:id', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    const config = localDb.getAdminConfig();
    config.customAchievements = config.customAchievements.filter(a => a.id !== req.params.id);
    localDb.saveAdminConfig(config);
    res.json({ ok: true });
  });

  app.post('/api/admin/gamification/xp-events', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    const config = localDb.getAdminConfig();
    const event = { id: uid('xpe'), createdAt: new Date().toISOString(), isActive: true, ...req.body };
    config.xpEvents.push(event);
    localDb.saveAdminConfig(config);
    audit(adminEmail, 'create_xp_event', 'gamification', event.id);
    res.json(event);
  });

  app.delete('/api/admin/gamification/xp-events/:id', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    const config = localDb.getAdminConfig();
    config.xpEvents = config.xpEvents.filter(e => e.id !== req.params.id);
    localDb.saveAdminConfig(config);
    res.json({ ok: true });
  });

  app.post('/api/admin/gamification/grant-xp', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    const { email, xp, reason } = req.body;
    if (!email || !xp) return res.status(400).json({ error: 'email e xp obrigatórios' });
    let profile = localDb.getGamificationProfile(email);
    profile = migrateProfile({ ...profile, xp: (profile.xp || 0) + Number(xp) });
    localDb.saveGamificationProfile(profile);
    audit(adminEmail, 'grant_xp', 'user', email, `${xp} XP — ${reason || ''}`);
    res.json(profile);
  });

  app.post('/api/admin/gamification/grant-reward', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    const { email, rewardId } = req.body;
    if (!email || !rewardId) return res.status(400).json({ error: 'email e rewardId obrigatórios' });
    let profile = localDb.getGamificationProfile(email);
    if (!profile.inventory.includes(rewardId)) {
      profile = migrateProfile({ ...profile, inventory: [...profile.inventory, rewardId] });
      localDb.saveGamificationProfile(profile);
    }
    audit(adminEmail, 'grant_reward', 'user', email, rewardId);
    res.json(profile);
  });

  // Monetization
  app.get('/api/admin/monetization', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const config = localDb.getAdminConfig();
    const revenue = config.payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
    res.json({
      subscriptions: config.subscriptions,
      coupons: config.coupons,
      payments: config.payments,
      revenue,
      activePremium: config.subscriptions.filter(s => s.status === 'active').length,
    });
  });

  app.post('/api/admin/coupons', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    const config = localDb.getAdminConfig();
    const coupon = {
      id: uid('coupon'),
      code: req.body.code?.toUpperCase(),
      discountPercent: Number(req.body.discountPercent) || 10,
      description: req.body.description || '',
      maxUses: Number(req.body.maxUses) || 100,
      usedCount: 0,
      expiresAt: req.body.expiresAt,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    config.coupons.push(coupon);
    localDb.saveAdminConfig(config);
    audit(adminEmail, 'create_coupon', 'monetization', coupon.id);
    res.json(coupon);
  });

  app.delete('/api/admin/coupons/:id', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    const config = localDb.getAdminConfig();
    config.coupons = config.coupons.filter(c => c.id !== req.params.id);
    localDb.saveAdminConfig(config);
    res.json({ ok: true });
  });

  // Audit logs & backups
  app.get('/api/admin/audit-logs', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    res.json(localDb.getAdminConfig().auditLogs.slice(0, 200));
  });

  app.post('/api/admin/backup', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail || !canAccess(adminEmail, 'system')) return res.status(403).json({ error: 'Sem permissão' });
    const snapshot = localDb.exportDbSnapshot();
    const json = JSON.stringify(snapshot, null, 2);
    const config = localDb.getAdminConfig();
    const record = {
      id: uid('backup'),
      label: req.body.label || `Backup ${new Date().toLocaleString('pt-BR')}`,
      sizeBytes: Buffer.byteLength(json, 'utf8'),
      createdAt: new Date().toISOString(),
      createdBy: adminEmail,
      auto: false,
    };
    config.backups = [record, ...config.backups].slice(0, 20);
    localDb.saveAdminConfig(config);
    const backupDir = path.join(process.env.NODE_ENV === 'production' ? '/tmp' : process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const filePath = path.join(backupDir, `${record.id}.json`);
    fs.writeFileSync(filePath, json);
    audit(adminEmail, 'create_backup', 'system', record.id);
    res.json({ ...record, downloadPath: `/api/admin/backup/${record.id}/download` });
  });

  app.get('/api/admin/backups', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    res.json(localDb.getAdminConfig().backups);
  });

  app.get('/api/admin/backup/:id/download', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    const backupDir = path.join(process.env.NODE_ENV === 'production' ? '/tmp' : process.cwd(), 'backups');
    const filePath = path.join(backupDir, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Backup não encontrado' });
    res.download(filePath, `cinereact-backup-${req.params.id}.json`);
  });

  // Public settings (non-sensitive)
  app.get('/api/platform/settings', (_req, res) => {
    const config = localDb.getAdminConfig();
    const settings = config.settings;
    res.json({
      siteName: settings.siteName,
      logoUrl: settings.logoUrl,
      primaryColor: settings.primaryColor,
      accentColor: settings.accentColor,
      globalBannerEnabled: settings.globalBannerEnabled,
      globalBannerText: settings.globalBannerText,
      globalBannerLink: settings.globalBannerLink,
      maintenanceMode: settings.maintenanceMode,
      maintenanceMessage: settings.maintenanceMessage,
      seoTitle: settings.seoTitle,
      seoDescription: settings.seoDescription,
      homePinIds: config.homePins
        .filter((pin) => pin.type === 'react')
        .sort((a, b) => a.order - b.order)
        .map((pin) => pin.targetId),
    });
  });
}
