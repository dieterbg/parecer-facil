-- ==============================================================================
-- MIGRAÇÃO V2 - PARECER FÁCIL: PLATAFORMA DE DOCUMENTAÇÃO PEDAGÓGICA
-- ==============================================================================

-- 1. Tabela de TURMAS
create table if not exists public.turmas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  nome text not null,
  ano_letivo text not null,
  escola text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de ALUNOS
create table if not exists public.alunos (
  id uuid default gen_random_uuid() primary key,
  turma_id uuid references public.turmas on delete cascade not null,
  nome text not null,
  data_nascimento date,
  observacoes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de REGISTROS
create table if not exists public.registros (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  tipo text check (tipo in ('foto', 'video', 'audio', 'texto')) not null,
  url_arquivo text,
  descricao text,
  transcricao_ia text,
  data_registro timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabela de Ligação REGISTROS <-> ALUNOS
create table if not exists public.registros_alunos (
  registro_id uuid references public.registros on delete cascade not null,
  aluno_id uuid references public.alunos on delete cascade not null,
  primary key (registro_id, aluno_id)
);

-- ==============================================================================
-- SEGURANÇA (Row Level Security)
-- ==============================================================================

alter table public.turmas enable row level security;
alter table public.alunos enable row level security;
alter table public.registros enable row level security;
alter table public.registros_alunos enable row level security;

-- Políticas para TURMAS
create policy "Professores veem suas próprias turmas" on public.turmas for select using (auth.uid() = user_id);
create policy "Professores criam suas próprias turmas" on public.turmas for insert with check (auth.uid() = user_id);
create policy "Professores editam suas próprias turmas" on public.turmas for update using (auth.uid() = user_id);
create policy "Professores deletam suas próprias turmas" on public.turmas for delete using (auth.uid() = user_id);

-- Políticas para ALUNOS
create policy "Professores veem alunos de suas turmas" on public.alunos for select using (
  exists (select 1 from public.turmas where id = alunos.turma_id and user_id = auth.uid())
);
create policy "Professores criam alunos em suas turmas" on public.alunos for insert with check (
  exists (select 1 from public.turmas where id = turma_id and user_id = auth.uid())
);
create policy "Professores editam alunos de suas turmas" on public.alunos for update using (
  exists (select 1 from public.turmas where id = turma_id and user_id = auth.uid())
);
create policy "Professores deletam alunos de suas turmas" on public.alunos for delete using (
  exists (select 1 from public.turmas where id = turma_id and user_id = auth.uid())
);

-- Políticas para REGISTROS
create policy "Professores veem seus próprios registros" on public.registros for select using (auth.uid() = user_id);
create policy "Professores criam seus próprios registros" on public.registros for insert with check (auth.uid() = user_id);
create policy "Professores editam seus próprios registros" on public.registros for update using (auth.uid() = user_id);
create policy "Professores deletam seus próprios registros" on public.registros for delete using (auth.uid() = user_id);

-- Políticas para REGISTROS_ALUNOS
create policy "Professores veem vínculos de seus registros" on public.registros_alunos for select using (
  exists (select 1 from public.registros where id = registro_id and user_id = auth.uid())
);
create policy "Professores criam vínculos para seus registros" on public.registros_alunos for insert with check (
  exists (select 1 from public.registros where id = registro_id and user_id = auth.uid())
);
create policy "Professores deletam vínculos de seus registros" on public.registros_alunos for delete using (
  exists (select 1 from public.registros where id = registro_id and user_id = auth.uid())
);

-- ==============================================================================
-- NOTA: A migração automática de dados foi removida para evitar erros.
-- Os dados antigos permanecerão na tabela 'pareceres' e você poderá
-- cadastrar os alunos manualmente na nova estrutura.
-- ==============================================================================
