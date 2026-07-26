import React, { useState, useEffect } from 'react';
import { Bookmark, Heart, FolderHeart, Plus, Trash2, Edit2, Play, AlertCircle, Youtube } from 'lucide-react';
import { Obra, ListaPersonalizada, UserState } from '../types.ts';
import { motion, AnimatePresence } from 'motion/react';
import OptimizedImage from './OptimizedImage.tsx';

interface MyListProps {
  user: UserState;
  onSelectObra: (id: string) => void;
}

export default function MyList({ user, onSelectObra }: MyListProps) {
  const [loading, setLoading] = useState(true);
  const [favoritos, setFavoritos] = useState<Obra[]>([]);
  const [listas, setListas] = useState<ListaPersonalizada[]>([]);
  const [canaisSeguidos, setCanaisSeguidos] = useState<string[]>([]);
  const [allObras, setAllObras] = useState<Obra[]>([]);
  
  // Create list form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [submittingList, setSubmittingList] = useState(false);

  const fetchUserData = async () => {
    if (!user.isLoggedIn) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Fetch all works first
      const obrasRes = await fetch('/api/obras').catch(() => null);
      let obras: Obra[] = [];
      if (obrasRes && obrasRes.ok) {
        obras = await obrasRes.json().catch(() => []);
        setAllObras(obras);
      }

      // Fetch favorites
      const favsRes = await fetch(`/api/favoritos?email=${encodeURIComponent(user.email)}`).catch(() => null);
      if (favsRes && favsRes.ok) {
        const favIds: string[] = await favsRes.json().catch(() => []);
        setFavoritos(obras.filter(o => favIds.includes(o.id)));
      }

      // Fetch lists
      const listsRes = await fetch(`/api/listas?email=${encodeURIComponent(user.email)}`).catch(() => null);
      if (listsRes && listsRes.ok) {
        const data = await listsRes.json().catch(() => []);
        setListas(data);
      }

      // Fetch followed channels
      const chanRes = await fetch(`/api/canais/seguidos?email=${encodeURIComponent(user.email)}`).catch(() => null);
      if (chanRes && chanRes.ok) {
        const data = await chanRes.json().catch(() => []);
        setCanaisSeguidos(data);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setSubmittingList(true);
    try {
      const res = await fetch('/api/listas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newListName,
          descricao: newListDesc,
          usuarioEmail: user.email,
          obraIds: []
        })
      });
      if (res.ok) {
        setNewListName('');
        setNewListDesc('');
        setShowCreateModal(false);
        fetchUserData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingList(false);
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta lista personalizada?')) return;
    try {
      const res = await fetch(`/api/listas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUserData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!user.isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8 bg-[#141414] text-white">
        <FolderHeart className="w-16 h-16 text-zinc-700 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold mb-2">Sua área Cine React está vazia</h2>
        <p className="text-sm text-zinc-500 max-w-sm mb-6 leading-relaxed">
          Faça login com sua conta para poder salvar seus reacts favoritos, criar playlists customizadas e seguir os canais do YouTube mais brabos do Brasil!
        </p>
        <p className="text-xs text-red-500 font-mono">DICA: Clique no ícone de perfil no canto superior direito para logar instantaneamente.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] cine-container pt-24 pb-20 w-full space-y-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            <Bookmark className="text-red-600 w-8 h-8" />
            Minha Área Cine React
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Gerencie suas listas, canais favoritos e obras curtidas</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Criar Lista Customizada
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-zinc-400 text-sm font-mono tracking-wider">Buscando sua lista personalizada...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* FAVORITE WORKS (COL 1 & 2) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* FAVORITAS */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase border-l-4 border-red-600 pl-3">
                <Heart className="text-red-600 fill-red-600 w-5 h-5" />
                Universos Favoritos ({favoritos.length})
              </h2>

              {favoritos.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500 bg-neutral-900/20 rounded-lg border border-neutral-900">
                  Nenhuma obra favoritada ainda. Navegue pelo catálogo e clique em "Favoritar" para salvar aqui!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {favoritos.map(obra => (
                    <div 
                      key={obra.id}
                      onClick={() => onSelectObra(obra.id)}
                      className="bg-neutral-900/80 rounded-lg overflow-hidden border border-neutral-800 hover:border-red-600/30 transition-all cursor-pointer group"
                    >
                      <div className="aspect-3/4 relative overflow-hidden bg-neutral-950">
                        <OptimizedImage src={obra.poster} alt={obra.titulo} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                      </div>
                      <div className="p-2 text-center">
                        <h4 className="text-xs font-bold text-white leading-tight line-clamp-1 group-hover:text-red-500 transition-colors">{obra.titulo}</h4>
                        <span className="text-[10px] text-zinc-500">{obra.ano}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CUSTOM LISTS */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase border-l-4 border-red-600 pl-3">
                <FolderHeart className="text-red-600 w-5 h-5" />
                Listas Personalizadas ({listas.length})
              </h2>

              {listas.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500 bg-neutral-900/20 rounded-lg border border-neutral-900">
                  Nenhuma lista customizada criada. Clique em "Criar Lista Customizada" no topo para organizar seus reacts do seu jeito!
                </div>
              ) : (
                <div className="space-y-4">
                  {listas.map(lista => {
                    const matchedObras = allObras.filter(o => lista.obraIds.includes(o.id));
                    return (
                      <div key={lista.id} className="bg-neutral-900/40 p-4 rounded-xl border border-neutral-800 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-sm text-white">{lista.nome}</h3>
                            <p className="text-xs text-zinc-500 mt-0.5">{lista.descricao || "Sem descrição"}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteList(lista.id)}
                            className="text-zinc-500 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {matchedObras.length === 0 ? (
                          <p className="text-[11px] text-zinc-500 font-mono italic">Esta lista está vazia. Adicione obras à lista pela página de detalhes de cada obra!</p>
                        ) : (
                          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                            {matchedObras.map(obra => (
                              <button
                                key={obra.id}
                                onClick={() => onSelectObra(obra.id)}
                                className="flex-shrink-0 w-16 text-left group"
                              >
                                <img src={obra.poster} alt={obra.titulo} className="w-16 h-20 object-cover rounded shadow hover:opacity-80 transition-opacity" />
                                <span className="block text-[9px] text-zinc-400 mt-1 truncate group-hover:text-red-500">{obra.titulo}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* FOLLOWED CHANNELS (COL 3) */}
          <div className="bg-neutral-900/30 p-5 rounded-xl border border-neutral-800/80 space-y-4 h-fit">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Youtube className="text-red-600 w-5 h-5" />
              Canais que você segue ({canaisSeguidos.length})
            </h2>

            {canaisSeguidos.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6 leading-relaxed">
                Você não segue nenhum canal de react ainda. Siga os canais pela página de detalhes de cada obra para receber notificações de novos lançamentos!
              </p>
            ) : (
              <div className="space-y-2 lg:max-h-96 lg:overflow-y-auto">
                {canaisSeguidos.map((channel, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-900">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                      {channel}
                    </span>
                    <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-900 text-zinc-400">Ativo</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* CREATE LIST MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-950 border border-neutral-800 p-6 rounded-xl max-w-md w-full space-y-4 text-xs"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-neutral-800 pb-2">Criar Playlist Customizada</h3>
              
              <form onSubmit={handleCreateList} className="space-y-4">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Nome da Lista*</label>
                  <input
                    type="text"
                    required
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="ex: Meus Animes Favoritos de React"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-white outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Descrição (Opcional)</label>
                  <textarea
                    rows={3}
                    value={newListDesc}
                    onChange={(e) => setNewListDesc(e.target.value)}
                    placeholder="ex: Coleção com os melhores reacts de Casimiro e Fred em Attack on Titan..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-white outline-none focus:border-red-600"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-neutral-800 text-zinc-300 py-2 rounded font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingList}
                    className="flex-1 bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700 disabled:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    {submittingList ? 'Salvando...' : 'Criar Lista'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
