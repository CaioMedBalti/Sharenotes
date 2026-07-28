-- Rode este script no Supabase: SQL Editor > New query > Run
-- (setup completo do zero — se seu banco já existe, use supabase-migration-attachments.sql)

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references auth.users(id) default auth.uid(),
  content text,
  content_html text,
  file_path text,
  file_name text,
  file_size bigint,
  file_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index messages_board_created_idx on public.messages (board_id, created_at);
create index boards_user_position_idx on public.boards (user_id, position);

alter table public.boards enable row level security;
alter table public.messages enable row level security;

create policy "boards_select_own" on public.boards for select using (auth.uid() = user_id);
create policy "boards_insert_own" on public.boards for insert with check (auth.uid() = user_id);
create policy "boards_update_own" on public.boards for update using (auth.uid() = user_id);
create policy "boards_delete_own" on public.boards for delete using (auth.uid() = user_id);

create policy "messages_select_own" on public.messages for select using (auth.uid() = user_id);
create policy "messages_insert_own" on public.messages for insert with check (auth.uid() = user_id);
create policy "messages_update_own" on public.messages for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "messages_delete_own" on public.messages for delete using (auth.uid() = user_id);

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

-- Bucket de armazenamento para os arquivos anexados
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 52428800);

create policy "attachments_select_own" on storage.objects for select
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "attachments_insert_own" on storage.objects for insert
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "attachments_delete_own" on storage.objects for delete
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
