-- CINE REACT - Habilitar Row Level Security (RLS)
-- Execute no SQL Editor do Supabase para corrigir os avisos do linter de segurança.
--
-- IMPORTANTE: Após executar este script, configure SUPABASE_SERVICE_ROLE_KEY no Railway
-- (Settings → API → service_role secret). O servidor usa essa chave para sincronizar dados.
-- A anon key pública NÃO terá mais acesso às tabelas (comportamento seguro).

ALTER TABLE IF EXISTS obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS canais_seguidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS listas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cineclips_payload ENABLE ROW LEVEL SECURITY;

-- Sem políticas permissivas, anon/authenticated não conseguem ler nem escrever.
-- A service_role key (usada apenas no servidor) ignora RLS automaticamente.
