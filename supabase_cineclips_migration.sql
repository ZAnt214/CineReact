-- CINE REACT - Migração incremental: persistência dos CineClips
-- Execute no SQL Editor do Supabase (NÃO use supabase_schema.sql se já tem dados — ele apaga tabelas).
--
-- Depois, no Railway → Variables:
--   SUPABASE_SERVICE_ROLE_KEY = (Supabase → Settings → API → service_role secret)

CREATE TABLE IF NOT EXISTS cineclips_payload (
  id TEXT PRIMARY KEY DEFAULT 'main',
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cineclips_payload ENABLE ROW LEVEL SECURITY;
