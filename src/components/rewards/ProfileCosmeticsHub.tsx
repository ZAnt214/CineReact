import React, { useEffect, useMemo, useState } from 'react';
import {
  Save, RotateCcw, Sparkles, Eye, X, Trash2, Search, Filter,
  Package, Lock, Check, Palette,
} from 'lucide-react';
import {
  CATEGORY_LABELS, CATEGORY_INFO, RARITY_ORDER, RARITY_STYLES,
} from '../../data/rewardsCatalog.ts';
import { RewardPreviewModal, RewardPreviewThumb } from './RewardPreview.tsx';
import RewardObtainInfo from './RewardObtainInfo.tsx';
import ProfileAvatar from '../profile/ProfileAvatar.tsx';
import ProfileSurface from '../profile/ProfileSurface.tsx';
import ProfileNameRow from '../profile/ProfileNameRow.tsx';
import type { InventoryItemView, ProfileLoadout, RewardCategory } from '../../types/gamification.ts';
import { ACTIVE_COSMETIC_CATEGORIES, LOADOUT_SLOTS } from '../../types/gamification.ts';
import type { UserState } from '../../types.ts';

const EMPTY_LOADOUT = (): ProfileLoadout => ({ tags: [], badges: [] });

const SLOT_META: { key: keyof ProfileLoadout; cat: string; label: string }[] = [
  { key: 'theme', cat: 'theme', label: 'Tema' },
  { key: 'frame', cat: 'frame', label: 'Moldura' },
  { key: 'title', cat: 'title', label: 'Título' },
  { key: 'avatar', cat: 'avatar', label: 'Avatar' },
  { key: 'tags', cat: 'tag', label: 'Tags' },
  { key: 'badges', cat: 'badge', label: 'Emblemas' },
  { key: 'reaction', cat: 'reaction', label: 'Reação' },
  { key: 'emoji', cat: 'emoji', label: 'Emoji' },
];

const CATEGORY_TABS: (RewardCategory | 'all')[] = [
  'all', 'theme', 'frame', 'title', 'avatar', 'tag', 'badge', 'reaction', 'emoji',
];

interface ProfileCosmeticsHubProps {
  user: UserState;
  inventory: InventoryItemView[];
  loadout: ProfileLoadout;
  spotlight: number;
  onSave: (loadout: ProfileLoadout) => Promise<boolean>;
  onPurchase: (id: string) => Promise<boolean>;
  onRedeemCode: (code: string) => Promise<boolean>;
}

function isEquippedInDraft(draft: ProfileLoadout, item: InventoryItemView): boolean {
  const slot = LOADOUT_SLOTS[item.category as keyof typeof LOADOUT_SLOTS];
  if (!slot) return false;
  const val = draft[slot.loadoutKey];
  if (Array.isArray(val)) return val.includes(item.id);
  return val === item.id;
}

export default function ProfileCosmeticsHub({
  user,
  inventory,
  loadout,
  spotlight,
  onSave,
  onPurchase,
  onRedeemCode,
}: ProfileCosmeticsHubProps) {
  const [draft, setDraft] = useState<ProfileLoadout>(loadout);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewItem, setPreviewItem] = useState<InventoryItemView | null>(null);
  const [category, setCategory] = useState<RewardCategory | 'all'>('all');
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    setDraft(loadout);
  }, [loadout]);

  const items = useMemo(
    () => inventory.filter((i) =>
      (ACTIVE_COSMETIC_CATEGORIES as readonly string[]).includes(i.category)
    ),
    [inventory]
  );

  const filtered = useMemo(() => {
    return items
      .filter((i) => (category === 'all' ? true : i.category === category))
      .filter((i) => (ownedOnly ? i.owned : true))
      .filter((i) =>
        !search ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.description.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (a.owned !== b.owned) return a.owned ? -1 : 1;
        return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
      });
  }, [items, category, ownedOnly, search]);

  const equippedItems = useMemo(() => {
    const result: { slot: keyof ProfileLoadout; item: InventoryItemView }[] = [];
    for (const { key } of SLOT_META) {
      const val = draft[key];
      if (Array.isArray(val)) {
        val.forEach((id) => {
          const item = inventory.find((i) => i.id === id);
          if (item) result.push({ slot: key, item });
        });
      } else if (typeof val === 'string' && val) {
        const item = inventory.find((i) => i.id === val);
        if (item) result.push({ slot: key, item });
      }
    }
    return result;
  }, [draft, inventory]);

  const toggleItem = (item: InventoryItemView) => {
    if (!item.owned) return;
    const slot = LOADOUT_SLOTS[item.category as keyof typeof LOADOUT_SLOTS];
    if (!slot) return;
    const key = slot.loadoutKey;

    setDraft((prev) => {
      const next = { ...prev, tags: [...prev.tags], badges: [...prev.badges] };
      if (Array.isArray(next[key])) {
        const arr = next[key] as string[];
        if (arr.includes(item.id)) {
          (next as Record<string, unknown>)[key] = arr.filter((id) => id !== item.id);
        } else {
          (next as Record<string, unknown>)[key] = [...arr, item.id].slice(-slot.max);
        }
      } else {
        const current = next[key];
        (next as Record<string, unknown>)[key] = current === item.id ? undefined : item.id;
      }
      return next;
    });
    setSaved(false);
  };

  const removeFromDraft = (slot: keyof ProfileLoadout, itemId?: string) => {
    setDraft((prev) => {
      const next = { ...prev, tags: [...prev.tags], badges: [...prev.badges] };
      if (itemId && Array.isArray(next[slot])) {
        (next as Record<string, unknown>)[slot] = (next[slot] as string[]).filter((id) => id !== itemId);
      } else if (Array.isArray(next[slot])) {
        (next as Record<string, unknown>)[slot] = [];
      } else {
        delete (next as Record<string, unknown>)[slot];
      }
      return next;
    });
    setSaved(false);
  };

  const clearAll = () => {
    setDraft(EMPTY_LOADOUT());
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(draft);
    setSaving(false);
    if (ok) setSaved(true);
  };

  const handleRedeem = async () => {
    if (!promoCode.trim()) return;
    setRedeeming(true);
    await onRedeemCode(promoCode.trim());
    setPromoCode('');
    setRedeeming(false);
  };

  const ownedCount = items.filter((i) => i.owned).length;
  const hasChanges = JSON.stringify(draft) !== JSON.stringify(loadout);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8">
        {/* Preview column */}
        <div className="xl:col-span-4 xl:sticky xl:top-24 xl:self-start space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-400" />
              Seu perfil
            </h2>
            {hasChanges && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Não salvo</span>
            )}
          </div>

          <ProfileSurface loadout={draft} variant="preview" className="min-h-[360px]">
            <div className="flex flex-col items-center text-center">
              <ProfileAvatar photoUrl={user.avatar} alt={user.nome} size="lg" loadout={draft} className="mb-4" />
              <ProfileNameRow name={user.nome} loadout={draft} className="w-full flex flex-col items-center" />
              {draft.badges.length > 0 && (
                <div className="flex gap-2 mt-4 flex-wrap justify-center">
                  {draft.badges.map((id) => {
                    const b = inventory.find((i) => i.id === id);
                    return b ? (
                      <span key={id} title={b.name}>
                        <RewardPreviewThumb item={b} size="sm" />
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </ProfileSurface>

          {equippedItems.length > 0 && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-amber-500/80 mb-2">Equipados</p>
              <div className="flex flex-wrap gap-1.5">
                {equippedItems.map(({ slot, item }) => (
                  <span
                    key={`${slot}-${item.id}`}
                    className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-full border border-zinc-700/80 bg-zinc-900/80 text-[10px] text-zinc-200"
                  >
                    <RewardPreviewThumb item={item} size="sm" />
                    <span className="max-w-[64px] truncate">{item.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFromDraft(slot, item.id)}
                      className="p-0.5 rounded-full hover:bg-red-500/20 text-zinc-500 hover:text-red-400 cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold text-sm cursor-pointer disabled:opacity-40"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : saved && !hasChanges ? 'Salvo!' : 'Salvar perfil'}
            </button>
            <button
              type="button"
              onClick={() => { setDraft(loadout); setSaved(false); }}
              title="Desfazer"
              className="px-4 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            {equippedItems.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                title="Remover todos"
                className="px-4 py-3 rounded-xl border border-red-500/25 text-red-400 hover:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Catalog column */}
        <div className="xl:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                Coleção & Loja
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                {ownedCount}/{items.length} desbloqueados ·{' '}
                <span className="text-amber-400 font-bold">{spotlight} Spotlight</span>
              </p>
            </div>
            <div className="flex gap-2">
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Código promocional"
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 w-36"
              />
              <button
                type="button"
                onClick={handleRedeem}
                disabled={redeeming}
                className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold cursor-pointer"
              >
                Resgatar
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cosméticos..."
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-sm text-zinc-200"
              />
            </div>
            <button
              type="button"
              onClick={() => setOwnedOnly(!ownedOnly)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border cursor-pointer shrink-0 ${
                ownedOnly ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'border-zinc-800 text-zinc-500'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Só meus
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {CATEGORY_TABS.map((cat) => {
              const count = cat === 'all' ? items.length : items.filter((i) => i.category === cat).length;
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border cursor-pointer shrink-0 ${
                    active
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat]}
                  <span className="ml-1.5 text-[9px] opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          {category !== 'all' && CATEGORY_INFO[category] && (
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3 text-xs text-zinc-400">
              <span className="text-white font-bold">{CATEGORY_LABELS[category]}</span>
              {' — '}{CATEGORY_INFO[category].description}
              <span className="block text-[10px] text-amber-500/80 mt-1 font-mono">{CATEGORY_INFO[category].equipHint}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((item) => {
              const style = RARITY_STYLES[item.rarity];
              const equipped = isEquippedInDraft(draft, item);
              const isCollectible = item.category === 'badge' || item.category === 'tag';

              return (
                <div
                  key={item.id}
                  className={`group relative flex flex-col rounded-2xl border overflow-hidden ${
                    equipped ? 'ring-2 ring-amber-500/40 border-amber-500/30' : style.border
                  } ${!item.owned ? 'opacity-85' : ''}`}
                >
                  <div className={`relative flex items-center justify-center min-h-[88px] py-4 border-b border-zinc-800/60 ${style.bg}`}>
                    {equipped && (
                      <span className="absolute top-2 left-2 text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 z-10 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Ativo
                      </span>
                    )}
                    <RewardPreviewThumb item={item} size="md" locked={!item.owned} />
                  </div>

                  <div className="flex flex-col flex-1 p-4 bg-zinc-950/80">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[9px] uppercase font-mono text-zinc-500">{CATEGORY_LABELS[item.category]}</span>
                      <span className={`text-[8px] uppercase font-mono px-1.5 py-0.5 rounded ${style.text} bg-black/30`}>{item.rarity}</span>
                    </div>
                    <h3 className="font-bold text-sm text-white mb-1">{item.name}</h3>
                    <p className="text-[11px] text-zinc-500 line-clamp-2 mb-3">{item.description}</p>

                    <div className="mb-3 mt-auto">
                      {isCollectible && item.owned ? (
                        <div className="rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-2.5 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500/80">Por que você tem</p>
                          <p className="text-[11px] text-emerald-100/90 mt-0.5 leading-snug">{item.obtainHint}</p>
                        </div>
                      ) : (
                        <RewardObtainInfo item={item} variant="compact" />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="px-3 py-2 rounded-xl text-xs font-bold border border-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {item.owned ? (
                        <button
                          type="button"
                          onClick={() => toggleItem(item)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                            equipped
                              ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                          }`}
                        >
                          {equipped ? 'Remover do perfil' : 'Usar no perfil'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onPurchase(item.id)}
                          disabled={item.cost === 0 && item.unlockMethod === 'shop'}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 ${
                            item.cost > 0
                              ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-black'
                              : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                          }`}
                        >
                          {item.cost > 0 ? (
                            <><Sparkles className="w-3.5 h-3.5" /> {item.cost}</>
                          ) : (
                            <><Lock className="w-3.5 h-3.5" /> {item.obtainHint}</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-zinc-500 text-sm">Nenhum item encontrado.</div>
          )}
        </div>
      </div>

      {previewItem && (
        <RewardPreviewModal
          item={previewItem}
          userName={user.nome}
          userAvatar={user.avatar}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}
