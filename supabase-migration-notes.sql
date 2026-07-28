-- Rode este script no Supabase (SQL Editor > New query > Run) para habilitar
-- edição/autosave das entradas e o aviso de quadros parados.

alter table public.messages add column if not exists updated_at timestamptz not null default now();

drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own" on public.messages for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Atividade por quadro sem carregar as mensagens (usado pro aviso de
-- "quadro parado"). security_invoker é obrigatório: sem ele a view roda
-- como o dono da view e ignora o RLS de messages/boards.
create or replace view public.board_activity
  with (security_invoker = on) as
  select b.id as board_id,
         coalesce(max(m.created_at), b.created_at) as last_activity_at,
         count(m.id) as message_count
  from public.boards b
  left join public.messages m on m.board_id = b.id
  group by b.id, b.created_at;
