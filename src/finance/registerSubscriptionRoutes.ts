import type { Express, Request, Response } from 'express';
import { localDb } from '../db/local_db.ts';
import {
  activateSubscriptionFromCheckout,
  cancelSubscription,
  createSubscriptionCheckout,
  findCheckoutByExternalReference,
  getSubscriberEntitlements,
  isVerifiedCreatorEmail,
  verifyMercadoPagoPayment,
} from './subscriptionService.ts';
import type { SubscriptionPlan } from '../types/finance.ts';

type RequireAdminFn = (req: Request, res: Response) => Promise<string | null>;

export function registerSubscriptionRoutes(app: Express, requireAdmin: RequireAdminFn) {
  app.get('/api/subscriptions/me', (req, res) => {
    try {
      const email = String(req.query.email || '').toLowerCase().trim();
      if (!email) return res.status(400).json({ error: 'E-mail é obrigatório.' });
      const user = localDb.findUsuarioByEmailSync(email);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      res.json(getSubscriberEntitlements(email));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao buscar assinaturas.' });
    }
  });

  app.post('/api/subscriptions/checkout', (req, res) => {
    try {
      const { email, plan, creatorEmail } = req.body || {};
      if (!email) return res.status(400).json({ error: 'E-mail é obrigatório.' });
      if (!plan || !['exclusive', 'global'].includes(plan)) {
        return res.status(400).json({ error: 'Plano inválido.' });
      }

      const checkout = createSubscriptionCheckout(
        String(email),
        plan as SubscriptionPlan,
        creatorEmail ? String(creatorEmail) : undefined
      );

      res.status(201).json({
        checkout,
        paymentLink: checkout.paymentLink,
        externalReference: checkout.externalReference,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Não foi possível iniciar o checkout.' });
    }
  });

  app.post('/api/subscriptions/checkouts/:id/confirm-paid', async (req, res) => {
    try {
      const { email, paymentId } = req.body || {};
      const checkoutId = req.params.id;
      const checkout = localDb.getSubscriptionCheckouts().find((c) => c.id === checkoutId);
      if (!checkout) return res.status(404).json({ error: 'Checkout não encontrado.' });
      if (email && checkout.subscriberEmail !== String(email).toLowerCase()) {
        return res.status(403).json({ error: 'Checkout não pertence a este usuário.' });
      }

      if (paymentId) {
        const verified = await verifyMercadoPagoPayment(String(paymentId));
        if (verified.approved) {
          const sub = activateSubscriptionFromCheckout(checkoutId, String(paymentId));
          return res.json({ activated: true, subscription: sub });
        }
      }

      localDb.addNotificacao({
        titulo: 'Assinatura aguardando confirmação',
        mensagem: `${checkout.subscriberEmail} informou pagamento da assinatura ${checkout.plan} (ref: ${checkout.externalReference}). Confirme no painel Financeiro.`,
      });

      res.json({
        activated: false,
        pending: true,
        message: 'Pagamento em análise. Sua assinatura será ativada em até 24 horas após confirmação.',
        checkout,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao confirmar pagamento.' });
    }
  });

  app.post('/api/subscriptions/:id/cancel', (req, res) => {
    try {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ error: 'E-mail é obrigatório.' });
      const updated = cancelSubscription(String(email), req.params.id);
      res.json({ subscription: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao cancelar.' });
    }
  });

  app.post('/api/webhooks/mercadopago', async (req, res) => {
    try {
      const body = req.body || {};
      const paymentId =
        body?.data?.id ||
        body?.id ||
        req.query['data.id'] ||
        req.query.id;

      if (!paymentId) {
        return res.status(200).json({ received: true, skipped: 'no payment id' });
      }

      const verified = await verifyMercadoPagoPayment(String(paymentId));
      if (!verified.approved) {
        return res.status(200).json({ received: true, status: 'not_approved' });
      }

      const ref = verified.externalReference;
      if (!ref) {
        return res.status(200).json({ received: true, skipped: 'no reference' });
      }

      const checkout = findCheckoutByExternalReference(ref);
      if (!checkout) {
        return res.status(200).json({ received: true, skipped: 'checkout not found' });
      }

      const subscription = activateSubscriptionFromCheckout(checkout.id, String(paymentId));
      res.status(200).json({ received: true, subscriptionId: subscription.id });
    } catch (err: any) {
      console.error('[Webhook MP]', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/subscriptions/checkouts', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const status = String(req.query.status || 'pending');
    const checkouts = localDb
      .getSubscriptionCheckouts()
      .filter((c) => (status === 'all' ? true : c.status === status));
    res.json({ checkouts });
  });

  app.post('/api/admin/subscriptions/checkouts/:id/approve', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    try {
      const subscription = activateSubscriptionFromCheckout(req.params.id);
      localDb.appendAuditLog({
        actorEmail: adminEmail,
        action: 'approve_subscription_checkout',
        targetType: 'subscription_checkout',
        targetId: req.params.id,
        details: subscription.subscriberEmail,
      });
      res.json({ subscription });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
}
