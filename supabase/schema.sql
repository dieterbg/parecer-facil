-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: professores
create table public.professores (
  id uuid not null default uuid_generate_v4(),
  uid uuid not null references auth.users(id),
  nome text,
  email text,
  estilo_escrita text, -- Long text for writing style example
  paginas_esperadas integer default 1, -- Expected number of pages for reports
  created_at timestamptz default now(),
  primary key (id),
  unique(uid)
);

-- Table: pareceres
create table public.pareceres (
  id uuid not null default uuid_generate_v4(),
  professor_id uuid references public.professores(id),
  uid_professor uuid references auth.users(id),
  aluno_nome text not null,
  aluno_idade text,
  audio_url text,
  status text default 'pendente', -- pendente, processando, concluído, erro
  resultado_texto text,
  created_at timestamptz default now(),
  primary key (id)
);

-- RLS Policies
alter table public.professores enable row level security;
alter table public.pareceres enable row level security;

-- Policy for professores: Users can only see/edit their own profile
create policy "Users can view own profile" on public.professores
  for select using (auth.uid() = uid);

create policy "Users can update own profile" on public.professores
  for update using (auth.uid() = uid);

create policy "Users can insert own profile" on public.professores
  for insert with check (auth.uid() = uid);

-- Policy for pareceres: Users can only see/edit their own reports
create policy "Users can view own reports" on public.pareceres
  for select using (auth.uid() = uid_professor);

create policy "Users can insert own reports" on public.pareceres
  for insert with check (auth.uid() = uid_professor);

create policy "Users can update own reports" on public.pareceres
  for update using (auth.uid() = uid_professor);

create policy "Users can delete own reports" on public.pareceres
  for delete using (auth.uid() = uid_professor);


-- Function to handle new user signup (optional, but good for syncing)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.professores (uid, email, nome)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
