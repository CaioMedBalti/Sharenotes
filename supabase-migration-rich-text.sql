-- Rode este script no Supabase (SQL Editor > New query > Run) para habilitar
-- formatação rica (negrito, itálico, listas, links) nas mensagens.

alter table public.messages add column if not exists content_html text;
