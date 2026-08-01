import { localDb } from '../db/local_db.ts';
import type { PaymentRecord } from '../types/admin.ts';
import { DONOR_VIP_ITEMS, DONOR_VIP_REWARD_IDS } from '../data/rewardsCatalog.ts';
import { unlockReward, hasReward } from './rewardsEngine.ts';
import type { GamificationProfile } from '../types/gamification.ts';

export { DONOR_VIP_REWARD_IDS };

export function grantDonorVipBenefits(email: string, source = 'vip-donation'): GamificationProfile {
  const normalized = email.toLowerCase().trim();
  localDb.updateUsuario(normalized, { isDonor: true });

  const profile = localDb.getGamificationProfile(normalized);
  for (const itemId of DONOR_VIP_REWARD_IDS) {
    unlockReward(profile, itemId, 'donation', source);
  }

  if (hasReward(profile, 'theme-apoiador-cinereact')) {
    profile.loadout.theme = 'theme-apoiador-cinereact';
  }
  if (hasReward(profile, 'frame-apoiador-cinereact')) {
    profile.loadout.frame = 'frame-apoiador-cinereact';
  }
  if (hasReward(profile, 'title-apoiador-cinereact')) {
    profile.loadout.title = 'title-apoiador-cinereact';
  }
  if (hasReward(profile, 'badge-apoiador-vip')) {
    const badges = profile.loadout.badges.filter((id) => id !== 'badge-apoiador-vip');
    profile.loadout.badges = ['badge-apoiador-vip', ...badges].slice(0, 2);
  }

  profile.updatedAt = new Date().toISOString();
  localDb.saveGamificationProfile(profile);
  return profile;
}

export function recordDonationPayment(email: string, amount: number, requestId: string) {
  const config = localDb.getAdminConfig();
  const payment: PaymentRecord = {
    id: `pay-${requestId}`,
    userEmail: email.toLowerCase(),
    amount,
    currency: 'BRL',
    description: 'Apoiador VIP CineReact',
    status: 'completed',
    createdAt: new Date().toISOString(),
  };
  config.payments.unshift(payment);
  localDb.saveAdminConfig(config);
}

export function getDonorRewardPreviews() {
  return DONOR_VIP_ITEMS.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    rarity: item.rarity,
  }));
}
