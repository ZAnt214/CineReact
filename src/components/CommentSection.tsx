import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Heart, Trash2 } from 'lucide-react';
import { Comentario, UserState } from '../types.ts';
import ProfileAvatar from './profile/ProfileAvatar.tsx';
import ProfileNameRow from './profile/ProfileNameRow.tsx';
import ProfileSocialLinks from './profile/ProfileSocialLinks.tsx';
import CineReactLogo from './CineReactLogo.tsx';
import type { ProfileLoadout } from '../types/gamification.ts';

interface CommentSectionProps {
  obraId: string;
  user: UserState;
  userLoadout?: ProfileLoadout | null;
  onOpenAuth?: () => void;
  getFriendlyDate: (dateStr?: string) => string;
}

export default function CommentSection({
  obraId,
  user,
  userLoadout,
  onOpenAuth,
  getFriendlyDate
}: CommentSectionProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [comentariosLoading, setComentariosLoading] = useState(false);
  const [novoComentarioTexto, setNovoComentarioTexto] = useState('');
  const [comentarioEnviando, setComentarioEnviando] = useState(false);
  const [comentarioErro, setComentarioErro] = useState('');
  const [comentarioSucesso, setComentarioSucesso] = useState(false);

  // Track liked comment IDs locally for platform persistence
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('cine_react_liked_comment_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const fetchComentarios = async () => {
    if (!obraId) return;
    setComentariosLoading(true);
    try {
      const res = await fetch(`/api/comentarios?obraId=${obraId}`);
      if (res.ok) {
        const data = await res.json();
        setComentarios(data);
      }
    } catch (e) {
      console.error("Erro ao buscar comentários:", e);
    } finally {
      setComentariosLoading(false);
    }
  };

  useEffect(() => {
    fetchComentarios();
    setNovoComentarioTexto('');
    setComentarioErro('');
    setComentarioSucesso(false);
  }, [obraId]);

  const handleToggleLike = async (commentId: string) => {
    const isLiked = likedCommentIds.includes(commentId);
    const action = isLiked ? 'unlike' : 'like';

    // 1. Optimistic update in UI
    setComentarios(prev => prev.map(c => {
      if (c.id === commentId) {
        const currentLikes = c.likes || 0;
        return {
          ...c,
          likes: action === 'like' ? currentLikes + 1 : Math.max(0, currentLikes - 1)
        };
      }
      return c;
    }));

    // 2. Update localStorage for platform persistence
    const updatedLikedIds = isLiked
      ? likedCommentIds.filter(id => id !== commentId)
      : [...likedCommentIds, commentId];
    setLikedCommentIds(updatedLikedIds);
    try {
      localStorage.setItem('cine_react_liked_comment_ids', JSON.stringify(updatedLikedIds));
    } catch (e) {
      console.error(e);
    }

    // 3. Persist to server API
    try {
      await fetch(`/api/comentarios/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
    } catch (e) {
      console.error("Erro ao registrar curtida:", e);
    }
  };

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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          obraId,
          usuarioNome: user.nome,
          usuarioEmail: user.email,
          texto: novoComentarioTexto
        })
      });

      if (res.ok) {
        setNovoComentarioTexto('');
        setComentarioSucesso(true);
        await fetchComentarios();
      } else {
        const data = await res.json();
        setComentarioErro(data.error || 'Erro ao enviar comentário.');
      }
    } catch (err) {
      setComentarioErro('Erro ao se conectar ao servidor.');
    } finally {
      setComentarioEnviando(false);
    }
  };

  const handleDeleteComentario = async (id: string) => {
    try {
      const res = await fetch(`/api/comentarios/${id}?email=${encodeURIComponent(user.email)}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchComentarios();
      }
    } catch (e) {
      console.error("Erro ao deletar comentário:", e);
    }
  };

  return (
    <div id="comment-section" className="bg-neutral-900/30 p-5 md:p-6 rounded-2xl transition-all duration-300 mt-6 space-y-6 shadow-xl">
      <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cine-accent-light" />
            Comentários e Opiniões ({comentarios.length})
          </h3>
        </div>
        <CineReactLogo size="xs" className="opacity-60" />
      </div>

      {/* FORM DE COMENTÁRIO */}
      {user.isLoggedIn ? (
        <form onSubmit={handleAddComentario} className="space-y-4 bg-neutral-950/50 p-4 md:p-5 rounded-xl shadow-inner">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <ProfileAvatar
                photoUrl={user.avatar}
                alt={user.nome}
                size="sm"
                loadout={userLoadout}
                donorBadge={!!user.isDonor}
              />
              <div className="min-w-0 flex-1">
                <ProfileNameRow
                  name={user.nome}
                  isDonor={!!user.isDonor}
                  loadout={userLoadout}
                />
                <span className="text-[10px] text-zinc-500 block mt-0.5">Deixe seu comentário e opinião para a comunidade</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <textarea
              value={novoComentarioTexto}
              onChange={(e) => setNovoComentarioTexto(e.target.value)}
              placeholder="O que achou deste react? Escreva seu comentário aqui..."
              rows={3}
              className="w-full bg-neutral-900/90 rounded-xl p-3.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cine-accent/60 transition-all resize-none"
            />

            {user.isDonor && (
              <p className="text-[10px] text-cine-accent-light flex items-center gap-1.5 font-medium">
                <Star className="w-3 h-3 animate-pulse text-cine-cream" />
                Apoiador VIP: Seu comentário ganha destaque especial no topo!
              </p>
            )}

            {comentarioErro && <p className="text-red-400 text-xs font-medium">{comentarioErro}</p>}
            {comentarioSucesso && <p className="text-emerald-400 text-xs font-medium">Comentário publicado com sucesso!</p>}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={comentarioEnviando}
                className="px-5 py-2.5 bg-cine-accent hover:bg-cine-accent-light text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-cine-accent/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {comentarioEnviando ? 'Enviando...' : 'Publicar Comentário'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-neutral-950/60 p-6 rounded-xl text-center space-y-3">
          <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-xs text-zinc-400">Entre na sua conta para deixar seu comentário e interagir.</p>
          <button 
            type="button"
            onClick={() => onOpenAuth?.()}
            className="px-5 py-2 bg-cine-accent/15 hover:bg-cine-accent/25 text-cine-accent-light font-bold text-xs rounded-full transition-all cursor-pointer inline-block"
          >
            Entrar ou Criar Conta
          </button>
        </div>
      )}

      {/* LISTA DE COMENTÁRIOS */}
      <div className="space-y-4">
        {comentariosLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-neutral-950/60 rounded-xl"></div>
            <div className="h-16 bg-neutral-950/60 rounded-xl"></div>
          </div>
        ) : comentarios.length === 0 ? (
          <div className="text-center py-10 bg-neutral-950/30 rounded-xl text-zinc-500 text-xs space-y-1">
            <MessageSquare className="w-6 h-6 mx-auto text-zinc-600 opacity-60 mb-2" />
            <p className="font-semibold">Nenhum comentário ainda</p>
            <p className="text-[11px] text-zinc-600">Seja o primeiro a compartilhar sua opinião sobre este react!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {comentarios.map((c) => {
              const isLiked = likedCommentIds.includes(c.id);
              const likesCount = c.likes || 0;

              return (
                <div key={c.id} className="p-4 bg-neutral-950/50 hover:bg-neutral-950/80 rounded-xl space-y-2 flex gap-3.5 relative group transition-colors">
                  <div className="flex-shrink-0 pt-0.5">
                    <ProfileAvatar
                      photoUrl={c.avatar}
                      alt={c.usuarioNome}
                      size="md"
                      profileDisplay={c.publicProfile?.profileDisplay ?? c.profileDisplay}
                      loadout={c.usuarioEmail === user.email ? userLoadout : undefined}
                      lite={!!c.publicProfile?.isVerifiedCreator}
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <ProfileNameRow
                      name={c.usuarioNome}
                      isDonor={!!c.isDonor}
                      profileDisplay={c.publicProfile?.profileDisplay ?? c.profileDisplay}
                      loadout={c.usuarioEmail === user.email ? userLoadout : undefined}
                      timestamp={getFriendlyDate(c.criadoEm)}
                      donorBadgeSize="md"
                    />

                    {c.publicProfile?.isVerifiedCreator && c.publicProfile.socialLinks && (
                      <ProfileSocialLinks
                        links={c.publicProfile.socialLinks}
                        size="sm"
                        align="start"
                        className="max-w-md"
                      />
                    )}
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">{c.texto}</p>

                    {/* CINEREACT LIKES SYSTEM */}
                    <div className="pt-1 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleLike(c.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          isLiked 
                            ? 'bg-cine-accent/15 text-cine-accent-light border border-cine-accent/20' 
                            : 'bg-neutral-900 text-zinc-400 hover:text-zinc-200 hover:bg-neutral-800'
                        }`}
                        title={isLiked ? "Remover curtida" : "Curtir comentário"}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-cine-accent-light text-cine-accent-light' : 'text-zinc-500'}`} />
                        <span>{likesCount}</span>
                      </button>
                    </div>
                  </div>

                  {/* EXCLUIR COMENTÁRIO SE FOR AUTOR OU ADMIN */}
                  {(user.isAdmin || user.email === c.usuarioEmail) && (
                    <button
                      onClick={() => handleDeleteComentario(c.id)}
                      className="absolute top-3.5 right-3.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-neutral-900 rounded-lg cursor-pointer"
                      title="Remover Comentário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
