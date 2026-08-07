import { localDb } from '../db/local_db.ts';
import { migrateProfile } from '../gamification/rewardsEngine.ts';
import { isVerifiedCreatorLoadout } from '../gamification/verifiedCreator.ts';
import type {
  FinanceTransaction,
  PlatformSubscription,
  SubscriberEntitlements,
  SubscriptionCheckout,
  SubscriptionPlan,
} from '../types/finance.ts';
import {
  EXCLUSIVE_SUBSCRIPTION_PRICE,
  GLOBAL_SUBSCRIPTION_PRICE,
  SUBSCRIPTION_PERIOD_DAYS,
} from './constants.ts';

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mpLink(plan: SubscriptionPlan): string {
  if (plan === 'global') {
    return process.env.SUBSCRIPTION_GLOBAL_MP_LINK || 'https://mpago.la/1ZuYNe6';
  }
  return process.env.SUBSCRIPTION_EXCLUSIVE_MP_LINK || 'https://mpago.la/1sDBJXu';
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function isVerifiedCreatorEmail(email: string): boolean {
  const profile = migrateProfile(localDb.getGamificationProfile(email));
  return isVerifiedCreatorLoadout(profile.loadout);
}

export function getActiveGlobalSubscription(email: string): PlatformSubscription | null {
  const key = email.toLowerCase();
  return (
    localDb
      .getPlatformSubscriptions()
      .find(
        (s) =>
          s.plan === 'global' &&
          s.subscriberEmail.toLowerCase() === key &&
          s.status === 'active' &&
          (!s.expiresAt || new Date(s.expiresAt).getTime() > Date.now())
      ) || null
  );
}

export function getActiveExclusiveSubscription(
  subscriberEmail: string,
  creatorEmail: string
): PlatformSubscription | null {
  const subKey = subscriberEmail.toLowerCase();
  const creatorKey = creatorEmail.toLowerCase();
  return (
    localDb
      .getPlatformSubscriptions()
      .find(
        (s) =>
          s.plan === 'exclusive' &&
          s.subscriberEmail.toLowerCase() === subKey &&
          s.creatorEmail?.toLowerCase() === creatorKey &&
          s.status === 'active' &&
          (!s.expiresAt || new Date(s.expiresAt).getTime() > Date.now())
      ) || null
  );
}

export function hasGlobalAccess(email: string): boolean {
  return !!getActiveGlobalSubscription(email);
}

export function hasExclusiveAccess(subscriberEmail: string, creatorEmail: string): boolean {
  if (hasGlobalAccess(subscriberEmail)) return true;
  return !!getActiveExclusiveSubscription(subscriberEmail, creatorEmail);
}

export function getSubscriberEntitlements(email: string): SubscriberEntitlements {
  const key = email.toLowerCase();
  const subs = localDb
    .getPlatformSubscriptions()
    .filter((s) => s.subscriberEmail.toLowerCase() === key && s.status === 'active');

  return {
    global: hasGlobalAccess(key),
    exclusiveCreators: subs
      .filter((s) => s.plan === 'exclusive' && s.creatorEmail)
      .map((s) => s.creatorEmail!.toLowerCase()),
    checkouts: localDb.getSubscriptionCheckouts().filter((c) => c.subscriberEmail.toLowerCase() === key),
    subscriptions: subs,
  };
}

export function createSubscriptionCheckout(
  subscriberEmail: string,
  plan: SubscriptionPlan,
  creatorEmail?: string
): SubscriptionCheckout {
  const key = subscriberEmail.toLowerCase();
  const user = localDb.findUsuarioByEmailSync(key);
  if (!user) throw new Error('Usuário não encontrado.');

  if (plan === 'exclusive') {
    if (!creatorEmail) throw new Error('Informe o criador para assinatura exclusiva.');
    if (!isVerifiedCreatorEmail(creatorEmail)) {
      throw new Error('Este criador ainda não está verificado na CineReact.');
    }
    if (getActiveExclusiveSubscription(key, creatorEmail)) {
      throw new Error('Você já possui assinatura exclusiva ativa com este criador.');
    }
  }

  if (plan === 'global' && getActiveGlobalSubscription(key)) {
    throw new Error('Você já possui assinatura global ativa.');
  }

  const pending = localDb
    .getSubscriptionCheckouts()
    .find(
      (c) =>
        c.subscriberEmail.toLowerCase() === key &&
        c.status === 'pending' &&
        c.plan === plan &&
        (plan !== 'exclusive' || c.creatorEmail?.toLowerCase() === creatorEmail?.toLowerCase())
    );
  if (pending) return pending;

  const amount = plan === 'global' ? GLOBAL_SUBSCRIPTION_PRICE : EXCLUSIVE_SUBSCRIPTION_PRICE;
  const checkout: SubscriptionCheckout = {
    id: uid('chk'),
    plan,
    subscriberEmail: key,
    creatorEmail: creatorEmail?.toLowerCase(),
    amount,
    currency: 'BRL',
    status: 'pending',
    paymentProvider: 'mercado_pago',
    externalReference: uid('cref'),
    paymentLink: mpLink(plan),
    createdAt: new Date().toISOString(),
  };

  localDb.saveSubscriptionCheckout(checkout);
  return checkout;
}

export function activateSubscriptionFromCheckout(
  checkoutId: string,
  providerPaymentId?: string,
  actorEmail?: string
): PlatformSubscription {
  const checkout = localDb.getSubscriptionCheckouts().find((c) => c.id === checkoutId);
  if (!checkout) throw new Error('Checkout não encontrado.');

  if (providerPaymentId) {
    const idemKey = `mp-payment:${providerPaymentId}`;
    if (localDb.hasIdempotencyKey('subscription', idemKey)) {
      const existing = localDb
        .getPlatformSubscriptions()
        .find((s) => s.providerPaymentId === providerPaymentId || s.checkoutId === checkoutId);
      if (existing) return existing;
      throw new Error('Pagamento já processado.');
    }
    if (!localDb.claimIdempotencyKey('subscription', idemKey, checkoutId)) {
      const existing = localDb
        .getPlatformSubscriptions()
        .find((s) => s.providerPaymentId === providerPaymentId || s.checkoutId === checkoutId);
      if (existing) return existing;
      throw new Error('Pagamento já processado.');
    }
  }

  if (checkout.status === 'completed') {
    const existing = localDb
      .getPlatformSubscriptions()
      .find((s) => s.checkoutId === checkoutId);
    if (existing) return existing;
  }
  if (checkout.status !== 'pending') {
    throw new Error('Checkout já processado ou expirado.');
  }

  const now = new Date().toISOString();
  const expiresAt = addDays(now, SUBSCRIPTION_PERIOD_DAYS);

  const subscription: PlatformSubscription = {
    id: uid('sub'),
    plan: checkout.plan,
    subscriberEmail: checkout.subscriberEmail,
    creatorEmail: checkout.creatorEmail,
    status: 'active',
    amount: checkout.amount,
    startedAt: now,
    expiresAt,
    lastPaymentAt: now,
    checkoutId: checkout.id,
    providerPaymentId,
  };

  localDb.savePlatformSubscription(subscription);

  const tx: FinanceTransaction = {
    id: uid('tx'),
    type: checkout.plan === 'global' ? 'global_subscription' : 'exclusive_subscription',
    plan: checkout.plan,
    amount: checkout.amount,
    currency: 'BRL',
    subscriberEmail: checkout.subscriberEmail,
    creatorEmail: checkout.creatorEmail,
    status: 'completed',
    createdAt: now,
    periodStart: now,
    periodEnd: expiresAt,
  };
  localDb.saveFinanceTransaction(tx);

  localDb.appendFinancialAuditLog({
    action: 'subscription_activated',
    actorEmail,
    targetType: 'subscription',
    targetId: subscription.id,
    amount: checkout.amount,
    currency: checkout.currency,
    metadata: JSON.stringify({
      checkoutId: checkout.id,
      plan: checkout.plan,
      providerPaymentId,
      subscriberEmail: checkout.subscriberEmail,
    }),
  });

  localDb.saveSubscriptionCheckout({
    ...checkout,
    status: 'completed',
    completedAt: now,
    providerPaymentId,
  });

  localDb.addNotificacao({
    usuarioEmail: checkout.subscriberEmail,
    titulo: 'Assinatura ativada!',
    mensagem:
      checkout.plan === 'global'
        ? 'Sua assinatura global CineReact está ativa. Aproveite o conteúdo exclusivo de todos os criadores participantes.'
        : `Sua assinatura exclusiva está ativa. Você tem acesso ao conteúdo premium do criador.`,
  });

  return subscription;
}

export async function verifyMercadoPagoPayment(paymentId: string): Promise<{
  approved: boolean;
  externalReference?: string;
  amount?: number;
}> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return { approved: false };

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { approved: false };
    const data = await res.json();
    return {
      approved: data.status === 'approved',
      externalReference: data.external_reference,
      amount: data.transaction_amount,
    };
  } catch {
    return { approved: false };
  }
}

export function findCheckoutByExternalReference(ref: string): SubscriptionCheckout | null {
  return (
    localDb.getSubscriptionCheckouts().find((c) => c.externalReference === ref || c.id === ref) || null
  );
}

export function cancelSubscription(subscriberEmail: string, subscriptionId: string): PlatformSubscription {
  const key = subscriberEmail.toLowerCase();
  const sub = localDb.getPlatformSubscriptions().find((s) => s.id === subscriptionId);
  if (!sub || sub.subscriberEmail.toLowerCase() !== key) {
    throw new Error('Assinatura não encontrada.');
  }
  const updated: PlatformSubscription = {
    ...sub,
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
  };
  localDb.savePlatformSubscription(updated);
  return updated;
}
