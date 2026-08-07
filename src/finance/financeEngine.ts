import { localDb } from '../db/local_db.ts';
import type { CineClipComment, CineClipLike } from '../types/cineclips.ts';
import type {
  CreatorFinanceSummary,
  CreatorRankingEntry,
  FinanceDashboard,
  GlobalDistributionSummary,
  MonthCloseSimulation,
  MonthlyCloseRecord,
  PayoutStatus,
  PlatformSubscription,
  SubscriptionStats,
} from '../types/finance.ts';
import {
  EXCLUSIVE_CREATOR_SHARE,
  EXCLUSIVE_PLATFORM_SHARE,
  GLOBAL_CREATOR_POOL_SHARE,
  GLOBAL_PLATFORM_SHARE,
  MAX_COMMENTS_PER_USER_CLIP_PER_DAY,
  MAX_LIKES_PER_USER_CLIP_PER_DAY,
  RANKING_POINTS_COMMENT,
  RANKING_POINTS_LIKE,
} from './constants.ts';

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}

function periodMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function prevPeriodMonthKey(month: string) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return periodMonthKey(d);
}

function growthPercent(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function sumTransactionsInRange(from: Date, to: Date): number {
  return localDb
    .getFinanceTransactions()
    .filter((t) => t.status === 'completed' && new Date(t.createdAt) >= from && new Date(t.createdAt) < to)
    .reduce((sum, t) => sum + t.amount, 0);
}

function getActiveGlobalSubscriberEmails(): Set<string> {
  return new Set(
    localDb
      .getPlatformSubscriptions()
      .filter((s) => s.plan === 'global' && s.status === 'active')
      .map((s) => s.subscriberEmail.toLowerCase())
  );
}

function isValidSubscriber(email: string): boolean {
  const user = localDb.findUsuarioByEmailSync(email);
  if (!user || user.isBanned || user.isSuspended) return false;
  return true;
}

function filterValidEngagement<T extends { usuarioEmail: string; clipId: string; criadoEm: string }>(
  events: T[],
  globalSubscribers: Set<string>,
  kind: 'like' | 'comment'
): T[] {
  const perUserClipDay = new Map<string, number>();
  const max = kind === 'like' ? MAX_LIKES_PER_USER_CLIP_PER_DAY : MAX_COMMENTS_PER_USER_CLIP_PER_DAY;
  const valid: T[] = [];

  const sorted = [...events].sort(
    (a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime()
  );

  for (const event of sorted) {
    const email = event.usuarioEmail.toLowerCase();
    if (!globalSubscribers.has(email)) continue;
    if (!isValidSubscriber(email)) continue;

    const clip = localDb.getCineClips().find((c) => c.id === event.clipId);
    if (!clip?.criadorEmail) continue;
    if (clip.criadorEmail.toLowerCase() === email) continue;

    const day = event.criadoEm.slice(0, 10);
    const key = `${email}|${event.clipId}|${day}`;
    const count = perUserClipDay.get(key) || 0;
    if (count >= max) continue;

    perUserClipDay.set(key, count + 1);
    valid.push(event);
  }

  return valid;
}

export function computeCreatorRanking(periodMonth = periodMonthKey()): CreatorRankingEntry[] {
  const [year, month] = periodMonth.split('-').map(Number);
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  const globalSubscribers = getActiveGlobalSubscriberEmails();

  const likes = localDb.getAllCineClipLikes().filter((l) => {
    const t = new Date(l.criadoEm);
    return t >= from && t < to;
  }) as CineClipLike[];

  const comments = localDb.getAllCineClipComments().filter((c) => {
    const t = new Date(c.criadoEm);
    return t >= from && t < to && c.moderationStatus !== 'rejected' && c.moderationStatus !== 'hidden';
  }) as CineClipComment[];

  const validLikes = filterValidEngagement(likes, globalSubscribers, 'like');
  const validComments = filterValidEngagement(comments, globalSubscribers, 'comment');

  const byCreator = new Map<string, { likes: number; comments: number; name: string }>();

  const ensure = (email: string, name: string) => {
    const key = email.toLowerCase();
    if (!byCreator.has(key)) {
      byCreator.set(key, { likes: 0, comments: 0, name });
    }
    return byCreator.get(key)!;
  };

  for (const like of validLikes) {
    const clip = localDb.getCineClips().find((c) => c.id === like.clipId);
    if (!clip?.criadorEmail) continue;
    const entry = ensure(clip.criadorEmail, clip.criadorNome);
    entry.likes += 1;
  }

  for (const comment of validComments) {
    const clip = localDb.getCineClips().find((c) => c.id === comment.clipId);
    if (!clip?.criadorEmail) continue;
    const entry = ensure(clip.criadorEmail, clip.criadorNome);
    entry.comments += 1;
  }

  const entries: CreatorRankingEntry[] = [...byCreator.entries()].map(([email, data]) => ({
    creatorEmail: email,
    creatorName: data.name,
    likes: data.likes,
    comments: data.comments,
    points: data.likes * RANKING_POINTS_LIKE + data.comments * RANKING_POINTS_COMMENT,
    sharePercent: 0,
    globalPayout: 0,
  }));

  const totalPoints = entries.reduce((s, e) => s + e.points, 0);
  const activeGlobal = localDb
    .getPlatformSubscriptions()
    .filter((s) => s.plan === 'global' && s.status === 'active').length;
  const creatorsPool = activeGlobal * GLOBAL_CREATOR_POOL_SHARE;

  for (const entry of entries) {
    entry.sharePercent = totalPoints > 0 ? (entry.points / totalPoints) * 100 : 0;
    entry.globalPayout = totalPoints > 0 ? (entry.points / totalPoints) * creatorsPool : 0;
  }

  return entries.sort((a, b) => b.points - a.points);
}

export function computeSubscriptionStats(periodMonth = periodMonthKey()): SubscriptionStats {
  const subs = localDb.getPlatformSubscriptions();
  const active = subs.filter((s) => s.status === 'active');
  const [year, month] = periodMonth.split('-').map(Number);
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);

  const newThisMonth = subs.filter((s) => {
    const t = new Date(s.startedAt);
    return t >= from && t < to;
  }).length;

  const cancellationsThisMonth = subs.filter((s) => {
    if (!s.cancelledAt) return false;
    const t = new Date(s.cancelledAt);
    return t >= from && t < to;
  }).length;

  const txs = localDb.getFinanceTransactions().filter((t) => {
    if (t.status !== 'completed') return false;
    const d = new Date(t.createdAt);
    return d >= from && d < to;
  });

  return {
    activeTotal: active.length,
    activeExclusive: active.filter((s) => s.plan === 'exclusive').length,
    activeGlobal: active.filter((s) => s.plan === 'global').length,
    newThisMonth,
    cancellationsThisMonth,
    exclusiveRevenue: txs
      .filter((t) => t.type === 'exclusive_subscription')
      .reduce((s, t) => s + t.amount, 0),
    globalRevenue: txs
      .filter((t) => t.type === 'global_subscription')
      .reduce((s, t) => s + t.amount, 0),
  };
}

export function computeFinanceDashboard(now = new Date()): FinanceDashboard {
  const today = startOfDay(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const weekStart = startOfWeek(now);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const monthStart = startOfMonth(now);
  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

  const yearStart = startOfYear(now);
  const prevYearStart = new Date(yearStart);
  prevYearStart.setFullYear(prevYearStart.getFullYear() - 1);

  const grossToday = sumTransactionsInRange(today, tomorrow);
  const grossYesterday = sumTransactionsInRange(yesterday, today);
  const grossWeek = sumTransactionsInRange(weekStart, tomorrow);
  const grossPrevWeek = sumTransactionsInRange(prevWeekStart, weekStart);
  const grossMonth = sumTransactionsInRange(monthStart, tomorrow);
  const grossPrevMonth = sumTransactionsInRange(prevMonthStart, monthStart);
  const grossYear = sumTransactionsInRange(yearStart, tomorrow);
  const grossPrevYear = sumTransactionsInRange(prevYearStart, yearStart);
  const grossTotal = localDb
    .getFinanceTransactions()
    .filter((t) => t.status === 'completed')
    .reduce((s, t) => s + t.amount, 0);

  const revenueByDay: { date: string; amount: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    revenueByDay.push({
      date: d.toISOString().slice(0, 10),
      amount: sumTransactionsInRange(d, next),
    });
  }

  const revenueByMonth: { month: string; amount: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    revenueByMonth.push({
      month: periodMonthKey(d),
      amount: sumTransactionsInRange(d, next),
    });
  }

  return {
    grossTotal,
    grossToday,
    grossWeek,
    grossMonth,
    grossYear,
    growthDay: growthPercent(grossToday, grossYesterday),
    growthWeek: growthPercent(grossWeek, grossPrevWeek),
    growthMonth: growthPercent(grossMonth, grossPrevMonth),
    growthYear: growthPercent(grossYear, grossPrevYear),
    revenueByDay,
    revenueByMonth,
    subscriptions: computeSubscriptionStats(),
  };
}

export function computeGlobalDistribution(periodMonth = periodMonthKey()): GlobalDistributionSummary {
  const ranking = computeCreatorRanking(periodMonth);
  const stats = computeSubscriptionStats(periodMonth);
  const grossGlobalRevenue = stats.globalRevenue;
  const creatorsPool = stats.activeGlobal * GLOBAL_CREATOR_POOL_SHARE;
  const platformShare = stats.activeGlobal * GLOBAL_PLATFORM_SHARE;

  return {
    periodMonth,
    grossGlobalRevenue,
    platformShare,
    creatorsPool,
    totalPoints: ranking.reduce((s, r) => s + r.points, 0),
    activeGlobalSubscriptions: stats.activeGlobal,
    ranking,
  };
}

export function computeCreatorSummaries(): CreatorFinanceSummary[] {
  const ranking = computeCreatorRanking();
  const payouts = localDb.getCreatorPayouts();
  const subs = localDb.getPlatformSubscriptions().filter((s) => s.status === 'active');
  const creators = new Map<string, string>();

  for (const sub of subs) {
    if (sub.creatorEmail) creators.set(sub.creatorEmail.toLowerCase(), sub.creatorEmail);
  }
  for (const clip of localDb.getCineClips()) {
    if (clip.criadorEmail) creators.set(clip.criadorEmail.toLowerCase(), clip.criadorEmail);
  }
  for (const r of ranking) creators.set(r.creatorEmail.toLowerCase(), r.creatorEmail);

  const monthStart = startOfMonth(new Date());

  return [...creators.values()].map((email) => {
    const key = email.toLowerCase();
    const user = localDb.findUsuarioByEmailSync(email);
    const name = user?.username || ranking.find((r) => r.creatorEmail === key)?.creatorName || email;
    const rankEntry = ranking.find((r) => r.creatorEmail === key);
    const rankPos = ranking.findIndex((r) => r.creatorEmail === key) + 1;
    const exclusiveSubs = subs.filter(
      (s) => s.plan === 'exclusive' && s.creatorEmail?.toLowerCase() === key
    ).length;
    const exclusiveRevenue = exclusiveSubs * EXCLUSIVE_CREATOR_SHARE;

    const creatorPayouts = payouts.filter((p) => p.creatorEmail.toLowerCase() === key);
    const pending = creatorPayouts.filter((p) => p.status === 'pending' || p.status === 'processing');
    const paid = creatorPayouts.filter((p) => p.status === 'paid');
    const latestPayout = [...creatorPayouts].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];

    const monthTx = localDb
      .getFinanceTransactions()
      .filter(
        (t) =>
          t.status === 'completed' &&
          t.creatorEmail?.toLowerCase() === key &&
          new Date(t.createdAt) >= monthStart
      );

    return {
      creatorEmail: key,
      creatorName: name,
      activeExclusiveSubscribers: exclusiveSubs,
      exclusiveRevenue,
      globalRevenue: rankEntry?.globalPayout || 0,
      totalPending: pending.reduce((s, p) => s + p.totalAmount, 0),
      totalPaid: paid.reduce((s, p) => s + p.totalAmount, 0),
      payoutStatus: latestPayout?.status || 'pending',
      lastPaymentAt: paid.sort((a, b) => (b.paidAt || '').localeCompare(a.paidAt || ''))[0]?.paidAt,
      rankingPoints: rankEntry?.points || 0,
      rankingPosition: rankPos || 0,
      likes: rankEntry?.likes || 0,
      comments: rankEntry?.comments || 0,
      monthlyRevenue: monthTx.reduce((s, t) => s + t.amount, 0),
      accumulatedRevenue:
        exclusiveRevenue + (rankEntry?.globalPayout || 0) + paid.reduce((s, p) => s + p.totalAmount, 0),
    };
  }).sort((a, b) => b.totalPending + b.exclusiveRevenue + b.globalRevenue - (a.totalPending + a.exclusiveRevenue + a.globalRevenue));
}

export function simulateMonthClose(periodMonth = periodMonthKey()): MonthCloseSimulation {
  const dashboard = computeFinanceDashboard();
  const ranking = computeCreatorRanking(periodMonth);
  const stats = computeSubscriptionStats(periodMonth);
  const globalPool = stats.activeGlobal * GLOBAL_CREATOR_POOL_SHARE;
  const exclusivePlatform = stats.activeExclusive * EXCLUSIVE_PLATFORM_SHARE;
  const globalPlatform = stats.activeGlobal * GLOBAL_PLATFORM_SHARE;

  const creatorPayouts = ranking.map((r) => {
    const exclusiveSubs = localDb
      .getPlatformSubscriptions()
      .filter(
        (s) =>
          s.plan === 'exclusive' &&
          s.status === 'active' &&
          s.creatorEmail?.toLowerCase() === r.creatorEmail.toLowerCase()
      ).length;
    const exclusiveRevenue = exclusiveSubs * EXCLUSIVE_CREATOR_SHARE;
    return {
      creatorEmail: r.creatorEmail,
      creatorName: r.creatorName,
      exclusiveRevenue,
      globalRevenue: r.globalPayout,
      totalAmount: exclusiveRevenue + r.globalPayout,
      rankingPoints: r.points,
      rankingSharePercent: r.sharePercent,
    };
  });

  const creatorsWithExclusiveOnly = new Set(
    localDb
      .getPlatformSubscriptions()
      .filter((s) => s.plan === 'exclusive' && s.status === 'active' && s.creatorEmail)
      .map((s) => s.creatorEmail!.toLowerCase())
  );
  for (const email of creatorsWithExclusiveOnly) {
    if (creatorPayouts.some((p) => p.creatorEmail === email)) continue;
    const subs = localDb
      .getPlatformSubscriptions()
      .filter((s) => s.plan === 'exclusive' && s.status === 'active' && s.creatorEmail?.toLowerCase() === email);
    const user = localDb.findUsuarioByEmailSync(email);
    const exclusiveRevenue = subs.length * EXCLUSIVE_CREATOR_SHARE;
    creatorPayouts.push({
      creatorEmail: email,
      creatorName: user?.username || email,
      exclusiveRevenue,
      globalRevenue: 0,
      totalAmount: exclusiveRevenue,
      rankingPoints: 0,
      rankingSharePercent: 0,
    });
  }

  return {
    periodMonth,
    grossTotal: dashboard.grossTotal,
    monthGrossRevenue: stats.exclusiveRevenue + stats.globalRevenue,
    platformRevenue: exclusivePlatform + globalPlatform,
    creatorsPoolRevenue: globalPool + creatorPayouts.reduce((s, p) => s + p.exclusiveRevenue, 0),
    totalRankingPoints: ranking.reduce((s, r) => s + r.points, 0),
    subscriptions: stats,
    ranking,
    creatorPayouts: creatorPayouts.filter((p) => p.totalAmount > 0),
  };
}

export function confirmMonthClose(periodMonth: string, adminEmail: string): MonthlyCloseRecord {
  const existing = localDb.getMonthlyCloses().find((m) => m.periodMonth === periodMonth && !m.isSimulation);
  if (existing) {
    throw new Error(`O mês ${periodMonth} já foi fechado.`);
  }

  const simulation = simulateMonthClose(periodMonth);
  const now = new Date().toISOString();

  const payouts = simulation.creatorPayouts.map((p) => ({
    id: uid('pay'),
    creatorEmail: p.creatorEmail,
    creatorName: p.creatorName,
    periodMonth,
    exclusiveRevenue: p.exclusiveRevenue,
    globalRevenue: p.globalRevenue,
    totalAmount: p.totalAmount,
    status: 'pending' as const,
    rankingPoints: p.rankingPoints,
    rankingSharePercent: p.rankingSharePercent,
    createdAt: now,
    updatedAt: now,
  }));

  const record: MonthlyCloseRecord = {
    id: uid('close'),
    periodMonth,
    grossRevenue: simulation.grossTotal,
    monthGrossRevenue: simulation.monthGrossRevenue,
    platformRevenue: simulation.platformRevenue,
    creatorsPoolRevenue: simulation.creatorsPoolRevenue,
    totalRankingPoints: simulation.totalRankingPoints,
    activeExclusiveSubscriptions: simulation.subscriptions.activeExclusive,
    activeGlobalSubscriptions: simulation.subscriptions.activeGlobal,
    newSubscriptions: simulation.subscriptions.newThisMonth,
    cancellations: simulation.subscriptions.cancellationsThisMonth,
    ranking: simulation.ranking,
    payouts,
    closedAt: now,
    closedBy: adminEmail,
  };

  localDb.saveMonthlyClose(record);
  for (const payout of payouts) {
    localDb.saveCreatorPayout(payout);
  }

  return record;
}

export function getCreatorDetail(email: string) {
  const key = email.toLowerCase();
  const summary = computeCreatorSummaries().find((c) => c.creatorEmail === key);
  const payouts = localDb.getCreatorPayouts().filter((p) => p.creatorEmail.toLowerCase() === key);
  const closes = localDb.getMonthlyCloses();
  const ranking = computeCreatorRanking();
  const rankEntry = ranking.find((r) => r.creatorEmail === key);

  const revenueGrowth = closes
    .filter((c) => !c.isSimulation)
    .map((c) => ({
      month: c.periodMonth,
      exclusive: payouts
        .filter((p) => p.periodMonth === c.periodMonth)
        .reduce((s, p) => s + p.exclusiveRevenue, 0),
      global: payouts
        .filter((p) => p.periodMonth === c.periodMonth)
        .reduce((s, p) => s + p.globalRevenue, 0),
    }));

  return {
    summary: summary || null,
    ranking: rankEntry || null,
    payouts,
    monthlyCloses: closes.filter((c) => c.payouts.some((p) => p.creatorEmail.toLowerCase() === key)),
    revenueGrowth,
    transactions: localDb
      .getFinanceTransactions()
      .filter((t) => t.creatorEmail?.toLowerCase() === key || t.type === 'global_subscription')
      .slice(0, 50),
  };
}

export function updatePayoutStatus(payoutId: string, status: PayoutStatus, adminEmail: string) {
  const payout = localDb.getCreatorPayouts().find((p) => p.id === payoutId);
  if (!payout) return null;
  const updated = {
    ...payout,
    status,
    paidAt: status === 'paid' ? new Date().toISOString() : payout.paidAt,
    updatedAt: new Date().toISOString(),
  };
  localDb.saveCreatorPayout(updated);
  localDb.appendAuditLog({
    actorEmail: adminEmail,
    action: 'update_payout_status',
    targetType: 'creator_payout',
    targetId: payoutId,
    details: `${status} · ${payout.creatorEmail}`,
  });
  return updated;
}

export { periodMonthKey, prevPeriodMonthKey };
