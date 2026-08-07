export type SubscriptionPlan = 'exclusive' | 'global';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';
export type PayoutStatus = 'pending' | 'processing' | 'paid';
export type ClipAccessLevel = 'public' | 'exclusive' | 'timed_exclusive';

export interface FinanceTransaction {
  id: string;
  type: 'exclusive_subscription' | 'global_subscription' | 'donation' | 'refund';
  plan?: SubscriptionPlan;
  amount: number;
  currency: 'BRL';
  subscriberEmail: string;
  creatorEmail?: string;
  status: 'completed' | 'pending' | 'refunded';
  createdAt: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface PlatformSubscription {
  id: string;
  plan: SubscriptionPlan;
  subscriberEmail: string;
  creatorEmail?: string;
  status: SubscriptionStatus;
  amount: number;
  startedAt: string;
  cancelledAt?: string;
  expiresAt?: string;
  lastPaymentAt: string;
  checkoutId?: string;
  providerPaymentId?: string;
}

export interface CreatorPayout {
  id: string;
  creatorEmail: string;
  creatorName: string;
  periodMonth: string;
  exclusiveRevenue: number;
  globalRevenue: number;
  totalAmount: number;
  status: PayoutStatus;
  rankingPoints?: number;
  rankingSharePercent?: number;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyCloseRecord {
  id: string;
  periodMonth: string;
  grossRevenue: number;
  monthGrossRevenue: number;
  platformRevenue: number;
  creatorsPoolRevenue: number;
  totalRankingPoints: number;
  activeExclusiveSubscriptions: number;
  activeGlobalSubscriptions: number;
  newSubscriptions: number;
  cancellations: number;
  ranking: CreatorRankingEntry[];
  payouts: CreatorPayout[];
  closedAt: string;
  closedBy: string;
  isSimulation?: boolean;
}

export interface CreatorRankingEntry {
  creatorEmail: string;
  creatorName: string;
  likes: number;
  comments: number;
  points: number;
  sharePercent: number;
  globalPayout: number;
}

export interface CreatorFinanceSummary {
  creatorEmail: string;
  creatorName: string;
  activeExclusiveSubscribers: number;
  exclusiveRevenue: number;
  globalRevenue: number;
  totalPending: number;
  totalPaid: number;
  payoutStatus: PayoutStatus;
  lastPaymentAt?: string;
  rankingPoints: number;
  rankingPosition: number;
  likes: number;
  comments: number;
  monthlyRevenue: number;
  accumulatedRevenue: number;
}

export interface FinanceDashboard {
  grossTotal: number;
  grossToday: number;
  grossWeek: number;
  grossMonth: number;
  grossYear: number;
  growthDay: number;
  growthWeek: number;
  growthMonth: number;
  growthYear: number;
  revenueByDay: { date: string; amount: number }[];
  revenueByMonth: { month: string; amount: number }[];
  subscriptions: SubscriptionStats;
}

export interface SubscriptionStats {
  activeTotal: number;
  activeExclusive: number;
  activeGlobal: number;
  newThisMonth: number;
  cancellationsThisMonth: number;
  exclusiveRevenue: number;
  globalRevenue: number;
}

export interface GlobalDistributionSummary {
  periodMonth: string;
  grossGlobalRevenue: number;
  platformShare: number;
  creatorsPool: number;
  totalPoints: number;
  activeGlobalSubscriptions: number;
  ranking: CreatorRankingEntry[];
}

export interface MonthCloseSimulation {
  periodMonth: string;
  grossTotal: number;
  monthGrossRevenue: number;
  platformRevenue: number;
  creatorsPoolRevenue: number;
  totalRankingPoints: number;
  subscriptions: SubscriptionStats;
  ranking: CreatorRankingEntry[];
  creatorPayouts: {
    creatorEmail: string;
    creatorName: string;
    exclusiveRevenue: number;
    globalRevenue: number;
    totalAmount: number;
    rankingPoints: number;
    rankingSharePercent: number;
  }[];
}

export type SubscriptionCheckoutStatus = 'pending' | 'completed' | 'cancelled' | 'expired';

export interface SubscriptionCheckout {
  id: string;
  plan: SubscriptionPlan;
  subscriberEmail: string;
  creatorEmail?: string;
  amount: number;
  currency: 'BRL';
  status: SubscriptionCheckoutStatus;
  paymentProvider: 'mercado_pago';
  externalReference: string;
  paymentLink: string;
  providerPaymentId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface SubscriberEntitlements {
  global: boolean;
  exclusiveCreators: string[];
  checkouts: SubscriptionCheckout[];
  subscriptions: PlatformSubscription[];
}
