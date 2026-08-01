import type { Express, Request, Response } from 'express';
import { localDb } from '../db/local_db.ts';
import {
  DONATION_AMOUNT_BRL,
  DONATION_MP_LINK,
} from '../types/donations.ts';
import {
  grantDonorVipBenefits,
  recordDonationPayment,
} from '../gamification/donorRewards.ts';
import { serializeUserState } from '../utils/userState.ts';

type RequireAdminFn = (req: Request, res: Response) => Promise<string | null>;

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function registerDonationRoutes(app: Express, requireAdmin: RequireAdminFn) {
  app.post('/api/donations/request', (req, res) => {
    try {
      const { email, nome } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: 'E-mail é obrigatório.' });
      }

      const user = localDb.findUsuarioByEmailSync(String(email));
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado. Faça login com sua conta.' });
      }

      if (user.isDonor) {
        return res.status(400).json({ error: 'Você já é Apoiador VIP.' });
      }

      const pending = localDb.getPendingDonationRequestForUser(email);
      if (pending) {
        return res.json({ request: pending, alreadyPending: true });
      }

      const request = localDb.createDonationRequest({
        usuarioEmail: user.email,
        usuarioNome: nome || user.username,
        amount: DONATION_AMOUNT_BRL,
        currency: 'BRL',
        paymentMethod: 'mercado_pago_link',
        paymentLink: DONATION_MP_LINK,
      });

      localDb.addNotificacao({
        usuarioEmail: user.email,
        titulo: 'Doação em análise',
        mensagem:
          'Recebemos seu pedido de apoio VIP. Assim que nossa equipe confirmar o pagamento de R$ 4,99, você receberá os cosméticos e o selo Apoiador na sua conta.',
      });

      localDb.addNotificacao({
        titulo: 'Nova doação VIP pendente',
        mensagem: `${user.username} (${user.email}) entrou na fila de apoio VIP. Valor: R$ ${DONATION_AMOUNT_BRL.toFixed(2)}.`,
      });

      res.status(201).json({ request, paymentLink: DONATION_MP_LINK });
    } catch (error) {
      console.error('[Donations] Erro ao criar pedido:', error);
      res.status(500).json({ error: 'Erro ao registrar pedido de doação.' });
    }
  });

  app.get('/api/donations/me', (req, res) => {
    try {
      const email = String(req.query.email || '');
      if (!email) {
        return res.status(400).json({ error: 'E-mail é obrigatório.' });
      }

      const user = localDb.findUsuarioByEmailSync(email);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const request = localDb.getLatestDonationRequestForUser(email);
      res.json({
        isDonor: !!user.isDonor,
        request,
      });
    } catch (error) {
      console.error('[Donations] Erro ao buscar status:', error);
      res.status(500).json({ error: 'Erro ao buscar status da doação.' });
    }
  });

  app.get('/api/admin/donations', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const status = req.query.status as string | undefined;
    const allowed = ['pending', 'approved', 'rejected'] as const;
    const filter = allowed.includes(status as typeof allowed[number])
      ? (status as typeof allowed[number])
      : undefined;
    const requests = localDb.getDonationRequests(filter);
    res.json({ requests });
  });

  app.post('/api/admin/donations/:id/approve', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;

    try {
      const { id } = req.params;
      const existing = localDb.getDonationRequests().find((r) => r.id === id);
      if (!existing) {
        return res.status(404).json({ error: 'Pedido não encontrado.' });
      }
      if (existing.status !== 'pending') {
        return res.status(400).json({ error: 'Este pedido já foi processado.' });
      }

      const updated = localDb.updateDonationRequest(id, {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminEmail,
      });

      grantDonorVipBenefits(existing.usuarioEmail, id);
      recordDonationPayment(existing.usuarioEmail, existing.amount, id);

      const user = localDb.findUsuarioByEmailSync(existing.usuarioEmail);
      localDb.addNotificacao({
        usuarioEmail: existing.usuarioEmail,
        titulo: 'Apoiador VIP ativado!',
        mensagem:
          'Sua doação foi confirmada pela equipe CineReact. Você recebeu o selo Apoiador VIP e cosméticos exclusivos na sua conta. Obrigado pelo apoio!',
      });

      localDb.appendAuditLog({
        actorEmail: adminEmail,
        action: 'approve_donation',
        targetType: 'donation',
        targetId: id,
        details: existing.usuarioEmail,
      });

      res.json({
        request: updated,
        user: user ? serializeUserState(user, { isDonor: true }) : null,
      });
    } catch (error) {
      console.error('[Donations] Erro ao aprovar:', error);
      res.status(500).json({ error: 'Erro ao aprovar doação.' });
    }
  });

  app.post('/api/admin/donations/:id/reject', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;

    try {
      const { id } = req.params;
      const { note } = req.body || {};
      const existing = localDb.getDonationRequests().find((r) => r.id === id);
      if (!existing) {
        return res.status(404).json({ error: 'Pedido não encontrado.' });
      }
      if (existing.status !== 'pending') {
        return res.status(400).json({ error: 'Este pedido já foi processado.' });
      }

      const updated = localDb.updateDonationRequest(id, {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminEmail,
        adminNote: note || undefined,
      });

      localDb.addNotificacao({
        usuarioEmail: existing.usuarioEmail,
        titulo: 'Doação não confirmada',
        mensagem:
          note ||
          'Não encontramos seu pagamento de R$ 4,99. Se você já pagou, tente novamente ou entre em contato com o suporte.',
      });

      localDb.appendAuditLog({
        actorEmail: adminEmail,
        action: 'reject_donation',
        targetType: 'donation',
        targetId: id,
        details: existing.usuarioEmail,
      });

      res.json({ request: updated });
    } catch (error) {
      console.error('[Donations] Erro ao rejeitar:', error);
      res.status(500).json({ error: 'Erro ao rejeitar doação.' });
    }
  });
}
