import type { Express, Request, Response } from 'express';
import { localDb } from '../db/local_db.ts';
import {
  CREATOR_VERIFICATION_WINDOW_HOURS,
  type CreatorVerificationRequest,
} from '../types/creatorVerification.ts';
import { grantCreatorVerificationBenefits } from '../gamification/creatorVerificationRewards.ts';
import { isVerifiedCreatorLoadout } from '../gamification/verifiedCreator.ts';
import { migrateProfile } from '../gamification/rewardsEngine.ts';

type RequireAdminFn = (req: Request, res: Response) => Promise<string | null>;

type ResolvedChannel = {
  channelId: string;
  titulo: string;
  sinopse: string;
};

type ResolveYouTubeChannelFn = (url: string) => Promise<ResolvedChannel | null>;

function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `CINEREACT-${suffix}`;
}

function normalizeChannelUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http')) return trimmed.split('?')[0];
  const handle = trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
  return `https://www.youtube.com/${handle}`;
}

function descriptionContainsCode(description: string, code: string): boolean {
  return description.toUpperCase().includes(code.toUpperCase());
}

function expireStaleRequests() {
  localDb.expireStaleCreatorVerificationRequests();
}

export function registerCreatorVerificationRoutes(
  app: Express,
  requireAdmin: RequireAdminFn,
  resolveYouTubeChannel: ResolveYouTubeChannelFn
) {
  app.post('/api/creator-verification/request', async (req, res) => {
    try {
      expireStaleRequests();

      const { email, youtubeChannelUrl } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: 'E-mail é obrigatório.' });
      }
      if (!youtubeChannelUrl?.trim()) {
        return res.status(400).json({ error: 'Informe o link ou @ do seu canal no YouTube.' });
      }

      const user = localDb.findUsuarioByEmailSync(String(email));
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado. Faça login com sua conta.' });
      }

      const profile = migrateProfile(localDb.getGamificationProfile(user.email));
      if (isVerifiedCreatorLoadout(profile.loadout)) {
        return res.status(400).json({ error: 'Seu perfil já está verificado na CineReact.' });
      }

      const pending = localDb.getPendingCreatorVerificationRequestForUser(user.email);
      if (pending) {
        return res.json({ request: pending, alreadyPending: true });
      }

      const normalizedUrl = normalizeChannelUrl(String(youtubeChannelUrl));
      const resolved = await resolveYouTubeChannel(normalizedUrl);
      if (!resolved) {
        return res.status(400).json({
          error: 'Não encontramos esse canal no YouTube. Confira o link ou o @ e tente novamente.',
        });
      }

      const expiresAt = new Date(
        Date.now() + CREATOR_VERIFICATION_WINDOW_HOURS * 60 * 60 * 1000
      ).toISOString();

      const request = localDb.createCreatorVerificationRequest({
        usuarioEmail: user.email,
        usuarioNome: user.username,
        youtubeChannelUrl: normalizedUrl,
        youtubeChannelId: resolved.channelId,
        channelTitle: resolved.titulo,
        verificationCode: generateVerificationCode(),
        expiresAt,
      });

      localDb.addNotificacao({
        usuarioEmail: user.email,
        titulo: 'Verificação de criador iniciada',
        mensagem: `Adicione o código ${request.verificationCode} na descrição do seu canal no YouTube. Nossa equipe confirma em até ${CREATOR_VERIFICATION_WINDOW_HOURS} horas.`,
      });

      localDb.addNotificacao({
        titulo: 'Nova solicitação de verificação de criador',
        mensagem: `${user.username} (${user.email}) pediu verificação do canal ${resolved.titulo}. Código: ${request.verificationCode}`,
      });

      res.status(201).json({ request });
    } catch (error) {
      console.error('[CreatorVerification] Erro ao criar pedido:', error);
      res.status(500).json({ error: 'Erro ao registrar solicitação de verificação.' });
    }
  });

  app.get('/api/creator-verification/me', (req, res) => {
    try {
      expireStaleRequests();

      const email = String(req.query.email || '');
      if (!email) {
        return res.status(400).json({ error: 'E-mail é obrigatório.' });
      }

      const user = localDb.findUsuarioByEmailSync(email);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const profile = migrateProfile(localDb.getGamificationProfile(user.email));
      const request = localDb.getLatestCreatorVerificationRequestForUser(user.email);

      res.json({
        isVerifiedCreator: isVerifiedCreatorLoadout(profile.loadout),
        request,
      });
    } catch (error) {
      console.error('[CreatorVerification] Erro ao buscar status:', error);
      res.status(500).json({ error: 'Erro ao buscar status da verificação.' });
    }
  });

  app.post('/api/creator-verification/:id/check-description', async (req, res) => {
    try {
      expireStaleRequests();

      const { id } = req.params;
      const { email } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: 'E-mail é obrigatório.' });
      }

      const request = localDb
        .getCreatorVerificationRequests()
        .find((r) => r.id === id && r.usuarioEmail.toLowerCase() === String(email).toLowerCase());

      if (!request) {
        return res.status(404).json({ error: 'Solicitação não encontrada.' });
      }
      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Esta solicitação já foi processada.' });
      }
      if (new Date(request.expiresAt).getTime() <= Date.now()) {
        localDb.updateCreatorVerificationRequest(id, { status: 'expired' });
        return res.status(400).json({ error: 'Esta solicitação expirou. Inicie uma nova verificação.' });
      }

      const resolved = await resolveYouTubeChannel(request.youtubeChannelUrl);
      if (!resolved) {
        return res.status(400).json({ error: 'Não foi possível ler a descrição do canal agora. Tente novamente.' });
      }

      const codeFound = descriptionContainsCode(resolved.sinopse, request.verificationCode);
      const updated = localDb.updateCreatorVerificationRequest(id, {
        codeFoundInDescription: codeFound,
        descriptionCheckedAt: new Date().toISOString(),
        channelTitle: resolved.titulo || request.channelTitle,
        youtubeChannelId: resolved.channelId || request.youtubeChannelId,
      });

      if (!codeFound) {
        return res.status(400).json({
          error: 'Ainda não encontramos o código na descrição do canal. Salve as alterações no YouTube e aguarde alguns minutos.',
          request: updated,
          codeFound: false,
        });
      }

      res.json({
        request: updated,
        codeFound: true,
        message: 'Código encontrado! Nossa equipe confirma sua verificação em até 24 horas.',
      });
    } catch (error) {
      console.error('[CreatorVerification] Erro ao checar descrição:', error);
      res.status(500).json({ error: 'Erro ao verificar descrição do canal.' });
    }
  });

  app.get('/api/admin/creator-verification', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;

    expireStaleRequests();

    const status = req.query.status as string | undefined;
    const allowed = ['pending', 'approved', 'rejected', 'expired'] as const;
    const filter = allowed.includes(status as (typeof allowed)[number])
      ? (status as (typeof allowed)[number])
      : undefined;

    const requests = localDb.getCreatorVerificationRequests(filter);
    res.json({ requests });
  });

  app.post('/api/admin/creator-verification/:id/approve', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;

    try {
      expireStaleRequests();

      const { id } = req.params;
      const existing = localDb.getCreatorVerificationRequests().find((r) => r.id === id);
      if (!existing) {
        return res.status(404).json({ error: 'Solicitação não encontrada.' });
      }
      if (existing.status !== 'pending') {
        return res.status(400).json({ error: 'Esta solicitação já foi processada.' });
      }

      const updated = localDb.updateCreatorVerificationRequest(id, {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminEmail,
      });

      grantCreatorVerificationBenefits(existing.usuarioEmail, id);

      localDb.addNotificacao({
        usuarioEmail: existing.usuarioEmail,
        titulo: 'Perfil de criador verificado!',
        mensagem:
          'Sua verificação foi aprovada. Seu selo de criador verificado e perfil público premium já estão ativos na CineReact.',
      });

      localDb.appendAuditLog({
        actorEmail: adminEmail,
        action: 'approve_creator_verification',
        targetType: 'creator_verification',
        targetId: id,
        details: `${existing.usuarioEmail} · ${existing.channelTitle || existing.youtubeChannelUrl}`,
      });

      res.json({ request: updated });
    } catch (error) {
      console.error('[CreatorVerification] Erro ao aprovar:', error);
      res.status(500).json({ error: 'Erro ao aprovar verificação.' });
    }
  });

  app.post('/api/admin/creator-verification/:id/reject', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;

    try {
      const { id } = req.params;
      const { note } = req.body || {};
      const existing = localDb.getCreatorVerificationRequests().find((r) => r.id === id);
      if (!existing) {
        return res.status(404).json({ error: 'Solicitação não encontrada.' });
      }
      if (existing.status !== 'pending') {
        return res.status(400).json({ error: 'Esta solicitação já foi processada.' });
      }

      const updated = localDb.updateCreatorVerificationRequest(id, {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminEmail,
        adminNote: note || undefined,
      });

      localDb.addNotificacao({
        usuarioEmail: existing.usuarioEmail,
        titulo: 'Verificação não aprovada',
        mensagem:
          note ||
          'Não conseguimos confirmar o código na descrição do seu canal. Verifique se o código está visível e tente novamente.',
      });

      localDb.appendAuditLog({
        actorEmail: adminEmail,
        action: 'reject_creator_verification',
        targetType: 'creator_verification',
        targetId: id,
        details: existing.usuarioEmail,
      });

      res.json({ request: updated });
    } catch (error) {
      console.error('[CreatorVerification] Erro ao rejeitar:', error);
      res.status(500).json({ error: 'Erro ao rejeitar verificação.' });
    }
  });
}
