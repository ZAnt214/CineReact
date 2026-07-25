import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Eye, Search, Filter, Package, Lock, Check, Palette, X,
} from 'lucide-react';
import {
  CATEGORY_LABELS, CATEGORY_INFO, RARITY_ORDER, RARITY_STYLES,
  CREATOR_PROGRAM_ART_BUNDLE_ID,
} from '../../data/rewardsCatalog.ts';
import { RewardPreviewModal, RewardPreviewThumb } from './RewardPreview.tsx';
import RewardObtainInfo from './RewardObtainInfo.tsx';
import ProfileAvatar from '../profile/ProfileAvatar.tsx';
import ProfileSurface from '../profile/ProfileSurface.tsx';
import ProfileNameRow from '../profile/ProfileNameRow.tsx';
import type { InventoryItemView, ProfileLoadout, RewardCategory } from '../../types/gamification.ts';
import { ACTIVE_COSMETIC_CATEGORIES, LOADOUT_SLOTS } from '../../types/gamification.ts';
import type { UserState } from '../../types.ts';

const CATEGORY_TABS: (RewardCategory | 'all')[] = [
  'all', 'theme', 'frame', 'title', 'avatar', 'tag', 'badge', 'reaction', 'emoji',
];

interface ProfileCosmeticsHubProps {
  user: UserState;
  inventory: InventoryItemView[];
  loadout: ProfileLoadout;
  spotlight: number;
  onEquip: (id: string) => Promise<boolean>;
  onUnequip: (id: string) => Promise<boolean>;
  onPurchase: (id: string) => Promise<boolean>;
  onRedeemCode: (code: string) => Promise<boolean>;
}

function isEquipped(loadout: ProfileLoadout, item: InventoryItemView): boolean {
  const slot = LOADOUT_SLOTS[item.category as keyof typeof LOADOUT_SLOTS];
  if (!slot) return false;
  const val = loadout[slot.loadoutKey];
  if (Array.isArray(val)) return val.includes(item.id);
  return val === item.id;
}

export default function ProfileCosmeticsHub({
  user,
  inventory,
  loadout,
  spotlight,
  onEquip,
  onUnequip,
  onPurchase,
  onRedeemCode,
}: ProfileCosmeticsHubProps) {
  const [previewItem, setPreviewItem] = useState<InventoryItemView | null>(null);
  const [pendingItem, setPendingItem] = useState<InventoryItemView | null>(null);
  const [acting, setActing] = useState(false);
  const [category, setCategory] = useState<RewardCategory | 'all'>('all');
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

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

  const ownedCount = items.filter((i) => i.owned).length;
  const pendingEquipped = pendingItem ? isEquipped(loadout, pendingItem) : false;

  const handleItemClick = (item: InventoryItemView) => {
    if (!item.owned) return;
    setPendingItem(item);
  };

  const confirmEquip = async () => {
    if (!pendingItem) return;
    setActing(true);
    if (pendingEquipped) {
      await onUnequip(pendingItem.id);
    } else {
      await onEquip(pendingItem.id);
    }
    setActing(false);
    setPendingItem(null);
  };

  const handleRedeem = async () => {
    if (!promoCode.trim()) return;
    setRedeeming(true);
    await onRedeemCode(promoCode.trim());
    setPromoCode('');
    setRedeeming(false);
  };

  return (
    <div className="relative z-0 space-y-6">
      <ProfileSurface loadout={loadout} variant="preview" className="min-h-0">
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8 py-2">
          <ProfileAvatar photoUrl={user.avatar} alt={user.nome} size="lg" loadout={loadout} className="shrink-0" />
          <div className="flex-1 text-center sm:text-left min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-amber-500/70 mb-1 flex items-center justify-center sm:justify-start gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Prévia do perfil
            </p>
            <ProfileNameRow name={user.nome} loadout={loadout} nameSize="md" className="items-center sm:items-start" />
            {loadout.badges.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap justify-center sm:justify-start">
                {loadout.badges.map((id) => {
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
        </div>
      </ProfileSurface>

      <div className="flex flex-col gap-4">
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
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map((item) => {
          const style = RARITY_STYLES[item.rarity];
          const equipped = isEquipped(loadout, item);
          const isCollectible = item.category === 'badge' || item.category === 'tag';

          return (
            <div
              key={item.id}
              className={`group relative flex flex-col rounded-2xl border overflow-hidden transition-all ${
                equipped ? 'ring-2 ring-amber-500/50 border-amber-500/40' : style.border
              } ${!item.owned ? 'opacity-75' : 'cursor-pointer hover:scale-[1.02]'}`}
              onClick={() => item.owned && handleItemClick(item)}
              onKeyDown={(e) => e.key === 'Enter' && item.owned && handleItemClick(item)}
              role={item.owned ? 'button' : undefined}
              tabIndex={item.owned ? 0 : undefined}
            >
              <div className={`relative flex items-center justify-center aspect-square border-b border-zinc-800/60 ${style.bg}`}>
                {equipped && (
                  <span className="absolute top-1.5 left-1.5 text-[7px] font-black uppercase px-1 py-0.5 rounded bg-amber-500/25 text-amber-200 border border-amber-500/30 z-10 flex items-center gap-0.5">
                    <Check className="w-2 h-2" />
                  </span>
                )}
                <RewardPreviewThumb item={item} size="md" locked={!item.owned} />
                {item.owned && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/50 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex flex-col flex-1 p-2.5 bg-zinc-950/80 gap-1">
                <span className="text-[8px] uppercase font-mono text-zinc-500 truncate">{CATEGORY_LABELS[item.category]}</span>
                {item.bundleId === CREATOR_PROGRAM_ART_BUNDLE_ID && (
                  <span className="text-[7px] font-bold uppercase tracking-wider text-amber-400/90 truncate">
                    Coleção Ateliê Visionário
                  </span>
                )}
                <h3 className="font-bold text-[11px] text-white truncate">{item.name}</h3>

                {isCollectible && item.owned ? (
                  <p className="text-[9px] text-emerald-400/80 leading-tight line-clamp-2" title={item.obtainHint}>
                    {item.obtainHint}
                  </p>
                ) : (
                  <p className="text-[9px] text-zinc-500 line-clamp-2 leading-tight">{item.description}</p>
                )}

                {!item.owned && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onPurchase(item.id); }}
                    disabled={item.cost === 0 && item.unlockMethod === 'shop'}
                    className={`mt-auto w-full py-1.5 rounded-lg text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 ${
                      item.cost > 0
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-black'
                        : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                    }`}
                  >
                    {item.cost > 0 ? (
                      <><Sparkles className="w-3 h-3" /> {item.cost}</>
                    ) : (
                      <><Lock className="w-3 h-3" /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center py-16 text-zinc-500 text-sm">Nenhum item encontrado.</p>
      )}

      <AnimatePresence>
        {pendingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => !acting && setPendingItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-amber-500/80 mb-1">
                    {pendingEquipped ? 'Remover cosmético' : 'Equipar cosmético'}
                  </p>
                  <h3 className="text-lg font-black text-white">{pendingItem.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{pendingItem.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => !acting && setPendingItem(null)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {pendingItem.category === 'badge' || pendingItem.category === 'tag' ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/15 px-3 py-2 mb-4">
                  <p className="text-[9px] font-bold uppercase text-emerald-500/70">Por que você tem</p>
                  <p className="text-[11px] text-emerald-100/90 mt-0.5">{pendingItem.obtainHint}</p>
                </div>
              ) : (
                <div className="mb-4">
                  <RewardObtainInfo item={pendingItem} variant="compact" />
                </div>
              )}

              <p className="text-sm text-zinc-300 mb-4">
                {pendingEquipped
                  ? `Deseja remover "${pendingItem.name}" do seu perfil?`
                  : pendingItem.id === 'theme-atelie-visionario'
                    ? `Deseja equipar a Coleção Ateliê Visionário completa no seu perfil?`
                    : `Deseja equipar "${pendingItem.name}" no seu perfil?`}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingItem(null)}
                  disabled={acting}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-bold cursor-pointer hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmEquip}
                  disabled={acting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-black text-sm font-bold cursor-pointer disabled:opacity-50"
                >
                  {acting ? 'Aplicando...' : pendingEquipped ? 'Remover' : 'Equipar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
