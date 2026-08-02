import { localDb } from '../db/local_db.ts';
import { DEMO_CREATOR_EMAIL } from '../constants/demoCreator.ts';
import {
  EXCLUSIVE_SUBSCRIPTION_PRICE,
  GLOBAL_SUBSCRIPTION_PRICE,
} from './constants.ts';
import type { FinanceTransaction, PlatformSubscription } from '../types/finance.ts';

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function seedFinanceDataIfEmpty(): void {
  const existing = localDb.getFinanceTransactions();
  if (existing.length > 0) return;

  const demoCreator = DEMO_CREATOR_EMAIL.toLowerCase();
  const subscribers = [
    'fan1@cinereact.app',
    'fan2@cinereact.app',
    'fan3@cinereact.app',
    'fan4@cinereact.app',
    'fan5@cinereact.app',
    'fan6@cinereact.app',
    'fan7@cinereact.app',
    'fan8@cinereact.app',
  ];

  const exclusiveSubs: PlatformSubscription[] = [];
  for (let i = 0; i < 5; i++) {
    const sub: PlatformSubscription = {
      id: uid('sub-ex'),
      plan: 'exclusive',
      subscriberEmail: subscribers[i],
      creatorEmail: demoCreator,
      status: 'active',
      amount: EXCLUSIVE_SUBSCRIPTION_PRICE,
      startedAt: daysAgo(45 - i * 3),
      lastPaymentAt: daysAgo(i * 2),
    };
    exclusiveSubs.push(sub);
    localDb.savePlatformSubscription(sub);

    const tx: FinanceTransaction = {
      id: uid('tx'),
      type: 'exclusive_subscription',
      plan: 'exclusive',
      amount: EXCLUSIVE_SUBSCRIPTION_PRICE,
      currency: 'BRL',
      subscriberEmail: subscribers[i],
      creatorEmail: demoCreator,
      status: 'completed',
      createdAt: daysAgo(i * 2),
    };
    localDb.saveFinanceTransaction(tx);
  }

  for (let i = 5; i < 8; i++) {
    const sub: PlatformSubscription = {
      id: uid('sub-gl'),
      plan: 'global',
      subscriberEmail: subscribers[i],
      status: 'active',
      amount: GLOBAL_SUBSCRIPTION_PRICE,
      startedAt: daysAgo(30 - i),
      lastPaymentAt: daysAgo(i),
    };
    localDb.savePlatformSubscription(sub);

    const tx: FinanceTransaction = {
      id: uid('tx'),
      type: 'global_subscription',
      plan: 'global',
      amount: GLOBAL_SUBSCRIPTION_PRICE,
      currency: 'BRL',
      subscriberEmail: subscribers[i],
      status: 'completed',
      createdAt: daysAgo(i),
    };
    localDb.saveFinanceTransaction(tx);
  }

  const cancelled: PlatformSubscription = {
    id: uid('sub-ex'),
    plan: 'exclusive',
    subscriberEmail: 'fan-cancel@cinereact.app',
    creatorEmail: demoCreator,
    status: 'cancelled',
    amount: EXCLUSIVE_SUBSCRIPTION_PRICE,
    startedAt: daysAgo(90),
    cancelledAt: daysAgo(5),
    lastPaymentAt: daysAgo(35),
  };
  localDb.savePlatformSubscription(cancelled);

  for (let i = 0; i < 60; i++) {
    localDb.saveFinanceTransaction({
      id: uid('tx'),
      type: i % 3 === 0 ? 'global_subscription' : 'exclusive_subscription',
      plan: i % 3 === 0 ? 'global' : 'exclusive',
      amount: i % 3 === 0 ? GLOBAL_SUBSCRIPTION_PRICE : EXCLUSIVE_SUBSCRIPTION_PRICE,
      currency: 'BRL',
      subscriberEmail: subscribers[i % subscribers.length],
      creatorEmail: i % 3 === 0 ? undefined : demoCreator,
      status: 'completed',
      createdAt: daysAgo(60 - i),
    });
  }

  const clips = localDb.getCineClips().filter((c) => c.criadorEmail?.toLowerCase() === demoCreator);
  if (clips.length > 0 && localDb.getAllCineClipLikes().length < 20) {
    const globalSubs = subscribers.slice(5, 8);
    for (const clip of clips.slice(0, 3)) {
      for (const fan of globalSubs) {
        localDb.likeCineClip(clip.id, fan, 'like');
      }
    }
  }
}
