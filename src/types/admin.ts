import type { AchievementDefinition } from './gamification.ts';

export type StaffRole = 'user' | 'moderator' | 'curator' | 'admin';

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'hidden';

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HomePin {
  id: string;
  type: 'react' | 'obra' | 'canal';
  targetId: string;
  label?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface ScheduledItem {
  id: string;
  type: 'react' | 'obra' | 'banner' | 'announcement';
  targetId: string;
  title: string;
  publishAt: string;
  isLaunch: boolean;
  isFeatured: boolean;
  createdAt: string;
  createdBy: string;
}

export interface ContentReport {
  id: string;
  type: 'comment' | 'user' | 'video' | 'channel';
  targetId: string;
  targetLabel: string;
  reporterEmail: string;
  reason: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

export interface AdminAuditLog {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface PlatformSettings {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
  globalBannerText: string;
  globalBannerEnabled: boolean;
  globalBannerLink: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  socialYoutube: string;
  socialInstagram: string;
  socialTwitter: string;
  socialDiscord: string;
  apiYoutubeKey: string;
  apiSupabaseUrl: string;
  apiSupabaseAnonKey: string;
  autoBackupEnabled: boolean;
  autoBackupIntervalHours: number;
}

export interface XpBonusEvent {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  bonusXp: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminCoupon {
  id: string;
  code: string;
  discountPercent: number;
  description: string;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PremiumSubscription {
  id: string;
  userEmail: string;
  plan: 'monthly' | 'yearly' | 'lifetime';
  status: 'active' | 'cancelled' | 'expired';
  startedAt: string;
  expiresAt?: string;
  amount: number;
}

export interface PaymentRecord {
  id: string;
  userEmail: string;
  amount: number;
  currency: string;
  description: string;
  status: 'completed' | 'pending' | 'refunded';
  createdAt: string;
}

export interface BackupRecord {
  id: string;
  label: string;
  sizeBytes: number;
  createdAt: string;
  createdBy: string;
  auto: boolean;
}

export interface AdminConfig {
  categories: AdminCategory[];
  blockedWords: string[];
  reports: ContentReport[];
  auditLogs: AdminAuditLog[];
  settings: PlatformSettings;
  homePins: HomePin[];
  scheduledItems: ScheduledItem[];
  xpEvents: XpBonusEvent[];
  customAchievements: AchievementDefinition[];
  coupons: AdminCoupon[];
  subscriptions: PremiumSubscription[];
  payments: PaymentRecord[];
  backups: BackupRecord[];
}

export interface AdminAnalytics {
  totals: {
    users: number;
    reacts: number;
    obras: number;
    comments: number;
    views: number;
    activeUsers7d: number;
    newUsersToday: number;
    newUsersWeek: number;
    newUsersMonth: number;
  };
  topVideos: { id: string; titulo: string; canalNome: string; visualizacoes: number }[];
  topChannels: { id: string; titulo: string; reactCount: number }[];
  topCommented: { obraId: string; titulo: string; count: number }[];
  dailySignups: { date: string; count: number }[];
  trafficSources: { source: string; visits: number }[];
  avgSessionMinutes: number;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  siteName: 'CineReact',
  logoUrl: '/cinereact-logo.svg',
  faviconUrl: '/cinereact-icon.svg',
  primaryColor: '#111113',
  accentColor: '#00d4ff',
  globalBannerText: '',
  globalBannerEnabled: false,
  globalBannerLink: '',
  maintenanceMode: false,
  maintenanceMessage: 'Estamos em manutenção. Voltamos em breve!',
  seoTitle: 'CineReact — Sua plataforma de reacts',
  seoDescription: 'Descubra, organize e acompanhe reacts de filmes, séries, animes e jogos no CineReact.',
  seoKeywords: 'cinereact, reacts, filmes, séries, animes, jogos, comunidade',
  socialYoutube: '',
  socialInstagram: '',
  socialTwitter: '',
  socialDiscord: '',
  apiYoutubeKey: '',
  apiSupabaseUrl: '',
  apiSupabaseAnonKey: '',
  autoBackupEnabled: true,
  autoBackupIntervalHours: 24,
};

export function createDefaultAdminConfig(): AdminConfig {
  return {
    categories: [
      { id: 'filme', name: 'Filmes', slug: 'filme', icon: 'Film', order: 0, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'serie', name: 'Séries', slug: 'serie', icon: 'Tv', order: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'anime', name: 'Animes', slug: 'anime', icon: 'Clapperboard', order: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'jogo', name: 'Jogos', slug: 'jogo', icon: 'Gamepad2', order: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    blockedWords: [],
    reports: [],
    auditLogs: [],
    settings: { ...DEFAULT_PLATFORM_SETTINGS },
    homePins: [],
    scheduledItems: [],
    xpEvents: [],
    customAchievements: [],
    coupons: [],
    subscriptions: [],
    payments: [],
    backups: [],
  };
}
