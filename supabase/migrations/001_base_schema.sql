-- ============================================
-- MIGRAÇÃO 001: Schema Base (Educador Pro v2)
-- Data: 2024-12
-- Descrição: Tabelas base para turmas, alunos e registros
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: turmas
-- Turmas/classes do professor
-- ============================================
CREATE TABLE IF NOT EXISTS public.turmas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    ano_letivo VARCHAR(10) NOT NULL DEFAULT '2024',
    escola VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas novas se não existirem (para tabelas já existentes)
DO $$
BEGIN
    -- Adiciona coluna descricao
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'turmas' AND column_name = 'descricao') THEN
        ALTER TABLE public.turmas ADD COLUMN descricao TEXT;
    END IF;
    
    -- Adiciona coluna cor
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'turmas' AND column_name = 'cor') THEN
        ALTER TABLE public.turmas ADD COLUMN cor VARCHAR(7) DEFAULT '#6366F1';
    END IF;
    
    -- Adiciona coluna ativa
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'turmas' AND column_name = 'ativa') THEN
        ALTER TABLE public.turmas ADD COLUMN ativa BOOLEAN DEFAULT true;
    END IF;
    
    -- Adiciona coluna updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'turmas' AND column_name = 'updated_at') THEN
        ALTER TABLE public.turmas ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_turmas_user ON public.turmas(user_id);

-- RLS
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "turmas_select_policy" ON public.turmas
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "turmas_insert_policy" ON public.turmas
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "turmas_update_policy" ON public.turmas
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "turmas_delete_policy" ON public.turmas
    FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- TABELA: alunos
-- Alunos de cada turma
-- ============================================
CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas novas se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alunos' AND column_name = 'data_nascimento') THEN
        ALTER TABLE public.alunos ADD COLUMN data_nascimento DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alunos' AND column_name = 'observacoes') THEN
        ALTER TABLE public.alunos ADD COLUMN observacoes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alunos' AND column_name = 'foto_url') THEN
        ALTER TABLE public.alunos ADD COLUMN foto_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alunos' AND column_name = 'ativo') THEN
        ALTER TABLE public.alunos ADD COLUMN ativo BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alunos' AND column_name = 'updated_at') THEN
        ALTER TABLE public.alunos ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_alunos_turma ON public.alunos(turma_id);
CREATE INDEX IF NOT EXISTS idx_alunos_nome ON public.alunos(nome);

-- RLS
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alunos_policy" ON public.alunos
    FOR ALL USING (
        turma_id IN (
            SELECT id FROM public.turmas WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- TABELA: registros
-- Registros multimídia (fotos, vídeos, áudios, textos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.registros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(20) NOT NULL,
    url_arquivo TEXT,
    descricao TEXT,
    data_registro TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas novas se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'registros' AND column_name = 'transcricao_voz') THEN
        ALTER TABLE public.registros ADD COLUMN transcricao_voz TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'registros' AND column_name = 'contexto_id') THEN
        ALTER TABLE public.registros ADD COLUMN contexto_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'registros' AND column_name = 'compartilhar_familia') THEN
        ALTER TABLE public.registros ADD COLUMN compartilhar_familia BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'registros' AND column_name = 'created_by') THEN
        ALTER TABLE public.registros ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_registros_tipo ON public.registros(tipo);
CREATE INDEX IF NOT EXISTS idx_registros_data ON public.registros(data_registro);

-- RLS
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;

-- Drop policy se existir para recriar
DROP POLICY IF EXISTS "registros_policy" ON public.registros;

CREATE POLICY "registros_policy" ON public.registros
    FOR ALL USING (created_by = auth.uid() OR created_by IS NULL);

-- ============================================
-- TABELA: registros_alunos (N:N)
-- Vincula registros a múltiplos alunos
-- ============================================
CREATE TABLE IF NOT EXISTS public.registros_alunos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registro_id UUID NOT NULL REFERENCES public.registros(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(registro_id, aluno_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_registros_alunos_registro ON public.registros_alunos(registro_id);
CREATE INDEX IF NOT EXISTS idx_registros_alunos_aluno ON public.registros_alunos(aluno_id);

-- RLS
ALTER TABLE public.registros_alunos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registros_alunos_policy" ON public.registros_alunos
    FOR ALL USING (
        aluno_id IN (
            SELECT a.id FROM public.alunos a
            JOIN public.turmas t ON a.turma_id = t.id
            WHERE t.user_id = auth.uid()
        )
    );

-- ============================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_turmas_updated_at
    BEFORE UPDATE ON public.turmas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alunos_updated_at
    BEFORE UPDATE ON public.alunos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
