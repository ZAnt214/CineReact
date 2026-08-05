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
import { validateMercadoPagoWebhook } from '../security/webhooks.ts';
import { raiseSecurityAlert } from '../security/monitoring.ts';
import { getClientIp } from '../security/audit.ts';
import type { SecurityContext } from '../security/types.ts';

type RequireAdminFn = (req: Request, res: Response) => Promise<string | null>;

export function registerSubscriptionRoutes(
  app: Express,
  requireAdmin: RequireAdminFn,
  security: SecurityContext
) {
  app.get('/api/subscriptions/me', async (req, res) => {
    try {
      const email = security.getAuthEmail(req);
      if (!email) return res.status(401).json({ error: 'Autenticação necessária.' });
      const user = localDb.findUsuarioByEmailSync(email);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
      res.json(getSubscriberEntitlements(email));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao buscar assinaturas.' });
    }
  });

  app.post('/api/subscriptions/checkout', async (req, res) => {
    try {
      const email = security.getAuthEmail(req);
      if (!email) return res.status(401).json({ error: 'Autenticação necessária.' });
      const { plan, creatorEmail } = req.body || {};
      if (!plan || !['exclusive', 'global'].includes(plan)) {
        return res.status(400).json({ error: 'Plano inválido.' });
      }

      const checkout = createSubscriptionCheckout(
        email,
        plan as SubscriptionPlan,
        creatorEmail ? String(creatorEmail) : undefined
      );

      security.financialAudit(req, {
        action: 'subscription_checkout_created',
        actorEmail: email,
        targetType: 'subscription_checkout',
        targetId: checkout.id,
        amount: checkout.amount,
        currency: checkout.currency,
        metadata: JSON.stringify({ plan: checkout.plan, externalReference: checkout.externalReference }),
      });

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
      const email = security.getAuthEmail(req);
      if (!email) return res.status(401).json({ error: 'Autenticação necessária.' });
      const { paymentId } = req.body || {};
      const checkoutId = req.params.id;
      const checkout = localDb.getSubscriptionCheckouts().find((c) => c.id === checkoutId);
      if (!checkout) return res.status(404).json({ error: 'Checkout não encontrado.' });
      if (checkout.subscriberEmail !== email) {
        return res.status(403).json({ error: 'Checkout não pertence a este usuário.' });
      }

      if (paymentId) {
        const verified = await verifyMercadoPagoPayment(String(paymentId));
        if (verified.approved) {
          const sub = activateSubscriptionFromCheckout(checkoutId, String(paymentId), email);
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

  app.post('/api/subscriptions/:id/cancel', async (req, res) => {
    try {
      const email = security.getAuthEmail(req);
      if (!email) return res.status(401).json({ error: 'Autenticação necessária.' });
      const updated = cancelSubscription(email, req.params.id);
      security.financialAudit(req, {
        action: 'subscription_cancelled',
        actorEmail: email,
        targetType: 'subscription',
        targetId: updated.id,
        amount: updated.amount,
        currency: 'BRL',
      });
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

      if (!validateMercadoPagoWebhook(req, String(paymentId))) {
        return res.status(401).json({ error: 'Webhook não autorizado.' });
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
        raiseSecurityAlert({
          type: 'fraud_subscription',
          severity: 'medium',
          message: 'Webhook MP com referência desconhecida',
          ip: getClientIp(req),
          metadata: JSON.stringify({ paymentId, ref }),
        });
        return res.status(200).json({ received: true, skipped: 'checkout not found' });
      }

      const subscription = activateSubscriptionFromCheckout(
        checkout.id,
        String(paymentId),
        'mercadopago_webhook'
      );
      res.status(200).json({ received: true, subscriptionId: subscription.id });
    } catch (err: any) {
      console.error('[Webhook MP]', err);
      res.status(500).json({ error: 'Erro interno.' });
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
      const subscription = activateSubscriptionFromCheckout(req.params.id, undefined, adminEmail);
      localDb.appendAuditLog({
        actorEmail: adminEmail,
        action: 'approve_subscription_checkout',
        targetType: 'subscription_checkout',
        targetId: req.params.id,
        details: subscription.subscriberEmail,
      });
      security.financialAudit(req, {
        action: 'subscription_admin_approved',
        actorEmail: adminEmail,
        targetType: 'subscription',
        targetId: subscription.id,
        amount: subscription.amount,
        currency: 'BRL',
      });
      res.json({ subscription });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
}
