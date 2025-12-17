-- ==============================================================================
-- CORREÇÃO: Políticas RLS para permitir INSERT com auth.uid()
-- ==============================================================================

-- Remover políticas antigas se existirem
drop policy if exists "Professores criam suas próprias turmas" on public.turmas;

-- Recriar política de INSERT corretamente
create policy "Professores criam suas próprias turmas" 
on public.turmas 
for insert 
with check (auth.uid() = user_id);

-- Verificar se a política de SELECT está correta
drop policy if exists "Professores veem suas próprias turmas" on public.turmas;

create policy "Professores veem suas próprias turmas" 
on public.turmas 
for select 
using (auth.uid() = user_id);
