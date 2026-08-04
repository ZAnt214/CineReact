-- Migração incremental: persistência dos CineClips
-- Execute no SQL Editor do Supabase se o projeto já existia antes desta atualização.

CREATE TABLE IF NOT EXISTS cineclips_payload (
  id TEXT PRIMARY KEY DEFAULT 'main',
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cineclips_payload ENABLE ROW LEVEL SECURITY;
