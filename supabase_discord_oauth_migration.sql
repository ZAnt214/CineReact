-- Campos de login Discord + aceite de termos (usuarios)
-- Execute no SQL Editor do Supabase.

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS "oauthProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "discordId" TEXT,
  ADD COLUMN IF NOT EXISTS "discordUsername" TEXT,
  ADD COLUMN IF NOT EXISTS "providerEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TEXT;
