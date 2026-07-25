import React, { useState, useEffect, useMemo } from 'react';
import { Save, RotateCcw, Sparkles, Eye, X, Trash2, ChevronDown } from 'lucide-react';
import { CATEGORY_LABELS, RARITY_STYLES } from '../../data/rewardsCatalog.ts';
import { RewardPreviewModal, RewardPreviewThumb } from './RewardPreview.tsx';
import ProfileAvatar from '../profile/ProfileAvatar.tsx';
import ProfileSurface from '../profile/ProfileSurface.tsx';
import ProfileNameRow from '../profile/ProfileNameRow.tsx';
import type { InventoryItemView, ProfileLoadout } from '../../types/gamification.ts';
import type { UserState } from '../../types.ts';

const EMPTY_LOADOUT = (): ProfileLoadout => ({ tags: [], badges: [] });

interface ProfileCustomizerProps {
  user: UserState;
  inventory: InventoryItemView[];
  loadout: ProfileLoadout;
  onSave: (loadout: ProfileLoadout) => Promise<boolean>;
}

const SLOT_GROUPS: { key: keyof ProfileLoadout; label: string; max: number }[] = [
  { key: 'frame', label: 'Moldura', max: 1 },
  { key: 'background', label: 'Fundo', max: 1 },
  { key: 'theme', label: 'Tema', max: 1 },
  { key: 'effect', label: 'Efeito', max: 1 },
  { key: 'profileCard', label: 'Cartão', max: 1 },
  { key: 'title', label: 'Título', max: 1 },
  { key: 'avatar', label: 'Avatar', max: 1 },
  { key: 'tags', label: 'Tags', max: 3 },
  { key: 'badges', label: 'Emblemas', max: 2 },
  { key: 'reaction', label: 'Reação', max: 1 },
  { key: 'emoji', label: 'Emoji', max: 1 },
];

const CAT_MAP: Record<string, string> = {
  frame: 'frame',
  background: 'background',
  theme: 'theme',
  effect: 'effect',
  profileCard: 'profile_card',
  title: 'title',
  avatar: 'avatar',
  tags: 'tag',
  badges: 'badge',
  reaction: 'reaction',
  emoji: 'emoji',
};

export default function ProfileCustomizer({ user, inventory, loadout, onSave }: ProfileCustomizerProps) {
  const [draft, setDraft] = useState<ProfileLoadout>(loadout);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewItem, setPreviewItem] = useState<InventoryItemView | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>('frame');

  useEffect(() => {
    setDraft(loadout);
  }, [loadout]);

  const owned = inventory.filter((i) => i.owned);

  const equippedItems = useMemo(() => {
    const ids: { slot: keyof ProfileLoadout; id: string }[] = [];
    for (const { key } of SLOT_GROUPS) {
      const val = draft[key];
      if (Array.isArray(val)) {
        val.forEach((id) => ids.push({ slot: key, id }));
      } else if (val) {
        ids.push({ slot: key, id: val });
      }
    }
    return ids.map(({ slot, id }) => ({
      slot,
      item: inventory.find((i) => i.id === id),
    })).filter((e) => e.item);
  }, [draft, inventory]);

  const toggleSlot = (category: keyof ProfileLoadout, itemId: string, max: number) => {
    setDraft((prev) => {
      const next = { ...prev, tags: [...prev.tags], badges: [...prev.badges] };
      if (category === 'tags' || category === 'badges') {
        const arr = next[category] as string[];
        if (arr.includes(itemId)) {
          next[category] = arr.filter((id) => id !== itemId) as never;
        } else {
          next[category] = [...arr, itemId].slice(-max) as never;
        }
      } else {
        const current = next[category];
        (next as Record<string, unknown>)[category] = current === itemId ? undefined : itemId;
      }
      return next;
    });
    setSaved(false);
  };

  const removeItem = (category: keyof ProfileLoadout, itemId: string) => {
    setDraft((prev) => {
      const next = { ...prev, tags: [...prev.tags], badges: [...prev.badges] };
      if (category === 'tags' || category === 'badges') {
        next[category] = (next[category] as string[]).filter((id) => id !== itemId) as never;
      } else if ((next[category] as string | undefined) === itemId) {
        (next as Record<string, unknown>)[category] = undefined;
      }
      return next;
    });
    setSaved(false);
  };

  const clearSlot = (category: keyof ProfileLoadout) => {
    setDraft((prev) => {
      const next = { ...prev, tags: [...prev.tags], badges: [...prev.badges] };
      if (category === 'tags' || category === 'badges') {
        next[category] = [] as never;
      } else {
        (next as Record<string, unknown>)[category] = undefined;
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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h2 className="text-lg font-black text-white">Pré-visualização ao vivo</h2>
        <ProfileSurface loadout={draft} variant="preview" className="min-h-[420px]">
          <div className="flex flex-col items-center text-center">
            <ProfileAvatar
              photoUrl={user.avatar}
              alt={user.nome}
              size="lg"
              loadout={draft}
              showEffect
              className="mb-4"
            />
            <ProfileNameRow name={user.nome} loadout={draft} className="w-full flex flex-col items-center" />
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
          </div>
        </ProfileSurface>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold text-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar personalização'}
          </button>
          <button
            type="button"
            onClick={() => { setDraft(loadout); setSaved(false); }}
            title="Desfazer alterações"
            className="px-4 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
        <div className="flex items-center justify-between gap-3 sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm py-2 -mt-2">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Cosméticos
          </h2>
          {equippedItems.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/10 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Remover todos
            </button>
          )}
        </div>

        {equippedItems.length > 0 && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-amber-500/80">Equipados agora</p>
            <div className="flex flex-wrap gap-2">
              {equippedItems.map(({ slot, item }) => item && (
                <span
                  key={`${slot}-${item.id}`}
                  className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full border border-zinc-700/80 bg-zinc-900/80 text-[10px] text-zinc-200"
                >
                  <RewardPreviewThumb item={item} size="sm" />
                  <span className="max-w-[72px] truncate">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(slot, item.id)}
                    title="Remover"
                    className="p-1 rounded-full hover:bg-red-500/20 text-zinc-500 hover:text-red-400 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {SLOT_GROUPS.map(({ key, label, max }) => {
            const cat = CAT_MAP[key as string];
            const items = owned.filter((i) => i.category === cat);
            if (items.length === 0) return null;

            const selected = draft[key];
            const selectedIds = Array.isArray(selected) ? selected : selected ? [selected] : [];
            const isOpen = openCategory === key;
            const categoryLabel = CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || label;

            return (
              <div key={key as string} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenCategory(isOpen ? null : key)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-900/50 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{categoryLabel}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {selectedIds.length > 0
                        ? `${selectedIds.length} equipado${selectedIds.length > 1 ? 's' : ''}${max > 1 ? ` · máx. ${max}` : ''}`
                        : `${items.length} disponíve${items.length === 1 ? 'l' : 'is'}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedIds.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearSlot(key); }}
                        className="text-[9px] uppercase font-bold text-zinc-500 hover:text-red-400 px-2 py-1 rounded-md border border-zinc-800 hover:border-red-500/30 cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {items.map((item) => {
                      const isOn = selectedIds.includes(item.id);
                      const style = RARITY_STYLES[item.rarity];
                      return (
                        <div
                          key={item.id}
                          className={`relative group rounded-xl border transition-all ${
                            isOn
                              ? 'border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/20'
                              : `${style.border} ${style.bg} hover:border-zinc-600`
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleSlot(key, item.id, max)}
                            className="w-full p-3 flex flex-col items-center gap-2 text-center cursor-pointer"
                          >
                            <RewardPreviewThumb item={item} size="md" />
                            <span className="text-[10px] font-semibold text-zinc-200 line-clamp-2 leading-tight min-h-[2.5em]">
                              {item.name}
                            </span>
                            <span className={`text-[8px] uppercase font-mono ${style.text}`}>{item.rarity}</span>
                          </button>

                          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => setPreviewItem(item)}
                              title="Visualizar"
                              className="p-1 rounded-md bg-zinc-950/80 border border-zinc-700 text-zinc-400 hover:text-amber-400 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            {isOn && (
                              <button
                                type="button"
                                onClick={() => removeItem(key, item.id)}
                                title="Remover"
                                className="p-1 rounded-md bg-zinc-950/80 border border-zinc-700 text-zinc-400 hover:text-red-400 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {isOn && (
                            <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
