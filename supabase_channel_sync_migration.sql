-- Campos extras para sync de reacts (importação de canais YouTube)
-- Execute no SQL Editor do Supabase se a tabela reacts já existe.

ALTER TABLE reacts ADD COLUMN IF NOT EXISTS "publicadoEm" TEXT;
ALTER TABLE reacts ADD COLUMN IF NOT EXISTS "canalId" TEXT;
