# Parecer Fácil - Gerador de Relatórios com IA

Aplicativo Full-Stack para professores de educação infantil gerarem pareceres descritivos a partir de áudios, utilizando IA (n8n + Gemini/Claude).

## 🚀 Tecnologias

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **AI Orchestration**: n8n (Webhook, Supabase Node, AI Nodes)

## 🛠️ Configuração

### 1. Supabase
1. Crie um projeto no [Supabase](https://supabase.com).
2. Execute o script SQL em `supabase/schema.sql` no SQL Editor do Supabase para criar as tabelas e políticas de segurança.
3. Execute também `supabase/add_paginas_esperadas.sql` e `supabase/add_transcricao.sql` para adicionar os novos campos.
4. Crie um bucket no Storage chamado `audios` e defina como público.
5. Habilite Email Auth em Authentication > Providers.

### 2. n8n
1. Importe o arquivo `n8n/workflow.json` no seu n8n.
2. Configure as credenciais do Supabase e do Google Gemini nos nós correspondentes.
3. Ative o workflow e copie a URL do Webhook de Produção.

### 3. Variáveis de Ambiente
Renomeie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=sua-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
NEXT_PUBLIC_N8N_WEBHOOK_URL=sua-url-webhook-n8n
```

### 4. Rodando Localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## 📱 Funcionalidades

- **Autenticação**: Login e cadastro com email/senha.
- **Dashboard**: Lista de pareceres com status em tempo real e opção de exclusão.
- **Novo Parecer**: Gravação de áudio no navegador (até 10 min) ou upload de arquivo.
- **Perfil**: Personalização do estilo de escrita, nome, email e número de páginas esperado.
- **Visualização**: Página de detalhes com áudio original e texto gerado.
- **Integração n8n**: Processamento assíncrono com Google Gemini.
