-- CINE REACT - SUPABASE DATABASE SCHEMA
-- Cole este script no Editor SQL (SQL Editor) do seu painel do Supabase
-- IMPORTANTE: Este script limpa as tabelas antigas para evitar erros de RLS e colunas ausentes.

DROP TABLE IF EXISTS notificacoes CASCADE;
DROP TABLE IF EXISTS listas CASCADE;
DROP TABLE IF EXISTS canais_seguidos CASCADE;
DROP TABLE IF EXISTS favoritos CASCADE;
DROP TABLE IF EXISTS comentarios CASCADE;
DROP TABLE IF EXISTS reacts CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS obras CASCADE;

-- 1. Tabela de Obras/Canais
CREATE TABLE IF NOT EXISTS obras (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'filme', 'serie', 'anime', 'jogo', 'canal'
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

-- 2. Tabela de Reacts (Vídeos de react)
CREATE TABLE IF NOT EXISTS reacts (
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

-- 3. Tabela de Comentários
CREATE TABLE IF NOT EXISTS comentarios (
  id TEXT PRIMARY KEY,
  "obraId" TEXT REFERENCES obras(id) ON DELETE CASCADE,
  "usuarioNome" TEXT NOT NULL,
  "usuarioEmail" TEXT NOT NULL,
  texto TEXT NOT NULL,
  nota INTEGER DEFAULT 5,
  "criadoEm" TEXT NOT NULL
);

-- 4. Tabela de Favoritos
CREATE TABLE IF NOT EXISTS favoritos (
  id BIGSERIAL PRIMARY KEY,
  "usuarioEmail" TEXT NOT NULL,
  "obraId" TEXT REFERENCES obras(id) ON DELETE CASCADE,
  UNIQUE("usuarioEmail", "obraId")
);

-- 5. Tabela de Canais Seguidos
CREATE TABLE IF NOT EXISTS canais_seguidos (
  id BIGSERIAL PRIMARY KEY,
  "usuarioEmail" TEXT NOT NULL,
  "canalNome" TEXT NOT NULL,
  UNIQUE("usuarioEmail", "canalNome")
);

-- 6. Tabela de Listas Personalizadas
CREATE TABLE IF NOT EXISTS listas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  "usuarioEmail" TEXT NOT NULL,
  "obraIds" TEXT[] DEFAULT '{}'
);

-- 7. Tabela de Notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  "criadoEm" TEXT NOT NULL,
  "canalNome" TEXT,
  "usuarioEmail" TEXT
);

-- 8. Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
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

-- Habilitar acesso público / Desativar RLS temporariamente para facilitar a integração simples
ALTER TABLE obras DISABLE ROW LEVEL SECURITY;
ALTER TABLE reacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE favoritos DISABLE ROW LEVEL SECURITY;
ALTER TABLE canais_seguidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE listas DISABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
