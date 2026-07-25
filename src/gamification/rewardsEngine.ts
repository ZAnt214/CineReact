import {
  CREATOR_FOLLOW_REWARDS,
  getRewardById,
  PROMO_CODES,
  REWARDS_CATALOG,
} from '../data/rewardsCatalog.ts';
import type {
  GamificationProfile,
  InventoryItemView,
  ProfileLoadout,
  RewardItemDefinition,
  UnlockMethod,
} from '../types/gamification.ts';
import { LOADOUT_SLOTS, ACTIVE_COSMETIC_CATEGORIES } from '../types/gamification.ts';
import { sanitizeLoadout } from './profileDisplay.ts';

const DEFAULT_LOADOUT = (): ProfileLoadout => ({ tags: [], badges: [] });

/** Conta do dono da plataforma — recebe desbloqueio total do catálogo */
export const FULL_UNLOCK_OWNER_EMAIL = 'mateusvini.t10@gmail.com';

export function migrateProfile(profile: GamificationProfile): GamificationProfile {
  if (!profile.inventory) {
    const legacy = profile.unlockedCosmetics || ['frame-amber'];
    profile.inventory = legacy.map((itemId) => ({
      itemId,
      unlockedAt: profile.createdAt || new Date().toISOString(),
      unlockMethod: 'legacy' as UnlockMethod,
    }));
  }

  if (!profile.loadout) {
    const eq = profile.equippedCosmetics || {};
    profile.loadout = sanitizeLoadout({
      frame: eq.frame,
      title: eq.title,
      theme: eq.theme,
    });
  } else {
    profile.loadout = sanitizeLoadout(profile.loadout);
  }

  if (!profile.redeemedCodes) profile.redeemedCodes = [];
  if (!profile.stats.creatorWatchCounts) profile.stats.creatorWatchCounts = {};

  return profile;
}

export function hasReward(profile: GamificationProfile, itemId: string): boolean {
  return profile.inventory.some((e) => e.itemId === itemId);
}

export function unlockAllCatalogRewards(profile: GamificationProfile): number {
  migrateProfile(profile);
  const now = new Date().toISOString();
  let added = 0;

  for (const item of REWARDS_CATALOG) {
    if (!hasReward(profile, item.id)) {
      profile.inventory.push({
        itemId: item.id,
        unlockedAt: now,
        unlockMethod: 'legacy',
        unlockSource: 'owner_full_unlock',
      });
      added++;
    }
  }

  for (const promo of PROMO_CODES) {
    if (!profile.redeemedCodes.includes(promo.code)) {
      unlockReward(profile, promo.rewardItemId, 'promo_code', promo.code);
      profile.redeemedCodes.push(promo.code);
    }
  }

  if (added > 0) profile.updatedAt = now;
  return added;
}

export function ensureOwnerFullUnlock(profile: GamificationProfile): void {
  if (profile.email.toLowerCase() !== FULL_UNLOCK_OWNER_EMAIL) return;
  unlockAllCatalogRewards(profile);
}

export function unlockReward(
  profile: GamificationProfile,
  itemId: string,
  method: UnlockMethod,
  source?: string
): RewardItemDefinition | null {
  migrateProfile(profile);
  const item = getRewardById(itemId);
  if (!item || hasReward(profile, itemId)) return null;

  profile.inventory.push({
    itemId,
    unlockedAt: new Date().toISOString(),
    unlockMethod: method,
    unlockSource: source,
  });
  profile.updatedAt = new Date().toISOString();
  return item;
}

export function buildInventoryView(profile: GamificationProfile): InventoryItemView[] {
  migrateProfile(profile);

  const isEquipped = (id: string, cat: string): boolean => {
    const slot = LOADOUT_SLOTS[cat as keyof typeof LOADOUT_SLOTS];
    if (!slot) return false;
    const val = profile.loadout[slot.loadoutKey];
    if (Array.isArray(val)) return val.includes(id);
    return val === id;
  };

  return REWARDS_CATALOG.filter((item) =>
    (ACTIVE_COSMETIC_CATEGORIES as readonly string[]).includes(item.category)
  ).map((item) => {
    const entry = profile.inventory.find((e) => e.itemId === item.id);
    return {
      ...item,
      owned: !!entry,
      equipped: isEquipped(item.id, item.category),
      unlockedAt: entry?.unlockedAt,
      unlockMethod: entry?.unlockMethod,
      unlockSource: entry?.unlockSource,
    };
  });
}

export function equipReward(
  profile: GamificationProfile,
  itemId: string
): { success: boolean; error?: string } {
  migrateProfile(profile);
  const item = getRewardById(itemId);
  if (!item) return { success: false, error: 'Item não encontrado.' };
  if (!hasReward(profile, itemId)) return { success: false, error: 'Item não desbloqueado.' };

  const slot = LOADOUT_SLOTS[item.category as keyof typeof LOADOUT_SLOTS];
  if (!slot) return { success: false, error: 'Categoria não disponível.' };

  const key = slot.loadoutKey;
  const current = profile.loadout[key];

  if (Array.isArray(current)) {
    if (current.includes(itemId)) {
      profile.loadout[key] = current.filter((id) => id !== itemId) as never;
    } else {
      profile.loadout[key] = [...current, itemId].slice(-slot.max) as never;
    }
  } else if (current === itemId) {
    delete profile.loadout[key];
  } else {
    (profile.loadout as Record<string, unknown>)[key] = itemId;
  }

  profile.updatedAt = new Date().toISOString();
  return { success: true };
}

export function unequipReward(
  profile: GamificationProfile,
  itemId: string
): { success: boolean; error?: string } {
  migrateProfile(profile);
  const item = getRewardById(itemId);
  if (!item) return { success: false, error: 'Item não encontrado.' };

  const slot = LOADOUT_SLOTS[item.category as keyof typeof LOADOUT_SLOTS];
  if (!slot) return { success: false, error: 'Categoria não disponível.' };

  const key = slot.loadoutKey;
  const current = profile.loadout[key];

  if (Array.isArray(current)) {
    profile.loadout[key] = current.filter((id) => id !== itemId) as never;
  } else if (current === itemId) {
    delete profile.loadout[key];
  }

  profile.updatedAt = new Date().toISOString();
  return { success: true };
}

export function saveLoadout(
  profile: GamificationProfile,
  loadout: ProfileLoadout
): { success: boolean; error?: string } {
  migrateProfile(profile);

  const clean = sanitizeLoadout(loadout);

  for (const [cat, slot] of Object.entries(LOADOUT_SLOTS)) {
    const key = slot.loadoutKey;
    const val = clean[key];
    if (val === undefined) continue;

    if (Array.isArray(val)) {
      for (const id of val) {
        const item = getRewardById(id);
        if (!item || item.category !== cat || !hasReward(profile, id)) {
          return { success: false, error: `Item inválido: ${id}` };
        }
      }
      if (val.length > slot.max) {
        return { success: false, error: `Máximo ${slot.max} itens em ${cat}.` };
      }
    } else if (typeof val === 'string') {
      const item = getRewardById(val);
      if (!item || item.category !== cat || !hasReward(profile, val)) {
        return { success: false, error: `Item inválido: ${val}` };
      }
    }
  }

  profile.loadout = clean;
  profile.updatedAt = new Date().toISOString();
  return { success: true };
}

export function purchaseReward(
  profile: GamificationProfile,
  itemId: string
): { success: boolean; error?: string; item?: RewardItemDefinition } {
  migrateProfile(profile);
  const item = getRewardById(itemId);
  if (!item) return { success: false, error: 'Item não encontrado.' };

  if (hasReward(profile, itemId)) {
    equipReward(profile, itemId);
    return { success: true, item };
  }

  if (item.unlockMethod !== 'shop' && item.cost === 0) {
    return { success: false, error: 'Este item não pode ser comprado.' };
  }

  if (item.cost > 0) {
    if (profile.spotlight < item.cost) {
      return { success: false, error: 'Spotlight insuficiente.' };
    }
    profile.spotlight -= item.cost;
  }

  unlockReward(profile, itemId, 'shop');
  equipReward(profile, itemId);
  return { success: true, item };
}

export function redeemPromoCode(
  profile: GamificationProfile,
  code: string
): { success: boolean; error?: string; item?: RewardItemDefinition } {
  migrateProfile(profile);
  const normalized = code.trim().toUpperCase();
  const promo = PROMO_CODES.find((p) => p.code === normalized);
  if (!promo) return { success: false, error: 'Código inválido.' };
  if (profile.redeemedCodes.includes(normalized)) {
    return { success: false, error: 'Código já resgatado.' };
  }
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return { success: false, error: 'Código expirado.' };
  }

  const item = unlockReward(profile, promo.rewardItemId, 'promo_code', normalized);
  if (!item) {
    if (hasReward(profile, promo.rewardItemId)) {
      return { success: false, error: 'Você já possui esta recompensa.' };
    }
    return { success: false, error: 'Recompensa não encontrada.' };
  }

  profile.redeemedCodes.push(normalized);
  return { success: true, item };
}

export function checkCreatorFollowReward(
  profile: GamificationProfile,
  creatorId: string
): RewardItemDefinition | null {
  migrateProfile(profile);
  const itemId = CREATOR_FOLLOW_REWARDS[creatorId];
  if (!itemId) return null;
  return unlockReward(profile, itemId, 'follow_creator', creatorId);
}

export function checkCreatorWatchRewards(
  profile: GamificationProfile,
  creatorId: string
): RewardItemDefinition[] {
  migrateProfile(profile);
  const counts = profile.stats.creatorWatchCounts || {};
  const watches = counts[creatorId] || 0;
  const reqs = CREATOR_WATCH_REQUIREMENTS[creatorId] || [];
  const unlocked: RewardItemDefinition[] = [];

  for (const req of reqs) {
    if (watches >= req.watches) {
      const item = unlockReward(profile, req.itemId, 'watch_creator', creatorId);
      if (item) unlocked.push(item);
    }
  }
  return unlocked;
}

export function incrementCreatorWatch(
  profile: GamificationProfile,
  creatorId: string
): RewardItemDefinition[] {
  migrateProfile(profile);
  if (!profile.stats.creatorWatchCounts) profile.stats.creatorWatchCounts = {};
  profile.stats.creatorWatchCounts[creatorId] = (profile.stats.creatorWatchCounts[creatorId] || 0) + 1;
  return checkCreatorWatchRewards(profile, creatorId);
}

export function resolveCreatorId(canalNome: string, obraId?: string): string | null {
  if (obraId && CREATOR_FOLLOW_REWARDS[obraId]) return obraId;

  for (const creatorId of Object.keys(CREATOR_FOLLOW_REWARDS)) {
    const tagId = CREATOR_FOLLOW_REWARDS[creatorId];
    const tag = getRewardById(tagId);
    if (tag?.creatorName?.toLowerCase() === canalNome.toLowerCase()) return creatorId;
  }

  const normalized = canalNome.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const creatorId of Object.keys(CREATOR_FOLLOW_REWARDS)) {
    if (creatorId.replace(/[^a-z0-9]/g, '').includes(normalized.slice(0, 6))) return creatorId;
  }
  return null;
}

export function getOwnedInventory(profile: GamificationProfile): InventoryItemView[] {
  return buildInventoryView(profile).filter((i) => i.owned);
}

export function getLoadoutPreviewStyles(loadout: ProfileLoadout) {
  const frame = loadout.frame ? getRewardById(loadout.frame) : null;
  const theme = loadout.theme ? getRewardById(loadout.theme) : null;

  return {
    frameClass: frame?.previewClass || 'ring-2 ring-zinc-700',
    themeClass: theme?.previewGradient ? `bg-gradient-to-br ${theme.previewGradient}` : '',
  };
}
