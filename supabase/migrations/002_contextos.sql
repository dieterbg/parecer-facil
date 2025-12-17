-- ============================================
-- MIGRAÇÃO 002: Contextos e Tags
-- Data: 2024-12
-- Descrição: Sistema de tags/contexto para registros
-- ============================================

-- ============================================
-- TABELA: contextos
-- Tags de contexto para organizar registros
-- ============================================
CREATE TABLE IF NOT EXISTS public.contextos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    icone VARCHAR(50) DEFAULT '📌',
    cor VARCHAR(7) DEFAULT '#6366F1',
    is_default BOOLEAN DEFAULT false, -- Contextos padrão disponíveis para todos
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contextos_user ON public.contextos(user_id);
CREATE INDEX IF NOT EXISTS idx_contextos_default ON public.contextos(is_default) WHERE is_default = true;

-- RLS
ALTER TABLE public.contextos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contextos_select_policy" ON public.contextos
    FOR SELECT USING (user_id = auth.uid() OR is_default = true);

CREATE POLICY "contextos_insert_policy" ON public.contextos
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "contextos_update_policy" ON public.contextos
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "contextos_delete_policy" ON public.contextos
    FOR DELETE USING (user_id = auth.uid() AND is_default = false);

-- ============================================
-- Adicionar FK de contexto em registros
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'registros_contexto_id_fkey'
    ) THEN
        ALTER TABLE public.registros 
        ADD CONSTRAINT registros_contexto_id_fkey 
        FOREIGN KEY (contexto_id) REFERENCES public.contextos(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================
-- SEED: Contextos padrão
-- ============================================
INSERT INTO public.contextos (nome, icone, cor, is_default, ordem) VALUES
    ('Roda de Conversa', '🗣️', '#3B82F6', true, 1),
    ('Parque', '🌳', '#22C55E', true, 2),
    ('Atividade Dirigida', '✏️', '#F59E0B', true, 3),
    ('Atividade Livre', '🎨', '#EC4899', true, 4),
    ('Alimentação', '🍎', '#EF4444', true, 5),
    ('Higiene', '🧼', '#06B6D4', true, 6),
    ('Descanso', '😴', '#8B5CF6', true, 7),
    ('Projeto', '📚', '#10B981', true, 8),
    ('Música', '🎵', '#F472B6', true, 9),
    ('Movimento', '🏃', '#F97316', true, 10),
    ('Faz de Conta', '🎭', '#A855F7', true, 11),
    ('Contação de História', '📖', '#6366F1', true, 12)
ON CONFLICT DO NOTHING;
