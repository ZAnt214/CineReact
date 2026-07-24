import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Sparkles, Lock, Check, Package } from 'lucide-react';
import { CATEGORY_LABELS, RARITY_ORDER, RARITY_STYLES } from '../../data/rewardsCatalog.ts';
import type { InventoryItemView, RewardCategory, RewardRarity } from '../../types/gamification.ts';

interface RewardInventoryProps {
  items: InventoryItemView[];
  spotlight: number;
  onEquip: (id: string) => void;
  onUnequip: (id: string) => void;
  onPurchase: (id: string) => void;
  onRedeemCode: (code: string) => Promise<boolean>;
}

export default function RewardInventory({
  items,
  spotlight,
  onEquip,
  onUnequip,
  onPurchase,
  onRedeemCode,
}: RewardInventoryProps) {
  const [category, setCategory] = useState<RewardCategory | 'all'>('all');
  const [rarity, setRarity] = useState<RewardRarity | 'all'>('all');
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const filtered = useMemo(() => {
    return items
      .filter((i) => (category === 'all' ? true : i.category === category))
      .filter((i) => (rarity === 'all' ? true : i.rarity === rarity))
      .filter((i) => (ownedOnly ? i.owned : true))
      .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (a.owned !== b.owned) return a.owned ? -1 : 1;
        return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
      });
  }, [items, category, rarity, ownedOnly, search]);

  const ownedCount = items.filter((i) => i.owned).length;

  const handleRedeem = async () => {
    if (!promoCode.trim()) return;
    setRedeeming(true);
    await onRedeemCode(promoCode.trim());
    setPromoCode('');
    setRedeeming(false);
  };

  return (
    <div className="space-y-6">
      <motion.div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            Inventário de Recompensas
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            {ownedCount} de {items.length} itens desbloqueados · {spotlight} Spotlight
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Código promocional"
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 w-40"
          />
          <button
            type="button"
            onClick={handleRedeem}
            disabled={redeeming}
            className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold cursor-pointer hover:bg-amber-500/30"
          >
            Resgatar
          </button>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar recompensas..."
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-sm text-zinc-200"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setOwnedOnly(!ownedOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
              ownedOnly ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'border-zinc-800 text-zinc-500'
            }`}
          >
            <Filter className="w-3.5 h-3.5 inline mr-1" />
            Meus itens
          </button>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as RewardCategory | 'all')}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300"
          >
            <option value="all">Todas categorias</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value as RewardRarity | 'all')}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300"
          >
            <option value="all">Todas raridades</option>
            {RARITY_ORDER.map((r) => (
              <option key={r} value={r}>{RARITY_STYLES[r].label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((item) => (
            <div key={item.id}>
            <RewardCard
              item={item}
              onEquip={() => onEquip(item.id)}
              onUnequip={() => onUnequip(item.id)}
              onPurchase={() => onPurchase(item.id)}
            />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-zinc-500 py-16 text-sm">Nenhum item encontrado com esses filtros.</p>
      )}
    </div>
  );
}

function RewardCard({
  item,
  onEquip,
  onUnequip,
  onPurchase,
}: {
  item: InventoryItemView;
  onEquip: () => void;
  onUnequip: () => void;
  onPurchase: () => void;
}) {
  const style = RARITY_STYLES[item.rarity];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-2xl border p-4 transition-all ${style.border} ${style.bg} ${style.glow} ${
        !item.owned ? 'opacity-75' : ''
      } ${item.equipped ? 'ring-1 ring-amber-500/50' : ''}`}
    >
      {item.limited && (
        <span className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
          Limitado
        </span>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
          item.owned ? 'bg-zinc-950/50' : 'bg-zinc-900/80'
        } ${item.previewClass || ''}`}>
          {item.emojiChar || (item.owned ? '✨' : <Lock className="w-4 h-4 text-zinc-600" />)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
            <span className={`text-[8px] uppercase font-mono px-1.5 py-0.5 rounded ${style.text} bg-black/20`}>
              {style.label}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide mt-0.5">
            {CATEGORY_LABELS[item.category]}
          </p>
        </div>
      </div>

      <p className="text-[11px] text-zinc-400 leading-snug mb-2">{item.description}</p>
      <p className="text-[10px] text-zinc-600 font-mono mb-3">
        {item.owned
          ? `Desbloqueado ${item.unlockedAt ? new Date(item.unlockedAt).toLocaleDateString('pt-BR') : ''}`
          : item.obtainHint}
      </p>

      {item.creatorColors && (
        <span
          className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mb-3"
          style={{
            background: `linear-gradient(90deg, ${item.creatorColors.from}, ${item.creatorColors.to})`,
            color: item.creatorColors.text,
          }}
        >
          {item.creatorName}
        </span>
      )}

      <button
        type="button"
        onClick={item.owned ? (item.equipped ? onUnequip : onEquip) : onPurchase}
        className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
          item.equipped
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            : item.owned
            ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
            : item.cost > 0
            ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-black'
            : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
        }`}
        disabled={!item.owned && item.cost === 0 && item.unlockMethod !== 'shop'}
      >
        {item.equipped ? (
          <><Check className="w-3.5 h-3.5" /> Equipado</>
        ) : item.owned ? (
          'Equipar'
        ) : item.cost > 0 ? (
          <><Sparkles className="w-3.5 h-3.5" /> {item.cost}</>
        ) : (
          <><Lock className="w-3.5 h-3.5" /> Bloqueado</>
        )}
      </button>
    </motion.div>
  );
}
