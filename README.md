# FLIPIT

Web app para troca de produtos com swipe (estilo Tinder) e chat em tempo real.

Stack:
- React + Vite
- Supabase (Auth + Postgres + Realtime + Storage)
- Tailwind CSS

## Setup do Supabase

1) Crie um projeto no Supabase

2) Auth
- Authentication → Settings → Email confirmations → Off

3) Banco + RLS
- Abra o SQL Editor e rode o script: `supabase/schema.sql`

4) Storage
- Crie um bucket chamado `products`
- Se você quiser URLs públicas de imagem, deixe o bucket como Public

5) Realtime
- Garanta que o Realtime esteja habilitado para a tabela `messages`
  - Se você rodou o SQL, o comando `alter publication supabase_realtime add table public.messages;` já faz isso

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz, baseado em `.env.example`:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Use a chave pública (anon/publishable) no frontend. Não use a chave secret/service_role no navegador.

## Rodar o app

```bash
npm install
npm run dev
```

## Fluxo principal

- `/` Landing
- `/auth` Login/Cadastro (e-mail/senha)
- `/dashboard` Seus produtos (listar + ativar/desativar + sair)
- `/produto/novo` Criar produto + upload da imagem
- `/swipe` Selecionar seu produto ativo + like/pass em produtos ativos de outras pessoas
- `/matches` Lista de matches com preview e badge de não lidas
- `/chat/:matchId` Chat em tempo real via Realtime (messages)
