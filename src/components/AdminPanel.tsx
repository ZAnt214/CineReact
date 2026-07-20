import React, { useState, useEffect } from 'react';
import { Settings, Plus, Film, Trash2, Check, Edit3, Youtube, AlertCircle, RefreshCw, MessageSquare, Users, Star, Sparkles, Award, Database, Server, Copy, ChevronDown, ChevronUp, CheckCircle2, ArrowRight } from 'lucide-react';
import { Obra, ReactVideo, Comentario, UserState } from '../types.ts';
import { motion } from 'motion/react';

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
      const res = await fetch('/api/supabase/sync', { method: 'POST' });
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
      const res = await fetch('/api/supabase/migrate', { method: 'POST' });
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

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [obrasRes, commentsRes, usersRes, reactsRes] = await Promise.all([
        fetch('/api/obras'),
        fetch('/api/comentarios'),
        fetch('/api/usuarios'),
        fetch('/api/reacts')
      ]);

      if (obrasRes.ok) {
        const data = await obrasRes.json();
        setObras(data);
      }

      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComentarios(data);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsuarios(data);
      }

      if (reactsRes.ok) {
        const data = await reactsRes.json();
        setReacts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.isAdmin) {
      fetchAdminData();
      fetchSupabaseStatus();
    }
  }, [user]);

  const handleCreateObra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraId.trim() || !titulo.trim()) {
      alert('ID e Título são obrigatórios.');
      return;
    }

    setSubmittingObra(true);
    try {
      const res = await fetch('/api/obras', {
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
        alert('Obra cadastrada com sucesso!');
      } else {
        const err = await res.json();
        alert(`Erro: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingObra(false);
    }
  };

  const handleDeleteObra = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta obra? Todos os reacts e comentários associados serão deletados.')) return;
    try {
      const res = await fetch(`/api/obras/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Deseja deletar este comentário?')) return;
    try {
      const res = await fetch(`/api/comentarios/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleIntelligentImport = async () => {
    if (!importQuery.trim()) return;
    setImporting(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(importQuery)}`);
      if (res.ok) {
        fetchAdminData();
        setImportQuery('');
        alert('Obra e reacts descobertos inteligentemente pelo Gemini AI e adicionados ao catálogo!');
      } else {
        alert('Erro ao descobrir conteúdo.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setImporting(false);
    }
  };

  const handleImportCanal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canalUrl.trim()) return;
    setImportingCanal(true);
    try {
      const res = await fetch('/api/canais/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: canalUrl, email: user.email })
      });
      if (res.ok) {
        const data = await res.json();
        setCanalUrl('');
        fetchAdminData();
        if (data.mode === 'real') {
          alert(`Canal "${data.obra.titulo}" importado e sincronizado com sucesso do YouTube!`);
        } else if (data.mode === 'simulated') {
          alert(`Canal "${data.obra.titulo}" criado com sucesso usando simulação inteligente do Gemini AI!`);
        } else {
          alert(`Canal "${data.obra.titulo}" criado com sucesso.`);
        }
      } else {
        const err = await res.json();
        alert(`Erro: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao tentar importar o canal.');
    } finally {
      setImportingCanal(false);
    }
  };

  const handleToggleRecomendado = async (reactId: string, currentStatus: boolean) => {
    setTogglingId(reactId);
    try {
      const res = await fetch(`/api/reacts/${reactId}/recomendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recomendado: !currentStatus })
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
      const res = await fetch('/api/reacts/recomendar-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: recomendadoLink })
      });

      if (res.ok) {
        const data = await res.json();
        setRecomendadoLink('');
        fetchAdminData();
        alert(`Sucesso! O vídeo "${data.titulo}" foi adicionado com sucesso e destacado na categoria "CineReact Recomenda".`);
      } else {
        const err = await res.json();
        alert(`Erro: ${err.error || 'Não foi possível adicionar o vídeo recomendado.'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao tentar adicionar a recomendação.');
    } finally {
      setSubmittingRecomendado(false);
    }
  };

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto text-center flex flex-col items-center justify-center">
        <AlertCircle className="w-16 h-16 text-teal-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
        <p className="text-zinc-500 max-w-md text-xs leading-relaxed">
          Este painel administrativo é restrito para administradores credenciados do CineReact.
          Se você possui privilégios de administrador, faça login com a conta correta no menu superior.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d10] pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto space-y-12 text-white">
      
      {/* HEADER */}
      <div className="border-b border-zinc-800 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            <Settings className="text-teal-500 w-8 h-8" />
            Painel do Administrador
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Cadastre, edite e organize o acervo de reacts do CineReact</p>
        </div>
        
        <button 
          onClick={fetchAdminData}
          className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* SUPABASE STATUS & CONFIGURATION */}
      <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 text-teal-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white uppercase tracking-wider">Integração Supabase</h2>
                {loadingSupabaseStatus ? (
                  <span className="w-3 h-3 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
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
                  className="px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-teal-500/30 text-teal-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {syncingSupabase ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                  Importar do Supabase
                </button>
                
                <button
                  onClick={handleMigrateSupabase}
                  disabled={syncingSupabase || migratingSupabase}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-teal-950/25"
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
              <Sparkles className="w-4 h-4 text-rose-500" />
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
                <p className="text-[10px] text-rose-400/80">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CADASTRO FORM (COL 1 & 2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* GEMINI INTELLIGENT DISCOVERY (EASY CADASTRO!) */}
          <div className="bg-zinc-900/30 backdrop-blur-md p-5 rounded-xl border border-teal-500/20 space-y-4 shadow-lg">
            <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              Descoberta e Cadastro Inteligente (Gemini AI)
            </h2>
            <p className="text-xs text-zinc-400">
              Digite o nome de qualquer filme, série, anime ou jogo do mundo (ex: "Matrix", "Attack on Titan", "Minecraft"). 
              O Gemini AI irá buscar as informações reais, sinopse, trailer, gêneros, posters, e catalogará automaticamente o conteúdo com reacts simulados em segundos!
            </p>

            <div className="flex gap-2 text-xs">
              <input
                type="text"
                value={importQuery}
                onChange={(e) => setImportQuery(e.target.value)}
                placeholder="ex: Inception, Deadpool 3, Elden Ring, Naruto..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2.5 outline-none focus:border-teal-600"
              />
              <button
                onClick={handleIntelligentImport}
                disabled={importing || !importQuery.trim()}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-zinc-800 disabled:text-zinc-500 font-bold px-4 py-2.5 rounded transition-all cursor-pointer"
              >
                {importing ? "Analisando..." : "Cadastrar com AI"}
              </button>
            </div>
          </div>

          {/* IMPORTAR CANAL DO YOUTUBE */}
          <div className="bg-zinc-900/30 backdrop-blur-md p-5 rounded-xl border border-teal-500/20 space-y-4 shadow-lg">
            <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
              <Youtube className="w-4 h-4 text-teal-500" />
              Importar Canal do YouTube (Criar Categoria)
            </h2>
            <p className="text-xs text-zinc-400">
              Cole o link de um canal do YouTube ou digite o handle (ex: <span className="text-teal-400 font-mono font-bold">@casimiro</span>). O sistema irá obter os dados do canal, cadastrá-lo como uma nova categoria e buscar todos os seus reacts automaticamente!
            </p>

            <form onSubmit={handleImportCanal} className="flex gap-2 text-xs">
              <input
                type="text"
                value={canalUrl}
                onChange={(e) => setCanalUrl(e.target.value)}
                placeholder="ex: @casimiro, @alanzoka, ou link do canal..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2.5 outline-none focus:border-teal-600"
              />
              <button
                type="submit"
                disabled={importingCanal || !canalUrl.trim()}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-zinc-800 disabled:text-zinc-500 font-bold px-4 py-2.5 rounded transition-all cursor-pointer flex items-center gap-1.5"
              >
                {importingCanal ? "Importando..." : "Importar Canal"}
              </button>
            </form>
          </div>

          {/* MANUAL CADASTRO */}
          <div className="bg-zinc-900/30 p-5 rounded-xl border border-zinc-800 space-y-4 shadow-md">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Plus className="text-teal-500 w-5 h-5" />
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
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-teal-600"
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
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Tipo de Conteúdo*</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-teal-600"
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
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-teal-600"
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
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-teal-600"
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
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">URL da Imagem Banner (Backdrop 16:9)</label>
                <input
                  type="text"
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">URL da Imagem Pôster (Retrato 3:4)</label>
                <input
                  type="text"
                  value={poster}
                  onChange={(e) => setPoster(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-teal-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-zinc-400 font-semibold mb-1">URL do Trailer Oficial (YouTube)</label>
                <input
                  type="text"
                  value={trailerUrl}
                  onChange={(e) => setTrailerUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex items-center gap-2 md:col-span-2 py-2">
                <input
                  type="checkbox"
                  id="destacado"
                  checked={destacado}
                  onChange={(e) => setDestacado(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 accent-teal-600"
                />
                <label htmlFor="destacado" className="text-zinc-300 font-semibold cursor-pointer">Destacar obra no Banner principal da Home Page</label>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submittingObra}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-zinc-800 text-white font-bold py-2.5 rounded transition-all cursor-pointer"
                >
                  {submittingObra ? 'Cadastrando...' : 'Cadastrar Obra'}
                </button>
              </div>

            </form>
          </div>

          {/* OBRAS CATALOG LIST */}
          <div className="bg-zinc-900/30 p-5 rounded-xl border border-zinc-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Film className="text-teal-500 w-5 h-5" />
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
                        <span className="uppercase text-teal-400 font-bold">{o.tipo}</span>
                        <span>{o.ano}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectObra(o.id)}
                      className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                      title="Ver Página"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteObra(o.id)}
                      className="p-1.5 rounded bg-rose-950/20 border border-rose-900/30 text-rose-500 hover:bg-rose-600 hover:text-white transition-colors"
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
              <Sparkles className="text-rose-500 w-5 h-5 animate-pulse" />
              CineReact Recomenda (Escolha dos Editores)
            </h2>
            <p className="text-xs text-zinc-400">
              Gerencie os vídeos recomendados pelos editores do CineReact. Você pode colar o link do vídeo diretamente ou pesquisar no catálogo.
            </p>

            {/* ADD RECOMMENDED VIDEO BY LINK */}
            <form onSubmit={handleRecommendByLink} className="space-y-2 p-3.5 bg-rose-500/5 rounded-lg border border-rose-500/20">
              <label className="block text-rose-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Adicionar Destaque por Link do YouTube
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={recomendadoLink}
                  onChange={(e) => setRecomendadoLink(e.target.value)}
                  placeholder="Cole o link do vídeo (ex: https://www.youtube.com/watch?v=...)"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-xs outline-none focus:border-rose-500 text-white"
                />
                <button
                  type="submit"
                  disabled={submittingRecomendado || !recomendadoLink.trim()}
                  className="px-4 rounded bg-rose-500 text-black font-bold text-xs hover:bg-rose-400 transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
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
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-xs outline-none focus:border-teal-600 text-white"
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
                            ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/40' 
                            : 'bg-teal-600 text-white hover:bg-teal-700'
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
                      className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-rose-400 hover:text-rose-300 hover:bg-zinc-850"
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

        {/* SIDEBAR LOGS & LISTS (COL 3) */}
        <div className="space-y-8">
          
          {/* USER MANAGEMENT (VIP STATUS ACTIVATOR) */}
          <div className="bg-zinc-900/30 p-5 rounded-xl border border-zinc-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Users className="text-teal-500 w-5 h-5" />
              Usuários Registrados ({usuarios.length})
            </h2>

            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Ative ou desative o status de Apoiador VIP de qualquer usuário cadastrado para que seu nome brilhe e exiba a insígnia na plataforma!
            </p>

            <div className="divide-y divide-zinc-800 max-h-[280px] overflow-y-auto pr-1">
              {usuarios.map(u => {
                const handleToggleVIP = async () => {
                  try {
                    const res = await fetch(`/api/usuarios/${u.email}/vip`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ isDonor: !u.isDonor })
                    });
                    if (res.ok) {
                      fetchAdminData();
                    }
                  } catch (e) {
                    console.error(e);
                  }
                };

                return (
                  <div key={u.email} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold ${u.isDonor ? 'bg-gradient-to-r from-teal-400 via-pink-400 to-rose-400 bg-clip-text text-transparent font-extrabold' : 'text-zinc-300'}`}>
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
                          ? 'bg-rose-500/15 border border-rose-500/20 text-rose-400 hover:bg-rose-500/30' 
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
              <MessageSquare className="text-teal-500 w-5 h-5" />
              Últimos Comentários ({comentarios.length})
            </h2>

            <div className="divide-y divide-zinc-800 max-h-[400px] overflow-y-auto pr-1 space-y-3">
              {comentarios.map(c => (
                <div key={c.id} className="pt-2 text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white truncate">{c.usuarioNome}</span>
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-zinc-500 hover:text-rose-400 transition-colors"
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
                        <Star key={st} className={`w-2.5 h-2.5 ${st <= (c.nota || 5) ? 'fill-amber-400 text-amber-400' : 'text-zinc-800'}`} />
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
    </div>
  );
}
