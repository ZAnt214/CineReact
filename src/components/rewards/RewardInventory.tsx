import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Sparkles, Lock, Check, Package, Eye, Frame, Tag, Award,
  Palette, Zap, Image, MessageCircle, Smile, CreditCard, User, Medal,
  Filter,
} from 'lucide-react';
import {
  CATEGORY_LABELS, CATEGORY_INFO, RARITY_ORDER, RARITY_STYLES,
} from '../../data/rewardsCatalog.ts';
import { RewardPreviewModal, RewardPreviewThumb } from './RewardPreview.tsx';
import RewardObtainInfo from './RewardObtainInfo.tsx';
import type { InventoryItemView, RewardCategory, RewardRarity } from '../../types/gamification.ts';
import { ACTIVE_COSMETIC_CATEGORIES } from '../../types/gamification.ts';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  frame: Frame,
  tag: Tag,
  title: Award,
  avatar: User,
  badge: Medal,
  theme: Palette,
  effect: Zap,
  background: Image,
  reaction: MessageCircle,
  emoji: Smile,
  profile_card: CreditCard,
};

const CATEGORY_ORDER: (RewardCategory | 'all')[] = [
  'all', 'theme', 'title', 'frame', 'avatar', 'reaction', 'emoji',
];

interface RewardInventoryProps {
  items: InventoryItemView[];
  spotlight: number;
  userName?: string;
  userAvatar?: string;
  onEquip: (id: string) => void;
  onUnequip: (id: string) => void;
  onPurchase: (id: string) => void;
  onRedeemCode: (code: string) => Promise<boolean>;
}

export default function RewardInventory({
  items,
  spotlight,
  userName,
  userAvatar,
  onEquip,
  onUnequip,
  onPurchase,
  onRedeemCode,
}: RewardInventoryProps) {
  const [category, setCategory] = useState<RewardCategory | 'all'>('all');
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [previewItem, setPreviewItem] = useState<InventoryItemView | null>(null);

  const filtered = useMemo(() => {
    return items
      .filter((i) => (ACTIVE_COSMETIC_CATEGORIES as readonly string[]).includes(i.category))
      .filter((i) => (category === 'all' ? true : i.category === category))
      .filter((i) => (ownedOnly ? i.owned : true))
      .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (a.owned !== b.owned) return a.owned ? -1 : 1;
        return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
      });
  }, [items, category, ownedOnly, search]);

  const grouped = useMemo(() => {
    if (category !== 'all') return null;
    const groups: Partial<Record<RewardCategory, InventoryItemView[]>> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category]!.push(item);
    }
    return CATEGORY_ORDER.filter((c) => c !== 'all' && groups[c as RewardCategory]?.length)
      .map((c) => ({ cat: c as RewardCategory, items: groups[c as RewardCategory]! }));
  }, [filtered, category]);

  const ownedCount = items.filter((i) => i.owned).length;
  const activeInfo = category !== 'all' ? CATEGORY_INFO[category] : null;

  const handleRedeem = async () => {
    if (!promoCode.trim()) return;
    setRedeeming(true);
    await onRedeemCode(promoCode.trim());
    setPromoCode('');
    setRedeeming(false);
  };

  return (
    <motion.div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            Loja & Inventário
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            {ownedCount}/{items.length} desbloqueados · <span className="text-amber-400 font-bold">{spotlight} Spotlight</span>
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Código promocional"
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 w-36 sm:w-44"
          />
          <button
            type="button"
            onClick={handleRedeem}
            disabled={redeeming}
            className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold cursor-pointer hover:bg-amber-500/30"
          >
            Resgatar
          </button>
        </div>
      </div>

      {/* Search + owned filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou descrição..."
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-sm text-zinc-200"
          />
        </div>
        <button
          type="button"
          onClick={() => setOwnedOnly(!ownedOnly)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border cursor-pointer shrink-0 ${
            ownedOnly ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Só meus itens
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {CATEGORY_ORDER.map((cat) => {
          const Icon = cat === 'all' ? Package : CATEGORY_ICONS[cat];
          const count = cat === 'all' ? filtered.length : items.filter((i) => i.category === cat).length;
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer shrink-0 ${
                active
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {cat === 'all' ? 'Todas' : CATEGORY_LABELS[cat]}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${active ? 'bg-amber-500/20' : 'bg-zinc-800'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category explainer */}
      {activeInfo && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3 flex gap-3 items-start"
        >
          <span className="text-xl shrink-0">{activeInfo.icon}</span>
          <div>
            <p className="text-sm font-bold text-white">{CATEGORY_LABELS[category]}</p>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{activeInfo.description}</p>
            <p className="text-[10px] text-amber-500/80 font-mono mt-1">{activeInfo.equipHint}</p>
          </div>
        </motion.div>
      )}

      {/* Items grid */}
      {category === 'all' && grouped ? (
        <div className="space-y-8">
          {grouped.map(({ cat, items: groupItems }) => (
            <section key={cat}>
              <div className="flex items-center gap-2 mb-3">
                {CATEGORY_ICONS[cat] && (
                  <span className="p-1.5 rounded-lg bg-zinc-800/80 text-amber-400">
                    {React.createElement(CATEGORY_ICONS[cat], { className: 'w-4 h-4' })}
                  </span>
                )}
                <div>
                  <h3 className="text-sm font-black text-white">{CATEGORY_LABELS[cat]}</h3>
                  <p className="text-[10px] text-zinc-500">{CATEGORY_INFO[cat]?.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {groupItems.map((item) => (
                  <RewardCard
                    key={item.id}
                    item={item}
                    onEquip={() => onEquip(item.id)}
                    onUnequip={() => onUnequip(item.id)}
                    onPurchase={() => onPurchase(item.id)}
                    onPreview={() => setPreviewItem(item)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((item) => (
              <RewardCard
                key={item.id}
                item={item}
                onEquip={() => onEquip(item.id)}
                onUnequip={() => onUnequip(item.id)}
                onPurchase={() => onPurchase(item.id)}
                onPreview={() => setPreviewItem(item)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Package className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Nenhum item encontrado.</p>
          <p className="text-zinc-600 text-xs mt-1">Tente outro filtro ou busca.</p>
        </div>
      )}

      {previewItem && (
        <RewardPreviewModal
          item={previewItem}
          userName={userName}
          userAvatar={userAvatar}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </motion.div>
  );
}

function RewardCard({
  item,
  onEquip,
  onUnequip,
  onPurchase,
  onPreview,
}: {
  item: InventoryItemView;
  onEquip: () => void;
  onUnequip: () => void;
  onPurchase: () => void;
  onPreview: () => void;
}) {
  const style = RARITY_STYLES[item.rarity];
  const isHeroCategory = item.category === 'title' || item.category === 'tag';
  const CatIcon = CATEGORY_ICONS[item.category] || Package;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative flex flex-col rounded-2xl border overflow-hidden transition-all ${style.border} ${
        item.equipped ? 'ring-2 ring-emerald-500/40' : ''
      } ${!item.owned ? 'opacity-80' : ''}`}
    >
      {/* Hero preview */}
      <div
        className={`relative flex items-center justify-center border-b border-zinc-800/60 ${
          isHeroCategory ? 'min-h-[100px] py-5' : 'min-h-[80px] py-4'
        } ${style.bg}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
        {item.limited && (
          <span className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/25 text-rose-300 border border-rose-500/30 z-10">
            Limitado
          </span>
        )}
        {item.equipped && (
          <span className="absolute top-2 left-2 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 z-10 flex items-center gap-1">
            <Check className="w-2.5 h-2.5" /> Equipado
          </span>
        )}
        <RewardPreviewThumb item={item} size={isHeroCategory ? 'md' : 'sm'} locked={!item.owned} />
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 bg-zinc-950/80">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <CatIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="text-[9px] uppercase font-mono text-zinc-500 tracking-wide truncate">
              {CATEGORY_LABELS[item.category]}
            </span>
          </div>
          <span className={`text-[8px] uppercase font-mono px-1.5 py-0.5 rounded shrink-0 ${style.text} bg-black/30 border ${style.border}`}>
            {style.label}
          </span>
        </div>

        <h3 className="font-bold text-sm text-white leading-tight mb-1">{item.name}</h3>
        <p className="text-[11px] text-zinc-500 leading-snug mb-3 line-clamp-2">{item.description}</p>

        <div className="mb-3 mt-auto">
          <RewardObtainInfo item={item} variant="compact" />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onPreview}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-zinc-700/80 text-zinc-400 hover:text-white hover:border-zinc-600 cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            Ver
          </button>
          <button
            type="button"
            onClick={item.owned ? (item.equipped ? onUnequip : onEquip) : onPurchase}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              item.equipped
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : item.owned
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                : item.cost > 0
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-black'
                : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
            }`}
            disabled={!item.owned && item.cost === 0 && item.unlockMethod !== 'shop'}
          >
            {item.equipped ? (
              'Desequipar'
            ) : item.owned ? (
              'Equipar'
            ) : item.cost > 0 ? (
              <><Sparkles className="w-3.5 h-3.5" /> {item.cost}</>
            ) : (
              <><Lock className="w-3.5 h-3.5" /> Bloqueado</>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
