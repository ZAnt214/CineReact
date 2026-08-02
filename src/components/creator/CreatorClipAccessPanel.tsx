import React, { useCallback, useEffect, useState } from 'react';
import { Film, Globe, Loader2, Lock, Unlock } from 'lucide-react';
import type { CineClip } from '../types/cineclips.ts';
import type { ClipAccessLevel } from '../types/finance.ts';

interface CreatorClipAccessPanelProps {
  email: string;
}

const ACCESS_OPTIONS: { value: ClipAccessLevel; label: string; desc: string }[] = [
  { value: 'public', label: 'Público', desc: 'Todos podem assistir' },
  { value: 'exclusive', label: 'Exclusivo', desc: 'Somente assinantes' },
  { value: 'timed_exclusive', label: 'Exclusivo temporário', desc: 'Exclusivo por X dias, depois público' },
];

export default function CreatorClipAccessPanel({ email }: CreatorClipAccessPanelProps) {
  const [clips, setClips] = useState<CineClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/creator/clips?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok) setClips(data.clips || []);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    load();
  }, [load]);

  const updateAccess = async (
    clipId: string,
    accessLevel: ClipAccessLevel,
    participatesInGlobal: boolean,
    exclusiveDays?: number
  ) => {
    setSaving(clipId);
    setMessage('');
    try {
      const res = await fetch(`/api/creator/clips/${clipId}/access`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, accessLevel, participatesInGlobal, exclusiveDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar');
      setClips((prev) => prev.map((c) => (c.id === clipId ? data.clip : c)));
      setMessage('Configuração salva.');
    } catch (err: any) {
      setMessage(err.message || 'Erro ao salvar');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8 text-zinc-500">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-4">
        Nenhum vídeo seu no CineClips ainda. Quando publicar, configure o acesso aqui.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500 leading-relaxed">
        Escolha quais vídeos são exclusivos para assinantes e quais participam da assinatura global.
      </p>
      {message && <p className="text-xs text-cyan-300">{message}</p>}
      <div className="space-y-3">
        {clips.map((clip) => {
          const level = clip.accessLevel || 'public';
          const isSaving = saving === clip.id;
          return (
            <div
              key={clip.id}
              className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3"
            >
              <div className="flex gap-3">
                {clip.thumbnailUrl ? (
                  <img src={clip.thumbnailUrl} alt="" className="w-16 h-24 object-cover rounded-lg bg-neutral-800" />
                ) : (
                  <div className="w-16 h-24 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <Film className="w-6 h-6 text-zinc-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white line-clamp-2">{clip.titulo}</p>
                  <p className="text-xs text-zinc-500 mt-1">{clip.duracao}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ACCESS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      updateAccess(
                        clip.id,
                        opt.value,
                        clip.participatesInGlobal ?? false,
                        opt.value === 'timed_exclusive' ? 7 : undefined
                      )
                    }
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      level === opt.value
                        ? 'border-cine-accent/40 bg-cine-accent/10'
                        : 'border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      {opt.value === 'public' ? (
                        <Unlock className="w-3 h-3" />
                      ) : (
                        <Lock className="w-3 h-3" />
                      )}
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!clip.participatesInGlobal}
                  disabled={isSaving}
                  onChange={(e) =>
                    updateAccess(clip.id, level, e.target.checked)
                  }
                  className="rounded border-neutral-700"
                />
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Participa da assinatura global
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
