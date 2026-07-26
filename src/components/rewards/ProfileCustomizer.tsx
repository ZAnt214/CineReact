import React, { useState, useEffect, useMemo } from 'react';
import { Save, RotateCcw, Sparkles, Eye, X, Trash2, ChevronDown } from 'lucide-react';
import { CATEGORY_LABELS, RARITY_STYLES } from '../../data/rewardsCatalog.ts';
import { RewardPreviewModal, RewardPreviewThumb } from './RewardPreview.tsx';
import ProfileAvatar from '../profile/ProfileAvatar.tsx';
import ProfileSurface from '../profile/ProfileSurface.tsx';
import ProfileNameRow from '../profile/ProfileNameRow.tsx';
import type { InventoryItemView, ProfileLoadout } from '../../types/gamification.ts';
import type { UserState } from '../../types.ts';

const EMPTY_LOADOUT = (): ProfileLoadout => ({});

const SLOT_GROUPS: { key: keyof ProfileLoadout; label: string }[] = [
  { key: 'theme', label: 'Tema' },
  { key: 'frame', label: 'Moldura' },
  { key: 'title', label: 'Título' },
  { key: 'avatar', label: 'Avatar' },
  { key: 'reaction', label: 'Reação' },
  { key: 'emoji', label: 'Emoji' },
];

const CAT_MAP: Record<string, string> = {
  frame: 'frame',
  theme: 'theme',
  title: 'title',
  avatar: 'avatar',
  reaction: 'reaction',
  emoji: 'emoji',
};

interface ProfileCustomizerProps {
  user: UserState;
  inventory: InventoryItemView[];
  loadout: ProfileLoadout;
  onSave: (loadout: ProfileLoadout) => Promise<boolean>;
}

export default function ProfileCustomizer({ user, inventory, loadout, onSave }: ProfileCustomizerProps) {
  const [draft, setDraft] = useState<ProfileLoadout>(loadout);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewItem, setPreviewItem] = useState<InventoryItemView | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>('theme');

  useEffect(() => {
    setDraft(loadout);
  }, [loadout]);

  const owned = inventory.filter((i) => i.owned);

  const equippedItems = useMemo(() => {
    return SLOT_GROUPS
      .map(({ key }) => {
        const id = draft[key];
        if (!id || typeof id !== 'string') return null;
        const item = inventory.find((i) => i.id === id);
        return item ? { slot: key, item } : null;
      })
      .filter((e): e is { slot: keyof ProfileLoadout; item: InventoryItemView } => !!e);
  }, [draft, inventory]);

  const toggleSlot = (category: keyof ProfileLoadout, itemId: string) => {
    setDraft((prev) => {
      const next = { ...prev };
      const current = next[category];
      (next as Record<string, unknown>)[category] = current === itemId ? undefined : itemId;
      return next;
    });
    setSaved(false);
  };

  const removeItem = (category: keyof ProfileLoadout) => {
    setDraft((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
    setSaved(false);
  };

  const clearSlot = (category: keyof ProfileLoadout) => {
    removeItem(category);
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
              className="mb-4"
            />
            <ProfileNameRow name={user.nome} loadout={draft} align="center" className="w-full" />
          </div>
        </ProfileSurface>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cine-accent-dark to-cine-accent text-black font-bold text-sm cursor-pointer disabled:opacity-50"
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
            <Sparkles className="w-5 h-5 text-cine-accent-light" />
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
          <div className="rounded-2xl border border-cine-accent/20 bg-cine-accent/5 p-3 space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-cine-accent/80">Equipados agora</p>
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
                    onClick={() => removeItem(slot)}
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
          {SLOT_GROUPS.map(({ key, label }) => {
            const cat = CAT_MAP[key as string];
            const items = owned.filter((i) => i.category === cat);
            if (items.length === 0) return null;

            const selected = draft[key];
            const selectedId = typeof selected === 'string' ? selected : undefined;
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
                      {selectedId
                        ? '1 equipado'
                        : `${items.length} disponíve${items.length === 1 ? 'l' : 'is'}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedId && (
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
                      const isOn = selectedId === item.id;
                      const style = RARITY_STYLES[item.rarity];
                      return (
                        <div
                          key={item.id}
                          className={`relative group rounded-xl border transition-all ${
                            isOn
                              ? 'border-cine-accent/50 bg-cine-accent/10 ring-1 ring-cine-accent/20'
                              : `${style.border} ${style.bg} hover:border-zinc-600`
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleSlot(key, item.id)}
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
                              className="p-1 rounded-md bg-zinc-950/80 border border-zinc-700 text-zinc-400 hover:text-cine-accent-light cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            {isOn && (
                              <button
                                type="button"
                                onClick={() => removeItem(key)}
                                title="Remover"
                                className="p-1 rounded-md bg-zinc-950/80 border border-zinc-700 text-zinc-400 hover:text-red-400 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {isOn && (
                            <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-cine-accent-light shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
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
