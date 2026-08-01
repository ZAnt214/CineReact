import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

const MAX_BIO = 180;

export interface ProfileBioEditorProps {
  bio: string;
  email: string;
  onSaved: (bio: string) => void;
  className?: string;
}

export default function ProfileBioEditor({ bio, email, onSaved, className = '' }: ProfileBioEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bio);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(bio);
  }, [bio, editing]);

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      const len = textareaRef.current?.value.length ?? 0;
      textareaRef.current?.setSelectionRange(len, len);
    }
  }, [editing]);

  const saveBio = useCallback(async () => {
    const trimmed = draft.trim();
    if (trimmed === (bio || '').trim()) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/usuario/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, descricao: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível salvar a bio.');

      onSaved(trimmed);
      setEditing(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }, [bio, draft, email, onSaved]);

  const cancel = () => {
    setDraft(bio);
    setError('');
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void saveBio();
    }
  };

  const isEmpty = !bio?.trim();

  if (editing) {
    return (
      <div className={`w-full max-w-md ${className}`}>
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-4 shadow-inner">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_BIO))}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Conte um pouco sobre você, seus gêneros favoritos, o que curte assistir..."
            className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none leading-relaxed"
          />
          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-neutral-800/60">
            <span className={`text-[10px] tabular-nums ${draft.length >= MAX_BIO - 20 ? 'text-amber-400' : 'text-zinc-600'}`}>
              {draft.length}/{MAX_BIO}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancel}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-zinc-500 hover:text-zinc-300 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void saveBio()}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cine-accent hover:bg-cine-accent-light text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Salvar
              </button>
            </div>
          </div>
          {error && <p className="text-[11px] text-red-400 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`group relative w-full max-w-md text-left rounded-2xl border transition-all cursor-pointer ${
        isEmpty
          ? 'border-neutral-800/70 bg-neutral-950/50 hover:bg-neutral-900/60 hover:border-neutral-700'
          : 'border-neutral-800/70 bg-neutral-950/40 hover:border-neutral-700 hover:bg-neutral-900/55'
      } px-4 py-3.5 ${className}`}
      title="Clique para editar sua bio"
    >
      <span className="absolute top-3 right-3 text-[10px] font-semibold text-zinc-600 group-hover:text-cine-accent-light transition-colors">
        {saved ? (
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <Check className="w-3 h-3" />
            Salvo
          </span>
        ) : (
          'Editar'
        )}
      </span>

      {isEmpty ? (
        <div className="pr-12">
          <p className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">
            Sua bio
          </p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Toque para contar quem você é na comunidade CineReact.
          </p>
        </div>
      ) : (
        <p className="text-sm text-zinc-300 leading-relaxed pr-12 group-hover:text-zinc-100 transition-colors">
          {bio}
        </p>
      )}
    </button>
  );
}
