import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Plus, Film, Trash2, Check, Edit3, Youtube, AlertCircle, RefreshCw, MessageSquare, Users, Star, Sparkles, Award, Database, Server, Copy, ChevronDown, ChevronUp, CheckCircle2, ArrowRight, X, Loader2, Inbox, LayoutGrid, Shield, Link2, Save, Eye } from 'lucide-react';
import { Obra, ReactVideo, Comentario, UserState, Notificacao } from '../types.ts';
import { motion, AnimatePresence } from 'motion/react';
import { adminFetch } from '../utils/adminApi.ts';

type AdminTab = 'catalogo' | 'conteudo' | 'criadores' | 'moderacao' | 'sistema';

interface AdminPanelProps {
  user: UserState;
  onSelectObra: (id: string) => void;
}

export default function AdminPanel({ user, onSelectObra }: AdminPanelProps) {
  const [obras, setObras] = useState<Obra[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [reacts, setReacts] = useState<ReactVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('catalogo');
  const [solicitacoes, setSolicitacoes] = useState<Notificacao[]>([]);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [savingObra, setSavingObra] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processingSolicitacao, setProcessingSolicitacao] = useState<string | null>(null);
  
  // Supabase states
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [loadingSupabaseStatus, setLoadingSupabaseStatus] = useState(false);
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [migratingSupabase, setMigratingSupabase] = useState(false);
  const [showSqlInstructions, setShowSqlInstructions] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // CineReact Recomenda state
  const [reactSearch, setReactSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [recomendadoLink, setRecomendadoLink] = useState('');
  const [submittingRecomendado, setSubmittingRecomendado] = useState(false);

  // Create Obra form state
  const [obraId, setObraId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<'filme' | 'serie' | 'anime' | 'jogo'>('filme');
  const [sinopse, setSinopse] = useState('');
  const [ano, setAno] = useState(new Date().getFullYear().toString());
  const [generos, setGeneros] = useState('Ação, Ficção');
  const [banner, setBanner] = useState('');
  const [poster, setPoster] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [destacado, setDestacado] = useState(false);
  const [submittingObra, setSubmittingObra] = useState(false);

  // Quick preset loader helper
  const [importQuery, setImportQuery] = useState('');
  const [importing, setImporting] = useState(false);

  // YouTube Channel Import state
  const [canalUrl, setCanalUrl] = useState('');
  const [importingCanal, setImportingCanal] = useState(false);

  // Catálogo manual (link → preview → salvar)
  const [catalogCanalUrl, setCatalogCanalUrl] = useState('');
  const [catalogCanalPreview, setCatalogCanalPreview] = useState<any>(null);
  const [loadingCatalogCanalPreview, setLoadingCatalogCanalPreview] = useState(false);
  const [savingCatalogCanal, setSavingCatalogCanal] = useState(false);

  const [catalogVideoUrl, setCatalogVideoUrl] = useState('');
  const [catalogVideoObraId, setCatalogVideoObraId] = useState('');
  const [catalogVideoPreview, setCatalogVideoPreview] = useState<any>(null);
  const [loadingCatalogVideoPreview, setLoadingCatalogVideoPreview] = useState(false);
  const [savingCatalogVideo, setSavingCatalogVideo] = useState(false);

  const fetchSupabaseStatus = async () => {
    try {
      setLoadingSupabaseStatus(true);
      const res = await fetch('/api/supabase/status');
      if (res.ok) {
        const data = await res.json();
        setSupabaseStatus(data);
      }
    } catch (e) {
      console.error("Erro ao carregar status do Supabase:", e);
    } finally {
      setLoadingSupabaseStatus(false);
    }
  };

  const handleSyncSupabase = async () => {
    if (syncingSupabase) return;
    setSyncingSupabase(true);
    try {
      const res = await adminFetch(user.email, '/api/supabase/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Sincronização concluída com sucesso!');
        fetchSupabaseStatus();
        fetchAdminData();
      } else {
        alert(data.error || 'Erro ao sincronizar do Supabase.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao sincronizar.');
    } finally {
      setSyncingSupabase(false);
    }
  };

  const handleMigrateSupabase = async () => {
    if (migratingSupabase) return;
    if (!window.confirm('Tem certeza de que deseja exportar todos os dados locais do CineReact (Obras, Reacts, Comentários, Usuários) para o seu Supabase remoto? Isso fará um upsert nas tabelas remotas.')) {
      return;
    }
    setMigratingSupabase(true);
    try {
      const res = await adminFetch(user.email, '/api/supabase/migrate', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Migração concluída com sucesso!');
        fetchSupabaseStatus();
      } else {
        alert(data.error || 'Erro ao migrar dados para o Supabase.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao migrar dados.');
    } finally {
      setMigratingSupabase(false);
    }
  };

  const copySqlToClipboard = () => {
    const sql = `-- CINE REACT - SUPABASE DATABASE SCHEMA
DROP TABLE IF EXISTS notificacoes CASCADE;
DROP TABLE IF EXISTS listas CASCADE;
DROP TABLE IF EXISTS canais_seguidos CASCADE;
DROP TABLE IF EXISTS favoritos CASCADE;
DROP TABLE IF EXISTS comentarios CASCADE;
DROP TABLE IF EXISTS reacts CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS obras CASCADE;

CREATE TABLE obras (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  sinopse TEXT,
  synopsis TEXT,
  ano INTEGER,
  generos TEXT[] DEFAULT '{}',
  banner TEXT,
  poster TEXT,
  "trailerUrl" TEXT,
  destacado BOOLEAN DEFAULT false,
  "channelId" TEXT
);

CREATE TABLE reacts (
  id TEXT PRIMARY KEY,
  "obraId" TEXT REFERENCES obras(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  "videoUrl" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  duracao TEXT,
  "canalNome" TEXT,
  visualizacoes INTEGER DEFAULT 0,
  "isRecomendado" BOOLEAN DEFAULT false
);

CREATE TABLE comentarios (
  id TEXT PRIMARY KEY,
  "obraId" TEXT REFERENCES obras(id) ON DELETE CASCADE,
  "usuarioNome" TEXT NOT NULL,
  "usuarioEmail" TEXT NOT NULL,
  texto TEXT NOT NULL,
  nota INTEGER DEFAULT 5,
  "criadoEm" TEXT NOT NULL
);

CREATE TABLE favoritos (
  id BIGSERIAL PRIMARY KEY,
  "usuarioEmail" TEXT NOT NULL,
  "obraId" TEXT REFERENCES obras(id) ON DELETE CASCADE,
  UNIQUE("usuarioEmail", "obraId")
);

CREATE TABLE canais_seguidos (
  id BIGSERIAL PRIMARY KEY,
  "usuarioEmail" TEXT NOT NULL,
  "canalNome" TEXT NOT NULL,
  UNIQUE("usuarioEmail", "canalNome")
);

CREATE TABLE listas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  "usuarioEmail" TEXT NOT NULL,
  "obraIds" TEXT[] DEFAULT '{}'
);

CREATE TABLE notificacoes (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  "criadoEm" TEXT NOT NULL,
  "canalNome" TEXT,
  "usuarioEmail" TEXT
);

CREATE TABLE usuarios (
  email TEXT PRIMARY KEY,
  id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  avatar TEXT,
  "isAdmin" BOOLEAN DEFAULT false,
  "isDonor" BOOLEAN DEFAULT false,
  "continueWatching" JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE obras DISABLE ROW LEVEL SECURITY;
ALTER TABLE reacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE favoritos DISABLE ROW LEVEL SECURITY;
ALTER TABLE canais_seguidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE listas DISABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    window.setTimeout(() => setActionMessage(null), 5000);
  };

  const fetchSolicitacoes = useCallback(async () => {
    try {
      const res = await adminFetch(user.email, '/api/admin/notificacoes?tipo=solicitacoes');
      if (res.ok) {
        const data = await res.json();
        setSolicitacoes(data.filter((n: Notificacao) => !n.lida));
      }
    } catch (e) {
      console.error('Erro ao carregar solicitações:', e);
    }
  }, [user.email]);

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [obrasRes, commentsRes, usersRes, reactsRes] = await Promise.all([
        fetch('/api/obras').catch(() => null),
        fetch('/api/comentarios').catch(() => null),
        adminFetch(user.email, '/api/usuarios').catch(() => null),
        adminFetch(user.email, '/api/reacts').catch(() => null),
      ]);

      if (obrasRes && obrasRes.ok) {
        const data = await obrasRes.json().catch(() => []);
        setObras(data);
      }

      if (commentsRes && commentsRes.ok) {
        const data = await commentsRes.json().catch(() => []);
        setComentarios(data);
      }

      if (usersRes && usersRes.ok) {
        const data = await usersRes.json().catch(() => []);
        setUsuarios(data);
      }

      if (reactsRes && reactsRes.ok) {
        const data = await reactsRes.json().catch(() => []);
        setReacts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user.email]);

  useEffect(() => {
    if (user.isAdmin) {
      fetchAdminData();
      fetchSupabaseStatus();
      fetchSolicitacoes();
    }
  }, [user.isAdmin, fetchAdminData, fetchSolicitacoes]);

  const handleCreateObra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraId.trim() || !titulo.trim()) {
      alert('ID e Título são obrigatórios.');
      return;
    }

    setSubmittingObra(true);
    try {
      const res = await adminFetch(user.email, '/api/obras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: obraId.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          titulo,
          tipo,
          sinopse,
          ano: Number(ano),
          generos: generos.split(',').map(s => s.trim()),
          banner,
          poster,
          trailerUrl,
          destacado
        })
      });
      if (res.ok) {
        setObraId('');
        setTitulo('');
        setSinopse('');
        setBanner('');
        setPoster('');
        setTrailerUrl('');
        setDestacado(false);
        fetchAdminData();
        showMessage('success', 'Obra cadastrada com sucesso!');
      } else {
        const err = await res.json();
        showMessage('error', err.error || 'Erro ao cadastrar obra.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingObra(false);
    }
  };

  const handleUpdateObra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingObra) return;

    setSavingObra(true);
    try {
      const res = await adminFetch(user.email, `/api/obras/${editingObra.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: editingObra.titulo,
          tipo: editingObra.tipo,
          sinopse: editingObra.sinopse,
          ano: editingObra.ano,
          generos: editingObra.generos,
          banner: editingObra.banner,
          poster: editingObra.poster,
          trailerUrl: editingObra.trailerUrl,
          destacado: editingObra.destacado,
        }),
      });

      if (res.ok) {
        setEditingObra(null);
        fetchAdminData();
        showMessage('success', 'Obra atualizada com sucesso!');
      } else {
        const err = await res.json();
        showMessage('error', err.error || 'Erro ao atualizar obra.');
      }
    } catch (e) {
      console.error(e);
      showMessage('error', 'Erro de conexão ao atualizar obra.');
    } finally {
      setSavingObra(false);
    }
  };

  const handleDeleteObra = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta obra? Todos os reacts e comentários associados serão deletados.')) return;
    try {
      const res = await adminFetch(user.email, `/api/obras/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAdminData();
        showMessage('success', 'Obra excluída.');
      } else {
        const err = await res.json();
        showMessage('error', err.error || 'Erro ao excluir obra.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Deseja deletar este comentário?')) return;
    try {
      const res = await adminFetch(user.email, `/api/comentarios/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAdminData();
      } else {
        const err = await res.json();
        showMessage('error', err.error || 'Erro ao deletar comentário.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleIntelligentImport = async () => {
    if (!importQuery.trim()) return;
    setImporting(true);
    try {
      const res = await adminFetch(user.email, '/api/admin/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: importQuery.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchAdminData();
        setImportQuery('');
        showMessage('success', data.message || 'Conteúdo descoberto e adicionado ao catálogo!');
      } else {
        showMessage('error', data.error || 'Erro ao descobrir conteúdo.');
      }
    } catch (e) {
      console.error(e);
      showMessage('error', 'Erro de conexão ao descobrir conteúdo.');
    } finally {
      setImporting(false);
    }
  };

  const handleImportCanal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canalUrl.trim()) return;
    setImportingCanal(true);
    try {
      const res = await adminFetch(user.email, '/api/canais/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: canalUrl, email: user.email }),
      });
      if (res.ok) {
        const data = await res.json();
        setCanalUrl('');
        fetchAdminData();
        if (data.mode === 'real') {
          showMessage('success', `Canal "${data.obra.titulo}" importado do YouTube com dados oficiais!`);
        } else if (data.mode === 'scrape' || data.mode === 'oembed') {
          showMessage('success', `Canal "${data.obra.titulo}" importado com nome e imagens reais do YouTube!`);
        } else if (data.mode === 'simulated') {
          showMessage('success', `Canal "${data.obra.titulo}" criado com simulação Gemini.`);
        } else {
          showMessage('success', `Canal "${data.obra.titulo}" criado.`);
        }
      } else {
        const err = await res.json();
        showMessage('error', err.error || 'Erro ao importar canal.');
      }
    } catch (err) {
      console.error(err);
      showMessage('error', 'Erro de conexão ao importar canal.');
    } finally {
      setImportingCanal(false);
    }
  };

  const handleCatalogCanalPreview = async () => {
    if (!catalogCanalUrl.trim()) return;
    setLoadingCatalogCanalPreview(true);
    setCatalogCanalPreview(null);
    try {
      const res = await adminFetch(user.email, '/api/catalogo/canal/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: catalogCanalUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setCatalogCanalPreview(data.preview);
      } else {
        showMessage('error', data.error || 'Erro ao carregar preview do canal.');
      }
    } catch {
      showMessage('error', 'Erro de conexão ao carregar preview do canal.');
    } finally {
      setLoadingCatalogCanalPreview(false);
    }
  };

  const handleCatalogCanalSave = async () => {
    if (!catalogCanalUrl.trim()) return;
    setSavingCatalogCanal(true);
    try {
      const res = await adminFetch(user.email, '/api/catalogo/canal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: catalogCanalUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchAdminData();
        setCatalogCanalPreview(data.obra);
        const supa = data.savedToSupabase ? ' Salvo no Supabase.' : ' Salvo localmente (configure o Supabase para nuvem).';
        showMessage('success', (data.message || 'Canal salvo!') + supa);
      } else {
        showMessage('error', data.error || 'Erro ao salvar canal.');
      }
    } catch {
      showMessage('error', 'Erro de conexão ao salvar canal.');
    } finally {
      setSavingCatalogCanal(false);
    }
  };

  const handleCatalogVideoPreview = async () => {
    if (!catalogVideoUrl.trim()) return;
    setLoadingCatalogVideoPreview(true);
    setCatalogVideoPreview(null);
    try {
      const res = await adminFetch(user.email, '/api/catalogo/video/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: catalogVideoUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setCatalogVideoPreview(data.preview);
        if (data.preview?.obraId) setCatalogVideoObraId(data.preview.obraId);
      } else {
        showMessage('error', data.error || 'Erro ao carregar preview do vídeo.');
      }
    } catch {
      showMessage('error', 'Erro de conexão ao carregar preview do vídeo.');
    } finally {
      setLoadingCatalogVideoPreview(false);
    }
  };

  const handleCatalogVideoSave = async () => {
    if (!catalogVideoUrl.trim()) return;
    setSavingCatalogVideo(true);
    try {
      const res = await adminFetch(user.email, '/api/catalogo/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: catalogVideoUrl.trim(),
          obraId: catalogVideoObraId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchAdminData();
        setCatalogVideoPreview(data.react);
        const supa = data.savedToSupabase ? ' Salvo no Supabase.' : ' Salvo localmente (configure o Supabase para nuvem).';
        showMessage('success', (data.message || 'Vídeo salvo!') + supa);
        setCatalogVideoUrl('');
      } else {
        showMessage('error', data.error || 'Erro ao salvar vídeo.');
      }
    } catch {
      showMessage('error', 'Erro de conexão ao salvar vídeo.');
    } finally {
      setSavingCatalogVideo(false);
    }
  };

  const handleToggleRecomendado = async (reactId: string, currentStatus: boolean) => {
    setTogglingId(reactId);
    try {
      const res = await adminFetch(user.email, `/api/reacts/${reactId}/recomendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recomendado: !currentStatus }),
      });
      if (res.ok) {
        fetchAdminData();
      } else {
        alert('Erro ao atualizar recomendação.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao conectar com o servidor.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleRecommendByLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recomendadoLink.trim()) return;

    setSubmittingRecomendado(true);
    try {
      const res = await adminFetch(user.email, '/api/reacts/recomendar-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: recomendadoLink }),
      });

      if (res.ok) {
        const data = await res.json();
        setRecomendadoLink('');
        fetchAdminData();
        showMessage('success', `Vídeo "${data.titulo}" adicionado ao CineReact Recomenda!`);
      } else {
        const err = await res.json();
        showMessage('error', err.error || 'Não foi possível adicionar o vídeo.');
      }
    } catch (err) {
      console.error(err);
      showMessage('error', 'Erro de rede ao adicionar recomendação.');
    } finally {
      setSubmittingRecomendado(false);
    }
  };

  const extractCanalUrl = (mensagem: string) => {
    const match = mensagem.match(/\((https?:\/\/[^)]+)\)/);
    return match?.[1] || '';
  };

  const handleApproveSolicitacao = async (notif: Notificacao) => {
    const canalUrl = extractCanalUrl(notif.mensagem);
    if (!canalUrl) {
      showMessage('error', 'URL do canal não encontrada nesta solicitação.');
      return;
    }

    setProcessingSolicitacao(notif.id);
    try {
      const res = await adminFetch(user.email, '/api/canais/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: canalUrl, email: user.email }),
      });
      const data = await res.json();
      if (res.ok) {
        await adminFetch(user.email, `/api/notificacoes/${notif.id}`, { method: 'DELETE' });
        fetchSolicitacoes();
        fetchAdminData();
        showMessage('success', `Canal "${data.obra?.titulo || notif.canalNome}" importado com sucesso!`);
      } else {
        showMessage('error', data.error || 'Erro ao importar canal da solicitação.');
      }
    } catch (e) {
      console.error(e);
      showMessage('error', 'Erro ao processar solicitação.');
    } finally {
      setProcessingSolicitacao(null);
    }
  };

  const handleDismissSolicitacao = async (id: string) => {
    setProcessingSolicitacao(id);
    try {
      const res = await adminFetch(user.email, `/api/notificacoes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSolicitacoes();
        showMessage('success', 'Solicitação dispensada.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingSolicitacao(null);
    }
  };

  const tabs: { id: AdminTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'catalogo', label: 'Catálogo', icon: Link2 },
    { id: 'conteudo', label: 'Conteúdo', icon: LayoutGrid },
    { id: 'criadores', label: 'Criadores', icon: Inbox, badge: solicitacoes.length },
    { id: 'moderacao', label: 'Moderação', icon: MessageSquare },
    { id: 'sistema', label: 'Sistema', icon: Database },
  ];

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen cine-container pt-24 pb-20 w-full text-center flex flex-col items-center justify-center">
        <AlertCircle className="w-16 h-16 text-cine-accent-light mb-4 animate-pulse" />
        <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
        <p className="text-zinc-500 max-w-md text-xs leading-relaxed">
          Este painel administrativo é restrito para administradores credenciados do CineReact.
          Se você possui privilégios de administrador, faça login com a conta correta no menu superior.
        </p>
      </div>
    );
  }

  return (
    <motion.div className="min-h-screen bg-[#080a14] cine-container pt-24 pb-20 w-full space-y-8 text-white">
      
      {/* HEADER */}
      <div className="border-b border-zinc-800 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            <Settings className="text-cine-accent-light w-8 h-8" />
            Painel do Administrador
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Gerencie catálogo, criadores, usuários e integrações</p>
        </div>
        <button
          onClick={() => { fetchAdminData(); fetchSolicitacoes(); fetchSupabaseStatus(); }}
          disabled={loading}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-3.5 rounded-xl border text-sm flex items-center gap-2 ${
              actionMessage.type === 'success'
                ? 'bg-green-950/40 border-green-500/30 text-green-300'
                : 'bg-red-950/40 border-red-500/30 text-red-300'
            }`}
          >
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {actionMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === id
                ? 'bg-cine-accent text-black shadow-lg shadow-cine-accent/20'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {badge ? (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                activeTab === id ? 'bg-black/20 text-black' : 'bg-cine-accent/20 text-cine-accent-light'
              }`}>
                {badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 py-12 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin text-cine-accent-light" />
          <span className="text-sm">Carregando dados do painel...</span>
        </div>
      )}

      {!loading && activeTab === 'catalogo' && (
        <motion.div className="space-y-8">
          <motion.div className="bg-gradient-to-br from-cine-accent/10 via-zinc-900/40 to-zinc-950 p-6 rounded-2xl border border-cine-accent/20 space-y-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Link2 className="w-5 h-5 text-cine-accent-light" />
              Catálogo por Link
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
              Cole o link do canal ou do vídeo do YouTube. O sistema carrega automaticamente nome, foto, descrição e thumbnail
              <strong className="text-cine-cream"> sem depender da API do YouTube</strong>. Tudo é salvo no banco e sincronizado com o Supabase quando configurado.
            </p>
            {supabaseStatus?.active ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-950/40 border border-green-500/30 px-2.5 py-1 rounded-full">
                <Database className="w-3 h-3" /> Supabase ativo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cine-accent-light bg-cine-surface/40 border border-cine-accent/30 px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3 h-3" /> Supabase não configurado — salvando localmente
              </span>
            )}
          </motion.div>

          {/* CANAL */}
          <motion.div className="bg-zinc-900/30 backdrop-blur-md p-6 rounded-2xl border border-zinc-800 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cine-accent-light flex items-center gap-2">
              <Youtube className="w-4 h-4" />
              Adicionar Canal
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={catalogCanalUrl}
                onChange={(e) => { setCatalogCanalUrl(e.target.value); setCatalogCanalPreview(null); }}
                placeholder="https://youtube.com/@nome-do-canal"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-cine-accent"
              />
              <button
                onClick={handleCatalogCanalPreview}
                disabled={loadingCatalogCanalPreview || !catalogCanalUrl.trim()}
                className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingCatalogCanalPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Pré-visualizar
              </button>
              <button
                onClick={handleCatalogCanalSave}
                disabled={savingCatalogCanal || !catalogCanalUrl.trim()}
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-cine-accent-light to-cine-accent text-black text-xs font-black disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {savingCatalogCanal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Canal
              </button>
            </div>

            {catalogCanalPreview && (
              <motion.div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                {catalogCanalPreview.poster && (
                  <img src={catalogCanalPreview.poster} alt="" className="w-20 h-20 rounded-full object-cover ring-2 ring-cine-accent/30 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-lg">{catalogCanalPreview.titulo}</p>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-3">{catalogCanalPreview.sinopse || 'Sem descrição'}</p>
                  <div className="flex flex-wrap gap-2 mt-2 text-[10px] font-mono text-zinc-500">
                    <span>Fonte: {catalogCanalPreview.source}</span>
                    {catalogCanalPreview.channelId && <span>ID: {catalogCanalPreview.channelId}</span>}
                    {catalogCanalPreview.alreadyExists && <span className="text-cine-accent-light">Já existe — será atualizado</span>}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* VÍDEO */}
          <motion.div className="bg-zinc-900/30 backdrop-blur-md p-6 rounded-2xl border border-zinc-800 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cine-accent-light flex items-center gap-2">
              <Film className="w-4 h-4" />
              Adicionar Vídeo
            </h3>
            <div className="flex flex-col gap-2">
              <input
                type="url"
                value={catalogVideoUrl}
                onChange={(e) => { setCatalogVideoUrl(e.target.value); setCatalogVideoPreview(null); }}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-cine-accent"
              />
              <select
                value={catalogVideoObraId}
                onChange={(e) => setCatalogVideoObraId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-cine-accent"
              >
                <option value="">Detectar canal automaticamente</option>
                {obras.filter(o => o.tipo === 'canal').map(canal => (
                  <option key={canal.id} value={canal.id}>{canal.titulo}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleCatalogVideoPreview}
                disabled={loadingCatalogVideoPreview || !catalogVideoUrl.trim()}
                className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingCatalogVideoPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Pré-visualizar
              </button>
              <button
                onClick={handleCatalogVideoSave}
                disabled={savingCatalogVideo || !catalogVideoUrl.trim()}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cine-accent-light to-cine-accent text-black text-xs font-black disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {savingCatalogVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Adicionar ao Catálogo
              </button>
            </div>

            {catalogVideoPreview && (
              <motion.div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                {catalogVideoPreview.thumbnailUrl && (
                  <img src={catalogVideoPreview.thumbnailUrl} alt="" className="w-full sm:w-48 aspect-video rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold line-clamp-2">{catalogVideoPreview.titulo}</p>
                  <p className="text-xs text-cine-cream mt-1">{catalogVideoPreview.canalNome}</p>
                  <p className="text-xs text-zinc-500 mt-2">
                    Categoria: <strong className="text-zinc-300">{catalogVideoPreview.obraTitulo || 'Será criada automaticamente'}</strong>
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2 text-[10px] font-mono text-zinc-500">
                    <span>ID: {catalogVideoPreview.id}</span>
                    {catalogVideoPreview.alreadyExists && <span className="text-cine-accent-light">Já existe — será atualizado</span>}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}

      {!loading && activeTab === 'sistema' && (
      <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 text-cine-accent-light">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white uppercase tracking-wider">Integração Supabase</h2>
                {loadingSupabaseStatus ? (
                  <span className="w-3 h-3 border-2 border-cine-accent/30 border-t-cine-accent rounded-full animate-spin" />
                ) : supabaseStatus?.active ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                    Conectado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                    Modo Local (JSON)
                  </span>
                )}
              </div>
              <p className="text-zinc-500 text-xs mt-0.5">
                {supabaseStatus?.active 
                  ? `Utilizando banco de dados oficial hospedado no Supabase (${supabaseStatus.url})`
                  : "Salvando alterações no banco offline `db_cine_react.json`. Configure o Supabase para persistência na nuvem!"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchSupabaseStatus}
              disabled={loadingSupabaseStatus}
              className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Atualizar Status"
            >
              <RefreshCw className={`w-4 h-4 ${loadingSupabaseStatus ? 'animate-spin' : ''}`} />
            </button>
            
            {supabaseStatus?.active && (
              <>
                <button
                  onClick={handleSyncSupabase}
                  disabled={syncingSupabase || migratingSupabase}
                  className="px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-cine-accent/30 text-cine-accent-light text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {syncingSupabase ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                  Importar do Supabase
                </button>
                
                <button
                  onClick={handleMigrateSupabase}
                  disabled={syncingSupabase || migratingSupabase}
                  className="px-4 py-2.5 rounded-xl bg-cine-accent hover:bg-cine-accent-light disabled:opacity-50 text-black font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cine-accent/20"
                >
                  {migratingSupabase ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                  Exportar Local para Supabase
                </button>
              </>
            )}
          </div>
        </div>

        {/* STATS COUNT */}
        {supabaseStatus && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-950/50 p-4 rounded-xl border border-zinc-850">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Obras / Canais</span>
              <p className="text-lg font-black text-white">{supabaseStatus.counts.obras}</p>
            </div>
            <div className="space-y-1 text-center md:text-left border-l border-zinc-850/60 pl-4">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Reacts / Vídeos</span>
              <p className="text-lg font-black text-white">{supabaseStatus.counts.reacts}</p>
            </div>
            <div className="space-y-1 text-center md:text-left border-l border-zinc-850/60 pl-4">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Comentários</span>
              <p className="text-lg font-black text-white">{supabaseStatus.counts.comentarios}</p>
            </div>
            <div className="space-y-1 text-center md:text-left border-l border-zinc-850/60 pl-4">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Usuários Ativos</span>
              <p className="text-lg font-black text-white">{supabaseStatus.counts.usuarios}</p>
            </div>
          </div>
        )}

        {/* HOW TO CONFIGURE EXPANDER */}
        <div className="border-t border-zinc-800/60 pt-4">
          <button
            onClick={() => setShowSqlInstructions(!showSqlInstructions)}
            className="flex items-center justify-between w-full text-zinc-400 hover:text-white transition-colors text-xs font-bold"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cine-accent-light" />
              Como configurar as tabelas e chaves no Supabase?
            </span>
            {showSqlInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showSqlInstructions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-4 text-xs text-zinc-400 leading-relaxed"
            >
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-2.5">
                <p className="font-bold text-white">Passo 1: Adicione as variáveis de ambiente no AI Studio</p>
                <p>
                  Abra as configurações do seu projeto no menu de engrenagem do AI Studio (Secrets / Env) e adicione os seguintes segredos:
                </p>
                <div className="bg-zinc-900 p-3 rounded-lg font-mono text-[10px] text-zinc-300 space-y-1 border border-zinc-800">
                  <div>SUPABASE_URL = "https://seu-projeto.supabase.co"</div>
                  <div>SUPABASE_ANON_KEY = "sua-anon-key-secreta"</div>
                </div>
                <p className="text-[10px] text-cine-accent-light/80">
                  * Após salvar as chaves, a reinicialização do servidor é automática e a integração com o Supabase ficará ativa imediatamente!
                </p>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-white">Passo 2: Execute o script SQL no Supabase</p>
                  <button
                    onClick={copySqlToClipboard}
                    className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-750 text-zinc-300 transition-all flex items-center gap-1 font-mono text-[10px] cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar SQL
                      </>
                    )}
                  </button>
                </div>
                <p>
                  Acesse o painel do seu Supabase, clique em <strong>SQL Editor</strong>, crie uma nova query, cole o script copiado e execute:
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      )}

      {!loading && activeTab === 'criadores' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/30 backdrop-blur-md p-5 rounded-xl border border-cine-accent/20 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cine-accent-light flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              Solicitações de Criadores ({solicitacoes.length})
            </h2>
            {solicitacoes.length === 0 ? (
              <p className="text-xs text-zinc-500">Nenhuma solicitação pendente no momento.</p>
            ) : (
              <motion.div className="space-y-3">
                {solicitacoes.map((notif) => (
                  <div key={notif.id} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                    <div>
                      <p className="text-sm font-bold text-white">{notif.canalNome || 'Canal solicitado'}</p>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{notif.mensagem}</p>
                      <p className="text-[10px] text-zinc-600 mt-1">{new Date(notif.criadoEm).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveSolicitacao(notif)}
                        disabled={processingSolicitacao === notif.id}
                        className="flex-1 px-3 py-2 rounded-lg bg-cine-accent hover:bg-cine-accent-light text-black text-xs font-bold disabled:opacity-50 cursor-pointer"
                      >
                        {processingSolicitacao === notif.id ? 'Importando...' : 'Aprovar e Importar'}
                      </button>
                      <button
                        onClick={() => handleDismissSolicitacao(notif.id)}
                        disabled={processingSolicitacao === notif.id}
                        className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-bold hover:text-white cursor-pointer"
                      >
                        Dispensar
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          <div className="bg-zinc-900/30 backdrop-blur-md p-5 rounded-xl border border-cine-accent/20 space-y-4 shadow-lg">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cine-accent-light flex items-center gap-2">
              <Youtube className="w-4 h-4 text-cine-accent-light" />
              Importar Canal do YouTube
            </h2>
            <form onSubmit={handleImportCanal} className="flex gap-2 text-xs">
              <input
                type="text"
                value={canalUrl}
                onChange={(e) => setCanalUrl(e.target.value)}
                placeholder="ex: @casimiro ou link do canal..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2.5 outline-none focus:border-cine-accent"
              />
              <button
                type="submit"
                disabled={importingCanal || !canalUrl.trim()}
                className="bg-gradient-to-r from-cine-accent-light to-cine-accent text-black font-black px-4 py-2.5 rounded disabled:opacity-50 cursor-pointer"
              >
                {importingCanal ? 'Importando...' : 'Importar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {!loading && activeTab === 'conteudo' && (
      <div className="space-y-8">
          
          {/* GEMINI INTELLIGENT DISCOVERY (EASY CADASTRO!) */}
          <div className="bg-zinc-900/30 backdrop-blur-md p-5 rounded-xl border border-cine-accent/20 space-y-4 shadow-lg">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cine-accent-light flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              Descoberta e Cadastro Inteligente (Gemini AI)
            </h2>
            <p className="text-xs text-zinc-400">
              Digite o nome de qualquer filme, série, anime ou jogo. O sistema usa Gemini AI para catalogar a obra e busca reacts reais no YouTube automaticamente.
            </p>

            <div className="flex gap-2 text-xs">
              <input
                type="text"
                value={importQuery}
                onChange={(e) => setImportQuery(e.target.value)}
                placeholder="ex: Inception, Deadpool 3, Elden Ring, Naruto..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2.5 outline-none focus:border-cine-accent"
              />
              <button
                onClick={handleIntelligentImport}
                disabled={importing || !importQuery.trim()}
                className="bg-gradient-to-r from-cine-accent-light to-cine-accent hover:from-cine-cream hover:to-cine-accent-light disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black px-4 py-2.5 rounded transition-all cursor-pointer shadow-lg shadow-cine-accent/20"
              >
                {importing ? "Analisando..." : "Cadastrar com AI"}
              </button>
            </div>
          </div>

          {/* MANUAL CADASTRO */}
          <div className="bg-zinc-900/30 p-5 rounded-xl border border-zinc-800 space-y-4 shadow-md">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Plus className="text-cine-accent-light w-5 h-5" />
              Cadastrar Obra Manualmente
            </h2>

            <form onSubmit={handleCreateObra} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Slug ID Único* (ex: interestelar, resident-evil)</label>
                <input
                  type="text"
                  required
                  value={obraId}
                  onChange={(e) => setObraId(e.target.value)}
                  placeholder="interestelar"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-cine-accent"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Título da Obra*</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Interestelar"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-cine-accent"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Tipo de Conteúdo*</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-cine-accent"
                >
                  <option value="filme">Filme</option>
                  <option value="serie">Série</option>
                  <option value="anime">Anime</option>
                  <option value="jogo">Jogo</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Ano de Lançamento*</label>
                <input
                  type="number"
                  required
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-cine-accent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-zinc-400 font-semibold mb-1">Gêneros (Separados por vírgula)*</label>
                <input
                  type="text"
                  required
                  value={generos}
                  onChange={(e) => setGeneros(e.target.value)}
                  placeholder="Ficção, Ação, Aventura"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-cine-accent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-zinc-400 font-semibold mb-1">Sinopse da Obra*</label>
                <textarea
                  rows={3}
                  required
                  value={sinopse}
                  onChange={(e) => setSinopse(e.target.value)}
                  placeholder="Escreva a sinopse oficial aqui..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-cine-accent"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">URL da Imagem Banner (Backdrop 16:9)</label>
                <input
                  type="text"
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-cine-accent"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">URL da Imagem Pôster (Retrato 3:4)</label>
                <input
                  type="text"
                  value={poster}
                  onChange={(e) => setPoster(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-cine-accent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-zinc-400 font-semibold mb-1">URL do Trailer Oficial (YouTube)</label>
                <input
                  type="text"
                  value={trailerUrl}
                  onChange={(e) => setTrailerUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-cine-accent"
                />
              </div>

              <div className="flex items-center gap-2 md:col-span-2 py-2">
                <input
                  type="checkbox"
                  id="destacado"
                  checked={destacado}
                  onChange={(e) => setDestacado(e.target.checked)}
                  className="w-4 h-4 rounded text-cine-accent accent-cine-accent"
                />
                <label htmlFor="destacado" className="text-zinc-300 font-semibold cursor-pointer">Destacar obra no Banner principal da Home Page</label>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submittingObra}
                  className="w-full bg-gradient-to-r from-cine-accent-light to-cine-accent hover:from-cine-cream hover:to-cine-accent-light disabled:bg-zinc-800 text-black font-black py-2.5 rounded transition-all cursor-pointer shadow-lg shadow-cine-accent/10"
                >
                  {submittingObra ? 'Cadastrando...' : 'Cadastrar Obra'}
                </button>
              </div>

            </form>
          </div>

          {/* OBRAS CATALOG LIST */}
          <div className="bg-zinc-900/30 p-5 rounded-xl border border-zinc-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Film className="text-cine-accent-light w-5 h-5" />
              Obras Cadastradas ({obras.length})
            </h2>

            <div className="divide-y divide-zinc-800 max-h-96 overflow-y-auto">
              {obras.map(o => (
                <div key={o.id} className="py-3 flex items-center justify-between text-xs gap-4">
                  <div className="flex items-center gap-3">
                    <img src={o.poster} alt={o.titulo} className="w-8 h-10 object-cover rounded" />
                    <div>
                      <h4 className="font-bold text-white">{o.titulo}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500 font-mono">
                        <span className="uppercase text-cine-accent-light font-bold">{o.tipo}</span>
                        <span>{o.ano}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingObra({ ...o })}
                      className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                      title="Editar Obra"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectObra(o.id)}
                      className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-cine-accent-light"
                      title="Ver Página"
                    >
                      <Film className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteObra(o.id)}
                      className="p-1.5 rounded bg-red-950/20 border border-red-900/30 text-red-500 hover:bg-red-600 hover:text-white transition-colors"
                      title="Deletar Obra"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GERENCIAR CINEREACT RECOMENDA */}
          <div className="bg-zinc-900/30 p-5 rounded-xl border border-zinc-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Sparkles className="text-cine-accent-light w-5 h-5 animate-pulse" />
              CineReact Recomenda (Escolha dos Editores)
            </h2>
            <p className="text-xs text-zinc-400">
              Gerencie os vídeos recomendados pelos editores do CineReact. Você pode colar o link do vídeo diretamente ou pesquisar no catálogo.
            </p>

            {/* ADD RECOMMENDED VIDEO BY LINK */}
            <form onSubmit={handleRecommendByLink} className="space-y-2 p-3.5 bg-cine-accent/5 rounded-lg border border-cine-accent/20">
              <label className="block text-cine-accent-light font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Adicionar Destaque por Link do YouTube
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={recomendadoLink}
                  onChange={(e) => setRecomendadoLink(e.target.value)}
                  placeholder="Cole o link do vídeo (ex: https://www.youtube.com/watch?v=...)"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-xs outline-none focus:border-cine-accent text-white"
                />
                <button
                  type="submit"
                  disabled={submittingRecomendado || !recomendadoLink.trim()}
                  className="px-4 rounded bg-gradient-to-r from-cine-accent-light to-cine-accent hover:from-cine-cream hover:to-cine-accent-light text-black font-bold text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  {submittingRecomendado ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      Adicionar
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* SEARCH TO ADD NEW RECOMMENDED VIDEOS */}
            <div className="space-y-2">
              <label className="block text-zinc-400 font-semibold text-[11px]">Ou pesquise vídeos já cadastrados no catálogo</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={reactSearch}
                  onChange={(e) => setReactSearch(e.target.value)}
                  placeholder="Digite o título do vídeo..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-xs outline-none focus:border-cine-accent text-white"
                />
              </div>

              {/* SEARCH RESULTS */}
              {reactSearch.trim() !== '' && (
                <div className="bg-zinc-950 border border-zinc-850 rounded-lg divide-y divide-zinc-900 overflow-hidden max-h-60 overflow-y-auto shadow-xl">
                  {reacts.filter(r => 
                    r.titulo.toLowerCase().includes(reactSearch.toLowerCase()) || 
                    r.canalNome.toLowerCase().includes(reactSearch.toLowerCase())
                  ).slice(0, 5).map(r => (
                    <div key={r.id} className="p-2.5 flex items-center justify-between gap-3 text-xs hover:bg-zinc-900/30">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={r.thumbnailUrl} alt={r.titulo} className="w-12 h-8 object-cover rounded flex-shrink-0" />
                        <div className="min-w-0">
                          <h5 className="font-bold text-white truncate text-xs">{r.titulo}</h5>
                          <p className="text-[10px] text-zinc-500 truncate mt-0.5">{r.canalNome}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleRecomendado(r.id, !!r.isRecomendado)}
                        disabled={togglingId === r.id}
                        className={`flex-shrink-0 px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                          r.isRecomendado 
                            ? 'bg-cine-accent-dark/20 text-cine-accent-light border border-cine-accent/30 hover:bg-cine-accent-dark/40' 
                            : 'bg-cine-accent text-black hover:bg-cine-accent-light'
                        }`}
                      >
                        {r.isRecomendado ? 'Remover Destaque' : 'Adicionar Destaque'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CURRENT RECOMMENDED LIST */}
            <div className="space-y-2 pt-2">
              <label className="block text-zinc-400 font-bold text-[11px] uppercase tracking-wider">Recomendações Ativas</label>
              <div className="bg-zinc-950/60 rounded-xl border border-zinc-850 divide-y divide-zinc-900 max-h-60 overflow-y-auto">
                {reacts.filter(r => r.isRecomendado).map(r => (
                  <div key={r.id} className="p-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={r.thumbnailUrl} alt={r.titulo} className="w-12 h-8 object-cover rounded flex-shrink-0 border border-zinc-800" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-white truncate text-xs">{r.titulo}</h4>
                        <p className="text-[10px] text-zinc-500 truncate">{r.canalNome}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleRecomendado(r.id, true)}
                      className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-red-400 hover:text-red-300 hover:bg-zinc-850 cursor-pointer"
                      title="Remover Recomendação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {reacts.filter(r => r.isRecomendado).length === 0 && (
                  <div className="p-4 text-center text-zinc-600 italic text-xs">
                    Nenhum react recomendado no momento. Adicione acima!
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {!loading && activeTab === 'moderacao' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SIDEBAR LOGS & LISTS (COL 3) */}
        <div className="space-y-8">
          
          {/* USER MANAGEMENT (VIP STATUS ACTIVATOR) */}
          <div className="bg-zinc-900/30 p-5 rounded-xl border border-zinc-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Users className="text-cine-accent-light w-5 h-5" />
              Usuários Registrados ({usuarios.length})
            </h2>

            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Ative ou desative o status de Apoiador VIP de qualquer usuário cadastrado para que seu nome brilhe e exiba a insígnia na plataforma!
            </p>

            <div className="divide-y divide-zinc-800 max-h-[280px] overflow-y-auto pr-1">
              {usuarios.map(u => {
                const handleToggleVIP = async () => {
                  try {
                    const res = await adminFetch(user.email, `/api/usuarios/${encodeURIComponent(u.email)}/vip`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ isDonor: !u.isDonor }),
                    });
                    if (res.ok) {
                      fetchAdminData();
                      showMessage('success', u.isDonor ? 'VIP removido.' : 'VIP concedido!');
                    } else {
                      const err = await res.json();
                      showMessage('error', err.error || 'Erro ao atualizar VIP.');
                    }
                  } catch (e) {
                    console.error(e);
                  }
                };

                return (
                  <div key={u.email} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold ${u.isDonor ? 'bg-gradient-to-r from-cine-cream via-cine-cream to-cine-accent bg-clip-text text-transparent font-extrabold' : 'text-zinc-300'}`}>
                          {u.username}
                        </span>
                        {u.isAdmin && (
                          <span className="text-[8px] bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-1 rounded">ADMIN</span>
                        )}
                      </div>
                      <span className="text-[9px] text-zinc-600 font-mono block truncate">{u.email}</span>
                    </div>

                    <button
                      onClick={handleToggleVIP}
                      className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        u.isDonor 
                          ? 'bg-cine-accent/15 border border-cine-accent/20 text-cine-accent-light hover:bg-cine-accent/30' 
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {u.isDonor ? 'Remover VIP' : 'Dar VIP'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LATEST COMMENTS */}
          <div className="bg-zinc-900/30 p-5 rounded-xl border border-zinc-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-2">
              <MessageSquare className="text-cine-accent-light w-5 h-5" />
              Últimos Comentários ({comentarios.length})
            </h2>

            <div className="divide-y divide-zinc-800 max-h-[400px] overflow-y-auto pr-1 space-y-3">
              {comentarios.map(c => (
                <div key={c.id} className="pt-2 text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white truncate">{c.usuarioNome}</span>
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Deletar Comentário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed italic bg-zinc-950/40 p-2 rounded border border-zinc-850/60">
                    "{c.texto}"
                  </p>
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                    <span className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(st => (
                        <Star key={st} className={`w-2.5 h-2.5 ${st <= (c.nota || 5) ? 'fill-cine-accent-light text-cine-accent-light' : 'text-zinc-800'}`} />
                      ))}
                    </span>
                    <span>{new Date(c.criadoEm).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      )}

      <AnimatePresence>
        {editingObra && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white">Editar Obra</h3>
                <button onClick={() => setEditingObra(null)} className="p-2 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateObra} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-zinc-500 mb-1">ID (não editável)</label>
                  <input value={editingObra.id} disabled className="w-full bg-zinc-900/50 border border-zinc-800 rounded p-2 text-zinc-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Título</label>
                  <input value={editingObra.titulo} onChange={(e) => setEditingObra({ ...editingObra, titulo: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-cine-accent" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Tipo</label>
                  <select value={editingObra.tipo} onChange={(e) => setEditingObra({ ...editingObra, tipo: e.target.value as Obra['tipo'] })} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-cine-accent">
                    <option value="filme">Filme</option>
                    <option value="serie">Série</option>
                    <option value="anime">Anime</option>
                    <option value="jogo">Jogo</option>
                    <option value="canal">Canal</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-zinc-400 mb-1">Sinopse</label>
                  <textarea rows={3} value={editingObra.sinopse} onChange={(e) => setEditingObra({ ...editingObra, sinopse: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-cine-accent" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Ano</label>
                  <input type="number" value={editingObra.ano} onChange={(e) => setEditingObra({ ...editingObra, ano: Number(e.target.value) })} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-cine-accent" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Gêneros (vírgula)</label>
                  <input value={editingObra.generos?.join(', ') || ''} onChange={(e) => setEditingObra({ ...editingObra, generos: e.target.value.split(',').map(s => s.trim()) })} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-cine-accent" />
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="edit-destacado" checked={!!editingObra.destacado} onChange={(e) => setEditingObra({ ...editingObra, destacado: e.target.checked })} className="accent-cine-accent" />
                  <label htmlFor="edit-destacado" className="text-zinc-300">Destacar na Home</label>
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button type="button" onClick={() => setEditingObra(null)} className="flex-1 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold cursor-pointer">Cancelar</button>
                  <button type="submit" disabled={savingObra} className="flex-1 py-2.5 rounded-xl bg-cine-accent text-black font-black disabled:opacity-50 cursor-pointer">
                    {savingObra ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
