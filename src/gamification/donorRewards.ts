import { localDb } from '../db/local_db.ts';
import type { PaymentRecord } from '../types/admin.ts';
import { DONOR_VIP_REWARD_IDS, DONOR_TAG_ID } from '../data/rewardsCatalog.ts';
import { unlockReward, hasReward } from './rewardsEngine.ts';
import type { GamificationProfile } from '../types/gamification.ts';

export { DONOR_VIP_REWARD_IDS, DONOR_TAG_ID };

export function grantDonorVipBenefits(email: string, source = 'vip-donation'): GamificationProfile {
  const normalized = email.toLowerCase().trim();
  localDb.updateUsuario(normalized, { isDonor: true });

  const profile = localDb.getGamificationProfile(normalized);
  for (const itemId of DONOR_VIP_REWARD_IDS) {
    unlockReward(profile, itemId, 'donation', source);
  }

  equipDonorLoadout(profile);
  profile.updatedAt = new Date().toISOString();
  localDb.saveGamificationProfile(profile);
  return profile;
}

function equipDonorLoadout(profile: GamificationProfile) {
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
  if (hasReward(profile, DONOR_TAG_ID)) {
    const tags = (profile.loadout.tags || []).filter((id) => id !== DONOR_TAG_ID);
    profile.loadout.tags = [DONOR_TAG_ID, ...tags].slice(0, 3);
  }
}

/** Garante que apoiadores tenham todos os cosméticos VIP desbloqueados e a tag equipada. */
export function ensureDonorRewardsSynced(profile: GamificationProfile, source = 'vip-sync'): boolean {
  let changed = false;
  for (const itemId of DONOR_VIP_REWARD_IDS) {
    if (!hasReward(profile, itemId)) {
      unlockReward(profile, itemId, 'donation', source);
      changed = true;
    }
  }
  const hadTag = (profile.loadout.tags || []).includes(DONOR_TAG_ID);
  equipDonorLoadout(profile);
  if (!hadTag && (profile.loadout.tags || []).includes(DONOR_TAG_ID)) {
    changed = true;
  }
  return changed;
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
