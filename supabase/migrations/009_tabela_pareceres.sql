-- ============================================
-- MIGRAÇÃO 009: Tabela de Pareceres (Híbrida)
-- Data: 2024-12
-- Descrição: Cria/Atualiza tabela de pareceres suportando lógica antiga e nova
-- ============================================

-- Tentar criar a tabela se não existir
CREATE TABLE IF NOT EXISTS public.pareceres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas novas e garantir existência das antigas (Legacy + New)
DO $$
BEGIN
    -- Campos de Integração (Novos)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pareceres' AND column_name = 'aluno_id') THEN
        ALTER TABLE public.pareceres ADD COLUMN aluno_id UUID REFERENCES public.alunos(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pareceres' AND column_name = 'turma_id') THEN
        ALTER TABLE public.pareceres ADD COLUMN turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL;
    END IF;

    -- Campos Legados (Manter compatibilidade)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pareceres' AND column_name = 'aluno_nome') THEN
        ALTER TABLE public.pareceres ADD COLUMN aluno_nome VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pareceres' AND column_name = 'aluno_idade') THEN
        ALTER TABLE public.pareceres ADD COLUMN aluno_idade VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pareceres' AND column_name = 'uid_professor') THEN
        ALTER TABLE public.pareceres ADD COLUMN uid_professor UUID REFERENCES auth.users(id);
    END IF;

    -- Campos de Conteúdo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pareceres' AND column_name = 'audio_url') THEN
        ALTER TABLE public.pareceres ADD COLUMN audio_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pareceres' AND column_name = 'resultado_texto') THEN
        ALTER TABLE public.pareceres ADD COLUMN resultado_texto TEXT; -- Texto gerado pela IA (Legacy name)
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pareceres' AND column_name = 'conteudo_editado') THEN
        ALTER TABLE public.pareceres ADD COLUMN conteudo_editado TEXT; -- Texto final editado (Novo)
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pareceres' AND column_name = 'status') THEN
        ALTER TABLE public.pareceres ADD COLUMN status VARCHAR(20) DEFAULT 'rascunho';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pareceres' AND column_name = 'created_by') THEN
        ALTER TABLE public.pareceres ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;

END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_pareceres_aluno_id ON public.pareceres(aluno_id);
CREATE INDEX IF NOT EXISTS idx_pareceres_status ON public.pareceres(status);

-- RLS
ALTER TABLE public.pareceres ENABLE ROW LEVEL SECURITY;

-- Políticas (Garantir acesso ao dono)
DROP POLICY IF EXISTS "pareceres_select_policy" ON public.pareceres;
DROP POLICY IF EXISTS "pareceres_insert_policy" ON public.pareceres;
DROP POLICY IF EXISTS "pareceres_update_policy" ON public.pareceres;
DROP POLICY IF EXISTS "pareceres_delete_policy" ON public.pareceres;

CREATE POLICY "pareceres_all_policy" ON public.pareceres
    FOR ALL
    USING (uid_professor = auth.uid() OR created_by = auth.uid());

-- Trigger update_updated_at
DROP TRIGGER IF EXISTS update_pareceres_updated_at ON public.pareceres;
CREATE TRIGGER update_pareceres_updated_at
    BEFORE UPDATE ON public.pareceres
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
