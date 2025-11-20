-- Adiciona coluna paginas_esperadas na tabela professores
ALTER TABLE public.professores 
ADD COLUMN IF NOT EXISTS paginas_esperadas integer DEFAULT 1;
