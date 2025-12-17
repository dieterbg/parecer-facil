-- ============================================
-- MIGRAÇÃO 008: Flag de Evidência em Registros
-- Data: 2024-12
-- Descrição: Adiciona flag para marcar registro como evidência de desenvolvimento
-- ============================================

ALTER TABLE public.registros 
ADD COLUMN IF NOT EXISTS is_evidencia BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.registros.is_evidencia IS 
'Indica se este registro foi marcado como uma evidência significativa de desenvolvimento do aluno.';
