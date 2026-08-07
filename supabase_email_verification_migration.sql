-- Migração: campos de verificação de e-mail (Supabase Auth)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT true;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "supabaseAuthId" TEXT;
