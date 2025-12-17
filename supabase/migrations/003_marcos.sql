-- ============================================
-- MIGRAÇÃO 003: Marcos de Desenvolvimento
-- Data: 2024-12
-- Descrição: Sistema de marcos e tracking de desenvolvimento
-- ============================================

-- ============================================
-- ENUM: Áreas de desenvolvimento
-- ============================================
DO $$ BEGIN
    CREATE TYPE area_desenvolvimento AS ENUM (
        'motor_fino',
        'motor_grosso', 
        'linguagem_oral',
        'linguagem_escrita',
        'matematica',
        'social_emocional',
        'autonomia',
        'criatividade',
        'cognitivo'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABELA: marcos
-- Marcos de desenvolvimento dos alunos
-- ============================================
CREATE TABLE IF NOT EXISTS public.marcos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    area area_desenvolvimento NOT NULL,
    data_marco DATE NOT NULL DEFAULT CURRENT_DATE,
    evidencias_ids UUID[], -- IDs de registros relacionados como evidência
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_marcos_aluno ON public.marcos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_marcos_area ON public.marcos(area);
CREATE INDEX IF NOT EXISTS idx_marcos_data ON public.marcos(data_marco);

-- RLS
ALTER TABLE public.marcos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marcos_policy" ON public.marcos
    FOR ALL USING (
        aluno_id IN (
            SELECT a.id FROM public.alunos a
            JOIN public.turmas t ON a.turma_id = t.id
            WHERE t.user_id = auth.uid()
        )
    );

-- ============================================
-- TABELA: desenvolvimento_tracking
-- Histórico de evolução por área de desenvolvimento
-- ============================================
CREATE TABLE IF NOT EXISTS public.desenvolvimento_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    area area_desenvolvimento NOT NULL,
    nivel INTEGER DEFAULT 0 CHECK (nivel >= 0 AND nivel <= 100),
    periodo VARCHAR(20) NOT NULL, -- "2024-B1", "2024-B2", "2024-T1", "2024-T2", "2024-T3"
    observacoes TEXT,
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(aluno_id, area, periodo)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_desenvolvimento_aluno ON public.desenvolvimento_tracking(aluno_id);
CREATE INDEX IF NOT EXISTS idx_desenvolvimento_periodo ON public.desenvolvimento_tracking(periodo);

-- RLS
ALTER TABLE public.desenvolvimento_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "desenvolvimento_policy" ON public.desenvolvimento_tracking
    FOR ALL USING (
        aluno_id IN (
            SELECT a.id FROM public.alunos a
            JOIN public.turmas t ON a.turma_id = t.id
            WHERE t.user_id = auth.uid()
        )
    );

-- ============================================
-- VIEW: Resumo de desenvolvimento por aluno
-- ============================================
CREATE OR REPLACE VIEW public.aluno_desenvolvimento_resumo AS
SELECT 
    a.id AS aluno_id,
    a.nome AS aluno_nome,
    a.turma_id,
    COUNT(DISTINCT m.id) AS total_marcos,
    COUNT(DISTINCT m.area) AS areas_com_marco,
    MAX(m.data_marco) AS ultimo_marco,
    json_agg(
        DISTINCT jsonb_build_object(
            'area', m.area,
            'count', 1
        )
    ) FILTER (WHERE m.id IS NOT NULL) AS marcos_por_area
FROM public.alunos a
LEFT JOIN public.marcos m ON m.aluno_id = a.id
GROUP BY a.id, a.nome, a.turma_id;

-- ============================================
-- LABELS para áreas de desenvolvimento (para UI)
-- ============================================
COMMENT ON TYPE area_desenvolvimento IS 'Áreas de desenvolvimento para Ed. Infantil';

-- Função helper para obter label da área
CREATE OR REPLACE FUNCTION public.get_area_label(area area_desenvolvimento)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE area
        WHEN 'motor_fino' THEN 'Coordenação Motora Fina'
        WHEN 'motor_grosso' THEN 'Coordenação Motora Grossa'
        WHEN 'linguagem_oral' THEN 'Linguagem Oral'
        WHEN 'linguagem_escrita' THEN 'Linguagem Escrita'
        WHEN 'matematica' THEN 'Pensamento Matemático'
        WHEN 'social_emocional' THEN 'Desenvolvimento Socioemocional'
        WHEN 'autonomia' THEN 'Autonomia'
        WHEN 'criatividade' THEN 'Criatividade e Imaginação'
        WHEN 'cognitivo' THEN 'Desenvolvimento Cognitivo'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
