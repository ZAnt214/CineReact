import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '../../utils/apiClient.ts';

const MAX_BIO = 180;

export interface ProfileBioEditorProps {
  bio: string;
  email: string;
  onSaved: (bio: string) => void;
  className?: string;
}

function ProfileBioEditor({ bio, email, onSaved, className = '' }: ProfileBioEditorProps) {
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
      const res = await apiFetch('/api/usuario/update', {
        method: 'POST',
        body: JSON.stringify({ email, descricao: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível salvar a bio.');

      onSaved(trimmed);
      setEditing(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
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
      <div className={`w-full max-w-lg ${className}`}>
        <div className="relative rounded-2xl overflow-hidden ring-1 ring-neutral-800/80 bg-neutral-950/90 shadow-xl shadow-black/25">
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-neutral-600/50 via-neutral-700/25 to-transparent" aria-hidden />
          <div className="pl-5 pr-4 py-4 md:pl-6 md:pr-5 md:py-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500 font-bold">
                Editando bio
              </p>
              <span className={`text-[10px] tabular-nums ${draft.length >= MAX_BIO - 20 ? 'text-amber-400' : 'text-zinc-600'}`}>
                {draft.length}/{MAX_BIO}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_BIO))}
              onKeyDown={handleKeyDown}
              rows={4}
              placeholder="Filmes favoritos, criadores que acompanha, o que curte assistir..."
              className="w-full bg-neutral-900/60 rounded-xl border border-neutral-800/80 px-3.5 py-3 text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700/60 leading-relaxed"
            />
            <div className="flex items-center justify-between gap-2 mt-3">
              <p className="text-[10px] text-zinc-600 hidden sm:block">Esc para cancelar</p>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={cancel}
                  disabled={saving}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-200 cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void saveBio()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cine-accent hover:bg-cine-accent-light text-neutral-950 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar bio
                </button>
              </div>
            </div>
            {error && <p className="text-[11px] text-red-400 mt-2">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      aria-label="Editar bio"
      className={`group w-full max-w-lg text-left rounded-2xl overflow-hidden ring-1 ring-neutral-800/70 bg-gradient-to-br from-neutral-900/50 to-neutral-950/40 hover:from-neutral-900/70 hover:to-neutral-950/60 hover:ring-neutral-700/80 transition-all cursor-pointer shadow-sm hover:shadow-lg hover:shadow-black/20 ${className}`}
    >
      <div className="flex min-h-[92px]">
        <div
          className="w-px shrink-0 bg-gradient-to-b from-neutral-600/45 via-neutral-700/20 to-transparent group-hover:from-neutral-500/55 group-hover:via-neutral-600/30 transition-all duration-300"
          aria-hidden
        />
        <div className="flex-1 px-4 py-4 md:px-5 md:py-5">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500 font-bold group-hover:text-zinc-400 transition-colors">
              Sobre mim
            </p>
            {saved ? (
              <span className="text-[10px] font-semibold text-emerald-400">Salvo</span>
            ) : (
              <span className="text-[10px] font-medium text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Editar
              </span>
            )}
          </div>

          {isEmpty ? (
            <p className="text-sm text-zinc-500 leading-relaxed italic group-hover:text-zinc-400 transition-colors">
              Conte quem você é na comunidade — gêneros favoritos, criadores que acompanha...
            </p>
          ) : (
            <p className="text-sm text-zinc-200 leading-relaxed group-hover:text-white transition-colors">
              {bio}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

export default memo(ProfileBioEditor);
