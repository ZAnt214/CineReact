import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, RotateCcw, Sparkles, Eye } from 'lucide-react';
import { CATEGORY_LABELS, RARITY_STYLES } from '../../data/rewardsCatalog.ts';
import { getLoadoutPreviewStyles } from '../../gamification/rewardsEngine.ts';
import { AvatarRewardVisual, RewardPreviewModal, RewardPreviewThumb } from './RewardPreview.tsx';
import ProfileAvatar from '../profile/ProfileAvatar.tsx';
import TitleRewardVisual from './TitleRewardVisual.tsx';
import CreatorTagVisual from './CreatorTagVisual.tsx';
import type { InventoryItemView, ProfileLoadout } from '../../types/gamification.ts';
import type { UserState } from '../../types.ts';

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

  useEffect(() => {
    setDraft(loadout);
  }, [loadout]);

  const owned = inventory.filter((i) => i.owned);
  const styles = useMemo(() => getLoadoutPreviewStyles(draft), [draft]);

  const titleItem = draft.title ? inventory.find((i) => i.id === draft.title) : null;
  const tagItems = draft.tags.map((id) => inventory.find((i) => i.id === id)).filter(Boolean) as InventoryItemView[];

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

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(draft);
    setSaving(false);
    if (ok) setSaved(true);
  };

  const slotGroups: { key: keyof ProfileLoadout; label: string; max: number }[] = [
    { key: 'frame', label: 'Moldura', max: 1 },
    { key: 'background', label: 'Fundo', max: 1 },
    { key: 'theme', label: 'Tema', max: 1 },
    { key: 'effect', label: 'Efeito', max: 1 },
    { key: 'profileCard', label: 'Cartão', max: 1 },
    { key: 'title', label: 'Título', max: 1 },
    { key: 'avatar', label: 'Avatar', max: 1 },
    { key: 'tags', label: 'Tags (máx. 3)', max: 3 },
    { key: 'badges', label: 'Emblemas (máx. 2)', max: 2 },
    { key: 'reaction', label: 'Reação', max: 1 },
    { key: 'emoji', label: 'Emoji', max: 1 },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Preview */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-white">Pré-visualização ao vivo</h2>
        <motion.div
          layout
          className={`relative overflow-hidden rounded-3xl border border-zinc-800 p-8 min-h-[420px] ${styles.backgroundClass} ${styles.themeClass}`}
        >
          {styles.effectClass && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-purple-500/10 pointer-events-none"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          )}

          <div className={`relative rounded-2xl border border-zinc-800/60 p-6 ${styles.cardClass}`}>
            <div className="flex flex-col items-center text-center">
              <ProfileAvatar
                photoUrl={user.avatar}
                alt={user.nome}
                size="lg"
                loadout={draft}
                showEffect
                className="mb-4"
              />

              <h3 className="text-xl font-black text-white">{user.nome}</h3>
              {titleItem && (
                <div className="mt-2">
                  <TitleRewardVisual name={titleItem.name} rarity={titleItem.rarity} item={titleItem} size="md" />
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {tagItems.map((tag) => (
                  <CreatorTagVisual
                    key={tag.id}
                    id={tag.id}
                    name={tag.name}
                    creatorName={tag.creatorName}
                    creatorColors={tag.creatorColors}
                    size="sm"
                  />
                ))}
              </div>

              <div className="flex gap-2 mt-4">
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
          </div>
        </motion.div>

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
            className="px-4 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slot picker */}
      <motion.div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Combinar itens
        </h2>

        {slotGroups.map(({ key, label, max }) => {
          const catMap: Record<string, string> = {
            frame: 'frame', background: 'background', theme: 'theme', effect: 'effect',
            profileCard: 'profile_card', title: 'title', avatar: 'avatar',
            tags: 'tag', badges: 'badge', reaction: 'reaction', emoji: 'emoji',
          };
          const cat = catMap[key as string];
          const items = owned.filter((i) => i.category === cat);
          if (items.length === 0) return null;

          const selected = draft[key];
          const selectedIds = Array.isArray(selected) ? selected : selected ? [selected] : [];

          return (
            <div key={key as string}>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">{label}</p>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => {
                  const isOn = selectedIds.includes(item.id);
                  const style = RARITY_STYLES[item.rarity];
                  return (
                    <div key={item.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleSlot(key, item.id, max)}
                        className={`px-2 py-2 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center gap-2 ${
                          isOn
                            ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                            : `${style.border} ${style.bg} text-zinc-400 hover:text-white`
                        }`}
                      >
                        <RewardPreviewThumb item={item} size="sm" />
                        <span className="max-w-[100px] truncate">{item.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        title="Testar visual"
                        className="p-2 rounded-lg border border-zinc-800 text-zinc-500 hover:text-amber-400 hover:border-amber-500/30 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </motion.div>

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
