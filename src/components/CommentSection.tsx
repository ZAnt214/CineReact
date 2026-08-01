import React, { useState, useEffect, useCallback, memo } from 'react';
import { MessageSquare, Heart, Trash2, Send, Star } from 'lucide-react';
import { Comentario, UserState } from '../types.ts';
import ProfileAvatar from './profile/ProfileAvatar.tsx';
import ProfileNameRow from './profile/ProfileNameRow.tsx';
import { resolveAuthorProfileProps } from '../utils/authorProfileDisplay.ts';
import type { ProfileLoadout } from '../types/gamification.ts';

const INITIAL_VISIBLE = 8;

interface CommentSectionProps {
  obraId: string;
  user: UserState;
  userLoadout?: ProfileLoadout | null;
  onOpenAuth?: () => void;
  getFriendlyDate: (dateStr?: string) => string;
}

interface CommentCardProps {
  comment: Comentario;
  isLiked: boolean;
  canDelete: boolean;
  getFriendlyDate: (dateStr?: string) => string;
  onToggleLike: (id: string) => void;
  onDelete: (id: string) => void;
}

const CommentCard = memo(function CommentCard({
  comment: c,
  isLiked,
  canDelete,
  getFriendlyDate,
  onToggleLike,
  onDelete,
}: CommentCardProps) {
  const author = resolveAuthorProfileProps(c);
  const likesCount = c.likes || 0;
  const isVip = author.isDonor;

  return (
    <article
      className={`group relative pl-4 sm:pl-5 ${
        isVip ? 'before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-full before:bg-gradient-to-b before:from-cine-accent/80 before:to-cine-accent/20' : ''
      }`}
    >
      <div className="flex gap-3">
        <div className="shrink-0 pt-0.5">
          <ProfileAvatar
            photoUrl={author.avatar}
            alt={c.usuarioNome}
            size="sm"
            profileDisplay={author.profileDisplay}
            isDonor={author.isDonor}
            lite
          />
        </div>

        <div className="flex-1 min-w-0 pb-5 border-b border-neutral-900/60 last:border-0">
          <div className="flex items-start justify-between gap-2">
            <ProfileNameRow
              name={c.usuarioNome}
              isDonor={author.isDonor}
              profileDisplay={author.profileDisplay}
              timestamp={getFriendlyDate(c.criadoEm)}
              donorBadgeSize="sm"
              verifiedDisplay="icon"
              align="start"
            />
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(c.id)}
                className="shrink-0 p-1.5 text-zinc-600 hover:text-red-400 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                title="Remover comentário"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="mt-2 text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{c.texto}</p>

          <button
            type="button"
            onClick={() => onToggleLike(c.id)}
            className={`mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
              isLiked ? 'text-cine-accent-light' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-cine-accent-light' : ''}`} />
            {likesCount > 0 ? likesCount : 'Curtir'}
          </button>
        </div>
      </div>
    </article>
  );
});

export default function CommentSection({
  obraId,
  user,
  userLoadout,
  onOpenAuth,
  getFriendlyDate,
}: CommentSectionProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [comentariosLoading, setComentariosLoading] = useState(false);
  const [novoComentarioTexto, setNovoComentarioTexto] = useState('');
  const [comentarioEnviando, setComentarioEnviando] = useState(false);
  const [comentarioErro, setComentarioErro] = useState('');
  const [comentarioSucesso, setComentarioSucesso] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const [likedCommentIds, setLikedCommentIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('cine_react_liked_comment_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const fetchComentarios = useCallback(async () => {
    if (!obraId) return;
    setComentariosLoading(true);
    try {
      const res = await fetch(`/api/comentarios?obraId=${obraId}`);
      if (res.ok) setComentarios(await res.json());
    } catch (e) {
      console.error('Erro ao buscar comentários:', e);
    } finally {
      setComentariosLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    fetchComentarios();
    setNovoComentarioTexto('');
    setComentarioErro('');
    setComentarioSucesso(false);
    setShowAll(false);
  }, [obraId, fetchComentarios]);

  const handleToggleLike = useCallback(async (commentId: string) => {
    const isLiked = likedCommentIds.includes(commentId);
    const action = isLiked ? 'unlike' : 'like';

    setComentarios((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const currentLikes = c.likes || 0;
        return {
          ...c,
          likes: action === 'like' ? currentLikes + 1 : Math.max(0, currentLikes - 1),
        };
      })
    );

    const updatedLikedIds = isLiked
      ? likedCommentIds.filter((id) => id !== commentId)
      : [...likedCommentIds, commentId];
    setLikedCommentIds(updatedLikedIds);
    try {
      localStorage.setItem('cine_react_liked_comment_ids', JSON.stringify(updatedLikedIds));
    } catch (e) {
      console.error(e);
    }

    try {
      await fetch(`/api/comentarios/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
    } catch (e) {
      console.error('Erro ao registrar curtida:', e);
    }
  }, [likedCommentIds]);

  const handleAddComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.isLoggedIn) {
      setComentarioErro('Você precisa estar logado para comentar.');
      return;
    }
    if (!novoComentarioTexto.trim()) {
      setComentarioErro('Escreva seu comentário primeiro.');
      return;
    }
    if (!obraId) return;

    setComentarioEnviando(true);
    setComentarioErro('');
    setComentarioSucesso(false);

    try {
      const res = await fetch('/api/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obraId,
          usuarioNome: user.nome,
          usuarioEmail: user.email,
          texto: novoComentarioTexto,
        }),
      });

      if (res.ok) {
        setNovoComentarioTexto('');
        setComentarioSucesso(true);
        await fetchComentarios();
      } else {
        const data = await res.json();
        setComentarioErro(data.error || 'Erro ao enviar comentário.');
      }
    } catch {
      setComentarioErro('Erro ao se conectar ao servidor.');
    } finally {
      setComentarioEnviando(false);
    }
  };

  const handleDeleteComentario = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(
          `/api/comentarios/${id}?email=${encodeURIComponent(user.email)}`,
          { method: 'DELETE' }
        );
        if (res.ok) await fetchComentarios();
      } catch (e) {
        console.error('Erro ao deletar comentário:', e);
      }
    },
    [fetchComentarios, user.email]
  );

  const visibleComments = showAll ? comentarios : comentarios.slice(0, INITIAL_VISIBLE);
  const hiddenCount = comentarios.length - INITIAL_VISIBLE;

  return (
    <section
      id="comment-section"
      className="pt-6 border-t border-neutral-900/80 [content-visibility:auto] [contain-intrinsic-size:auto_400px]"
    >
      <header className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500 font-semibold">
          Discussão
        </p>
        <div className="flex items-baseline justify-between gap-3 mt-1">
          <h2 className="font-display text-lg font-bold text-white tracking-tight">
            Comentários da comunidade
          </h2>
          {!comentariosLoading && comentarios.length > 0 && (
            <span className="text-[11px] text-zinc-600 font-mono shrink-0">
              {comentarios.length}
            </span>
          )}
        </div>
      </header>

      {user.isLoggedIn ? (
        <form onSubmit={handleAddComentario} className="mb-6">
          <div className="flex gap-3 items-start">
            <ProfileAvatar
              photoUrl={user.avatar}
              alt={user.nome}
              size="sm"
              loadout={userLoadout}
              isDonor={!!user.isDonor}
              lite
            />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="relative">
                <textarea
                  value={novoComentarioTexto}
                  onChange={(e) => setNovoComentarioTexto(e.target.value)}
                  placeholder="O que achou deste react?"
                  rows={2}
                  className="w-full bg-neutral-900/40 border border-neutral-800/80 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cine-accent/40 resize-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={comentarioEnviando || !novoComentarioTexto.trim()}
                  className="absolute right-2 bottom-2 p-2 rounded-lg bg-cine-accent text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cine-accent-dark transition-colors"
                  title="Publicar"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {user.isDonor && (
                <p className="text-[10px] text-cine-accent-light/80 flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Apoiador VIP — seu comentário ganha destaque
                </p>
              )}
              {comentarioErro && <p className="text-red-400 text-xs">{comentarioErro}</p>}
              {comentarioSucesso && (
                <p className="text-emerald-400 text-xs">Comentário publicado!</p>
              )}
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 flex items-center justify-between gap-4 py-3 px-4 rounded-xl border border-neutral-800/60 bg-neutral-900/20">
          <div className="flex items-center gap-2 text-zinc-500">
            <MessageSquare className="w-4 h-4 shrink-0" />
            <p className="text-xs">Entre para comentar com a comunidade</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenAuth?.()}
            className="shrink-0 px-4 py-1.5 text-xs font-semibold text-cine-accent-light border border-cine-accent/30 rounded-full hover:bg-cine-accent/10 transition-colors"
          >
            Entrar
          </button>
        </div>
      )}

      {comentariosLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-800 shrink-0" />
              <div className="flex-1 space-y-2 pb-4 border-b border-neutral-900/40">
                <div className="h-3 bg-neutral-800 rounded w-32" />
                <div className="h-3 bg-neutral-800 rounded w-full" />
                <div className="h-3 bg-neutral-800 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : comentarios.length === 0 ? (
        <div className="py-10 text-center">
          <MessageSquare className="w-8 h-8 mx-auto text-zinc-700 mb-2" />
          <p className="text-sm text-zinc-500">Nenhum comentário ainda</p>
          <p className="text-xs text-zinc-600 mt-1">Seja o primeiro a opinar sobre este react</p>
        </div>
      ) : (
        <>
          <div className="space-y-0">
            {visibleComments.map((c) => (
              <CommentCard
                key={c.id}
                comment={c}
                isLiked={likedCommentIds.includes(c.id)}
                canDelete={user.isAdmin || user.email === c.usuarioEmail}
                getFriendlyDate={getFriendlyDate}
                onToggleLike={handleToggleLike}
                onDelete={handleDeleteComentario}
              />
            ))}
          </div>

          {!showAll && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-4 w-full py-2.5 text-xs font-medium text-zinc-400 border border-neutral-800/80 rounded-lg hover:text-white hover:border-neutral-700 transition-colors"
            >
              Ver mais {hiddenCount} comentário{hiddenCount === 1 ? '' : 's'}
            </button>
          )}
        </>
      )}
    </section>
  );
}
