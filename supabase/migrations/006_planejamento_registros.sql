-- ============================================
-- MIGRAÇÃO 006: Conexão Planejamento ↔ Registros
-- Data: 2024-12
-- Descrição: Melhorar vínculo entre atividades planejadas e registros
-- ============================================

-- Adicionar coluna para múltiplos registros (array) na atividade planejada
-- Já existe registro_id único, vamos adicionar registros_ids para múltiplos
ALTER TABLE public.atividades_planejadas 
ADD COLUMN IF NOT EXISTS registros_ids UUID[] DEFAULT '{}';

-- Adicionar coluna para vincular registro a atividade planejada
ALTER TABLE public.registros 
ADD COLUMN IF NOT EXISTS atividade_planejada_id UUID REFERENCES public.atividades_planejadas(id) ON DELETE SET NULL;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_registros_atividade_planejada 
ON public.registros(atividade_planejada_id);

-- Comentário explicativo
COMMENT ON COLUMN public.atividades_planejadas.registros_ids IS 
'Array de IDs de registros vinculados a esta atividade planejada. Permite múltiplas evidências por atividade.';

COMMENT ON COLUMN public.registros.atividade_planejada_id IS 
'Referência à atividade planejada que originou este registro. Permite rastrear de onde veio o registro.';
