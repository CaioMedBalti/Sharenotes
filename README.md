# Notas

Site pessoal para colar recados/textos e recuperá-los depois em outra máquina (ex: levar informação do PC de casa para o PC do trabalho, e vice-versa). Vários "quadros" (categorias) com uma lista de mensagens copiáveis cada um.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres + Auth), deploy na Vercel.

## Deploy do zero

### 1. Projeto Supabase

1. Crie (ou reaproveite) um projeto em [supabase.com](https://supabase.com).
2. Vá em **SQL Editor** e rode o conteúdo de [`supabase-setup.sql`](./supabase-setup.sql) — cria as tabelas `boards`/`messages` e as políticas de Row Level Security.
3. Em **Authentication → Providers**, confirme que **Email** está habilitado (vem habilitado por padrão).
4. Em **Authentication → Settings**, desabilite **"Allow new users to sign up"** — este app não tem cadastro público, só o login.
5. Em **Authentication → Users → Add user**, crie o único usuário: seu email + uma senha, marcando **"Auto Confirm User"**.
6. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.

### 2. Configuração local

```bash
cp .env.local.example .env.local
```

Preencha `.env.local` com a URL e a anon key copiadas no passo anterior.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`, faça login com o usuário criado no Supabase e confirme que os quadros **Trabalho**, **Pessoal** e **Links** aparecem automaticamente na primeira vez.

### 3. Deploy na Vercel

1. Suba este repositório para o GitHub (ou rode `vercel` direto pela CLI sem GitHub).
2. Importe o projeto na [Vercel](https://vercel.com/new) — o framework Next.js é detectado automaticamente, sem configuração extra.
3. Em **Project Settings → Environment Variables**, adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production, Preview e Development).
4. Faça o deploy e anote a URL `*.vercel.app`.

## Verificação

- Abrir a URL em uma aba anônima deve redirecionar para `/login`.
- Logar deve carregar os quadros padrão.
- Colar um texto multi-linha, enviar, e conferir que as quebras de linha e o auto-scroll funcionam.
- **Copiar** deve colocar o texto exato na área de transferência.
- **Apagar** pede uma confirmação (clique duas vezes) antes de remover.
- Recarregar a página deve manter tudo — os dados vivem no Supabase, não em memória local.
- Abrir a mesma URL em outro navegador/computador e logar deve mostrar os mesmos quadros e mensagens — esse é o objetivo do site.
- **Sair** deve redirecionar para `/login` e bloquear o acesso à página protegida sem sessão.
