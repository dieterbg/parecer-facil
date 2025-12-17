-- ==============================================================================
-- CONFIGURAÇÃO DO SUPABASE STORAGE PARA REGISTROS
-- ==============================================================================

-- Criar bucket 'registros' (público para facilitar acesso às URLs)
insert into storage.buckets (id, name, public)
values ('registros', 'registros', true)
on conflict (id) do nothing;

-- Política: Professores podem fazer upload de arquivos
create policy "Professores podem fazer upload de registros"
on storage.objects for insert
with check (
  bucket_id = 'registros' 
  and auth.role() = 'authenticated'
);

-- Política: Professores podem ver seus próprios arquivos
create policy "Professores podem ver seus registros"
on storage.objects for select
using (
  bucket_id = 'registros'
  and auth.role() = 'authenticated'
);

-- Política: Professores podem deletar seus próprios arquivos
create policy "Professores podem deletar seus registros"
on storage.objects for delete
using (
  bucket_id = 'registros'
  and auth.role() = 'authenticated'
);
