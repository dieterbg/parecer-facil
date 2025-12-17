# 🗄️ Especificação do Banco de Dados - Educador Pro

> **Modelo de dados completo com scripts de migração**

---

## 📋 Visão Geral

Este documento contém todas as tabelas necessárias para o Educador Pro, organizadas por módulo.

---

## 🔄 Migrações

### Migração 001: Schema Base (Já Existe)

```sql
-- Tabela de professores
CREATE TABLE IF NOT EXISTS professores (
    uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(200),
    email VARCHAR(255),
    estilo_escrita TEXT,
    paginas_esperadas INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de turmas
CREATE TABLE IF NOT EXISTS turmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    ano_letivo VARCHAR(10) NOT NULL,
    escola VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de alunos
CREATE TABLE IF NOT EXISTS alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    data_nascimento DATE,
    observacoes TEXT,
    foto_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de pareceres
CREATE TABLE IF NOT EXISTS pareceres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid_professor UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    aluno_nome VARCHAR(200) NOT NULL,
    aluno_idade VARCHAR(100),
    audio_url TEXT,
    resultado_texto TEXT,
    status VARCHAR(20) DEFAULT 'pendente',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de registros
CREATE TABLE IF NOT EXISTS registros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('foto', 'video', 'audio', 'texto')),
    url_arquivo TEXT,
    descricao TEXT,
    data_registro TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de vínculo registros-alunos (N:N)
CREATE TABLE IF NOT EXISTS registros_alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registro_id UUID NOT NULL REFERENCES registros(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(registro_id, aluno_id)
);
```

---

### Migração 002: Contextos e Tags

```sql
-- ============================================
-- MIGRAÇÃO 002: Contextos e Tags
-- Data: 2024-12
-- Descrição: Adiciona sistema de tags/contexto para registros
-- ============================================

-- Tabela de contextos (tags para registros)
CREATE TABLE IF NOT EXISTS contextos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    icone VARCHAR(50) DEFAULT '📌',
    cor VARCHAR(7) DEFAULT '#6366F1',
    is_default BOOLEAN DEFAULT false,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna de contexto aos registros
ALTER TABLE registros 
ADD COLUMN IF NOT EXISTS contexto_id UUID REFERENCES contextos(id) ON DELETE SET NULL;

-- Adicionar transcrição de voz aos registros
ALTER TABLE registros 
ADD COLUMN IF NOT EXISTS transcricao_voz TEXT;

-- Adicionar flag de compartilhar com família
ALTER TABLE registros 
ADD COLUMN IF NOT EXISTS compartilhar_familia BOOLEAN DEFAULT false;

-- Inserir contextos padrão (serão criados para cada usuário)
-- Isso será feito via trigger ou seed

-- RLS para contextos
ALTER TABLE contextos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contextos_user_policy" ON contextos
    FOR ALL USING (
        user_id = auth.uid() OR is_default = true
    );

-- Índices
CREATE INDEX IF NOT EXISTS idx_registros_contexto ON registros(contexto_id);
CREATE INDEX IF NOT EXISTS idx_contextos_user ON contextos(user_id);
```

---

### Migração 003: Marcos de Desenvolvimento

```sql
-- ============================================
-- MIGRAÇÃO 003: Marcos de Desenvolvimento
-- Data: 2024-12
-- Descrição: Sistema de marcos e tracking de desenvolvimento
-- ============================================

-- Enum para áreas de desenvolvimento
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

-- Tabela de marcos de desenvolvimento
CREATE TABLE IF NOT EXISTS marcos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    area area_desenvolvimento NOT NULL,
    data_marco DATE NOT NULL DEFAULT CURRENT_DATE,
    evidencias_ids UUID[], -- IDs de registros relacionados
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de tracking de desenvolvimento (histórico de evolução)
CREATE TABLE IF NOT EXISTS desenvolvimento_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    area area_desenvolvimento NOT NULL,
    nivel INTEGER DEFAULT 0 CHECK (nivel >= 0 AND nivel <= 100),
    periodo VARCHAR(20) NOT NULL, -- "2024-B1", "2024-B2", "2024-T1"
    observacoes TEXT,
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(aluno_id, area, periodo)
);

-- RLS
ALTER TABLE marcos ENABLE ROW LEVEL SECURITY;
ALTER TABLE desenvolvimento_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marcos_professor_policy" ON marcos
    FOR ALL USING (
        aluno_id IN (
            SELECT a.id FROM alunos a
            JOIN turmas t ON a.turma_id = t.id
            WHERE t.user_id = auth.uid()
        )
    );

CREATE POLICY "desenvolvimento_professor_policy" ON desenvolvimento_tracking
    FOR ALL USING (
        aluno_id IN (
            SELECT a.id FROM alunos a
            JOIN turmas t ON a.turma_id = t.id
            WHERE t.user_id = auth.uid()
        )
    );

-- Índices
CREATE INDEX IF NOT EXISTS idx_marcos_aluno ON marcos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_marcos_area ON marcos(area);
CREATE INDEX IF NOT EXISTS idx_marcos_data ON marcos(data_marco);
CREATE INDEX IF NOT EXISTS idx_desenvolvimento_aluno ON desenvolvimento_tracking(aluno_id);
```

---

### Migração 004: Planejamento Pedagógico

```sql
-- ============================================
-- MIGRAÇÃO 004: Planejamento Pedagógico
-- Data: 2024-12
-- Descrição: Sistema de planejamento semanal integrado com BNCC
-- ============================================

-- Tabela de campos BNCC (dados pré-populados)
CREATE TABLE IF NOT EXISTS bncc_campos (
    codigo VARCHAR(20) PRIMARY KEY,
    campo VARCHAR(150) NOT NULL,
    faixa_etaria VARCHAR(30) NOT NULL, -- 'bebes', 'criancas_bem_pequenas', 'criancas_pequenas'
    objetivo TEXT NOT NULL,
    palavras_chave TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de atividades (banco de atividades)
CREATE TABLE IF NOT EXISTS atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    duracao_minutos INTEGER DEFAULT 30,
    materiais TEXT[],
    campos_bncc VARCHAR(20)[], -- Array de códigos BNCC
    tipo VARCHAR(50), -- 'roda', 'dirigida', 'livre', 'parque', 'culinaria', etc
    faixa_etaria VARCHAR(30),
    is_template BOOLEAN DEFAULT false, -- Templates globais
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de planejamento semanal
CREATE TABLE IF NOT EXISTS planejamento_semanal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES turmas(id) ON DELETE CASCADE,
    semana_inicio DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'ativo', 'concluido')),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(turma_id, semana_inicio)
);

-- Tabela de atividades planejadas
CREATE TABLE IF NOT EXISTS atividades_planejadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planejamento_id UUID NOT NULL REFERENCES planejamento_semanal(id) ON DELETE CASCADE,
    atividade_id UUID REFERENCES atividades(id) ON DELETE SET NULL,
    titulo_customizado VARCHAR(200), -- Se não usar atividade do banco
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=dom, 1=seg...
    horario TIME,
    ordem INTEGER DEFAULT 0,
    realizada BOOLEAN DEFAULT false,
    observacoes_execucao TEXT,
    registro_id UUID REFERENCES registros(id) ON DELETE SET NULL, -- Link com registro
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE planejamento_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades_planejadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "atividades_user_policy" ON atividades
    FOR ALL USING (user_id = auth.uid() OR is_template = true);

CREATE POLICY "planejamento_user_policy" ON planejamento_semanal
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "atividades_planejadas_user_policy" ON atividades_planejadas
    FOR ALL USING (
        planejamento_id IN (
            SELECT id FROM planejamento_semanal WHERE user_id = auth.uid()
        )
    );

-- Índices
CREATE INDEX IF NOT EXISTS idx_atividades_user ON atividades(user_id);
CREATE INDEX IF NOT EXISTS idx_planejamento_turma ON planejamento_semanal(turma_id);
CREATE INDEX IF NOT EXISTS idx_planejamento_semana ON planejamento_semanal(semana_inicio);
CREATE INDEX IF NOT EXISTS idx_atividades_planejadas_plan ON atividades_planejadas(planejamento_id);
```

---

### Migração 005: Dados BNCC

```sql
-- ============================================
-- MIGRAÇÃO 005: Seed BNCC Educação Infantil
-- Data: 2024-12
-- Descrição: Popula tabela com campos de experiência da BNCC
-- ============================================

-- O EU, O OUTRO E O NÓS
INSERT INTO bncc_campos (codigo, campo, faixa_etaria, objetivo, palavras_chave) VALUES
('EI01EO01', 'O eu, o outro e o nós', 'bebes', 'Perceber que suas ações têm efeitos nas outras crianças e nos adultos.', ARRAY['interação', 'causa e efeito', 'relações']),
('EI01EO02', 'O eu, o outro e o nós', 'bebes', 'Perceber as possibilidades e os limites de seu corpo nas brincadeiras e interações.', ARRAY['corpo', 'limites', 'brincadeiras']),
('EI01EO03', 'O eu, o outro e o nós', 'bebes', 'Interagir com crianças da mesma faixa etária e adultos ao explorar espaços, materiais, objetos e brinquedos.', ARRAY['interação', 'exploração', 'materiais']),
('EI01EO04', 'O eu, o outro e o nós', 'bebes', 'Comunicar necessidades, desejos e emoções, utilizando gestos, balbucios, palavras.', ARRAY['comunicação', 'emoções', 'linguagem']),
('EI01EO05', 'O eu, o outro e o nós', 'bebes', 'Reconhecer seu corpo e expressar suas sensações em momentos de alimentação, higiene, brincadeira e descanso.', ARRAY['corpo', 'sensações', 'rotina']),
('EI01EO06', 'O eu, o outro e o nós', 'bebes', 'Interagir com outras crianças da mesma faixa etária e adultos, adaptando-se ao convívio social.', ARRAY['interação', 'convívio', 'adaptação']),

('EI02EO01', 'O eu, o outro e o nós', 'criancas_bem_pequenas', 'Demonstrar atitudes de cuidado e solidariedade na interação com crianças e adultos.', ARRAY['cuidado', 'solidariedade', 'interação']),
('EI02EO02', 'O eu, o outro e o nós', 'criancas_bem_pequenas', 'Demonstrar imagem positiva de si e confiança em sua capacidade para enfrentar dificuldades e desafios.', ARRAY['autoestima', 'confiança', 'desafios']),
('EI02EO03', 'O eu, o outro e o nós', 'criancas_bem_pequenas', 'Compartilhar os objetos e os espaços com crianças da mesma faixa etária e adultos.', ARRAY['compartilhar', 'cooperação', 'espaços']),
('EI02EO04', 'O eu, o outro e o nós', 'criancas_bem_pequenas', 'Comunicar-se com os colegas e os adultos, buscando compreendê-los e fazendo-se compreender.', ARRAY['comunicação', 'compreensão', 'diálogo']),
('EI02EO05', 'O eu, o outro e o nós', 'criancas_bem_pequenas', 'Perceber que as pessoas têm características físicas diferentes, respeitando essas diferenças.', ARRAY['diversidade', 'respeito', 'características']),
('EI02EO06', 'O eu, o outro e o nós', 'criancas_bem_pequenas', 'Respeitar regras básicas de convívio social nas interações e brincadeiras.', ARRAY['regras', 'convívio', 'brincadeiras']),
('EI02EO07', 'O eu, o outro e o nós', 'criancas_bem_pequenas', 'Resolver conflitos nas interações e brincadeiras, com a orientação de um adulto.', ARRAY['conflitos', 'resolução', 'mediação']),

('EI03EO01', 'O eu, o outro e o nós', 'criancas_pequenas', 'Demonstrar empatia pelos outros, percebendo que as pessoas têm diferentes sentimentos, necessidades e maneiras de pensar e agir.', ARRAY['empatia', 'sentimentos', 'diferenças']),
('EI03EO02', 'O eu, o outro e o nós', 'criancas_pequenas', 'Agir de maneira independente, com confiança em suas capacidades, reconhecendo suas conquistas e limitações.', ARRAY['independência', 'autonomia', 'autoconhecimento']),
('EI03EO03', 'O eu, o outro e o nós', 'criancas_pequenas', 'Ampliar as relações interpessoais, desenvolvendo atitudes de participação e cooperação.', ARRAY['relações', 'participação', 'cooperação']),
('EI03EO04', 'O eu, o outro e o nós', 'criancas_pequenas', 'Comunicar suas ideias e sentimentos a pessoas e grupos diversos.', ARRAY['comunicação', 'expressão', 'grupos']),
('EI03EO05', 'O eu, o outro e o nós', 'criancas_pequenas', 'Demonstrar valorização das características de seu corpo e respeitar as características dos outros.', ARRAY['corpo', 'valorização', 'respeito']),
('EI03EO06', 'O eu, o outro e o nós', 'criancas_pequenas', 'Manifestar interesse e respeito por diferentes culturas e modos de vida.', ARRAY['culturas', 'diversidade', 'respeito']),
('EI03EO07', 'O eu, o outro e o nós', 'criancas_pequenas', 'Usar estratégias pautadas no respeito mútuo para lidar com conflitos nas interações com crianças e adultos.', ARRAY['conflitos', 'respeito', 'estratégias'])

ON CONFLICT (codigo) DO NOTHING;

-- CORPO, GESTOS E MOVIMENTOS
INSERT INTO bncc_campos (codigo, campo, faixa_etaria, objetivo, palavras_chave) VALUES
('EI01CG01', 'Corpo, gestos e movimentos', 'bebes', 'Movimentar as partes do corpo para exprimir corporalmente emoções, necessidades e desejos.', ARRAY['movimento', 'expressão', 'corpo']),
('EI01CG02', 'Corpo, gestos e movimentos', 'bebes', 'Experimentar as possibilidades corporais nas brincadeiras e interações em ambientes acolhedores e desafiantes.', ARRAY['experimentação', 'brincadeiras', 'desafios']),
('EI01CG03', 'Corpo, gestos e movimentos', 'bebes', 'Imitar gestos e movimentos de outras crianças, adultos e animais.', ARRAY['imitação', 'gestos', 'movimentos']),
('EI01CG04', 'Corpo, gestos e movimentos', 'bebes', 'Participar do cuidado do seu corpo e da promoção do seu bem-estar.', ARRAY['cuidado', 'corpo', 'bem-estar']),
('EI01CG05', 'Corpo, gestos e movimentos', 'bebes', 'Utilizar os movimentos de preensão, encaixe e lançamento, ampliando suas possibilidades de manuseio de diferentes materiais e objetos.', ARRAY['preensão', 'coordenação', 'manuseio']),

('EI02CG01', 'Corpo, gestos e movimentos', 'criancas_bem_pequenas', 'Apropriar-se de gestos e movimentos de sua cultura no cuidado de si e nos jogos e brincadeiras.', ARRAY['cultura', 'gestos', 'brincadeiras']),
('EI02CG02', 'Corpo, gestos e movimentos', 'criancas_bem_pequenas', 'Deslocar seu corpo no espaço, orientando-se por noções como em frente, atrás, no alto, embaixo, dentro, fora etc.', ARRAY['espaço', 'orientação', 'noções espaciais']),
('EI02CG03', 'Corpo, gestos e movimentos', 'criancas_bem_pequenas', 'Explorar formas de deslocamento no espaço (pular, saltar, dançar), combinando movimentos e seguindo orientações.', ARRAY['deslocamento', 'movimentos', 'dança']),
('EI02CG04', 'Corpo, gestos e movimentos', 'criancas_bem_pequenas', 'Demonstrar progressiva independência no cuidado do seu corpo.', ARRAY['independência', 'cuidado', 'autonomia']),
('EI02CG05', 'Corpo, gestos e movimentos', 'criancas_bem_pequenas', 'Desenvolver progressivamente as habilidades manuais, adquirindo controle para desenhar, pintar, rasgar, folhear, entre outros.', ARRAY['habilidades manuais', 'coordenação fina', 'desenho']),

('EI03CG01', 'Corpo, gestos e movimentos', 'criancas_pequenas', 'Criar com o corpo formas diversificadas de expressão de sentimentos, sensações e emoções.', ARRAY['expressão corporal', 'sentimentos', 'criatividade']),
('EI03CG02', 'Corpo, gestos e movimentos', 'criancas_pequenas', 'Demonstrar controle e adequação do uso de seu corpo em brincadeiras e jogos, escuta e reconto de histórias, atividades artísticas.', ARRAY['controle corporal', 'jogos', 'arte']),
('EI03CG03', 'Corpo, gestos e movimentos', 'criancas_pequenas', 'Criar movimentos, gestos, olhares e mímicas em brincadeiras, jogos e atividades artísticas.', ARRAY['criatividade', 'movimentos', 'mímica']),
('EI03CG04', 'Corpo, gestos e movimentos', 'criancas_pequenas', 'Adotar hábitos de autocuidado relacionados a higiene, alimentação, conforto e aparência.', ARRAY['autocuidado', 'higiene', 'hábitos']),
('EI03CG05', 'Corpo, gestos e movimentos', 'criancas_pequenas', 'Coordenar suas habilidades manuais no atendimento adequado a seus interesses e necessidades em situações diversas.', ARRAY['coordenação', 'habilidades manuais', 'autonomia'])

ON CONFLICT (codigo) DO NOTHING;

-- Continua com TRAÇOS, SONS, CORES E FORMAS / ESCUTA, FALA, PENSAMENTO E IMAGINAÇÃO / ESPAÇOS, TEMPOS, QUANTIDADES, RELAÇÕES E TRANSFORMAÇÕES
-- (Código similar para os demais campos)
```

---

### Migração 006: Portfólio Digital

```sql
-- ============================================
-- MIGRAÇÃO 006: Portfólio Digital
-- Data: 2024-12
-- Descrição: Sistema de portfólio automático
-- ============================================

-- Tabela principal de portfólios
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    periodo VARCHAR(50) NOT NULL, -- "2024", "2024-S1", "2024-B1"
    template VARCHAR(50) DEFAULT 'moderno',
    capa_url TEXT,
    capa_config JSONB DEFAULT '{}', -- Configurações visuais da capa
    status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'gerando', 'pronto', 'publicado')),
    share_token VARCHAR(100) UNIQUE,
    share_enabled BOOLEAN DEFAULT false,
    share_expires_at TIMESTAMPTZ,
    visualizacoes INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de seções do portfólio
CREATE TABLE IF NOT EXISTS portfolio_secoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'capa', 'apresentacao', 'galeria', 'texto', 'evolucao', 'marcos', 'mensagem'
    titulo VARCHAR(200),
    conteudo JSONB DEFAULT '{}', -- Conteúdo específico por tipo
    ordem INTEGER NOT NULL DEFAULT 0,
    visivel BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de registros selecionados para seções de galeria
CREATE TABLE IF NOT EXISTS portfolio_registros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secao_id UUID NOT NULL REFERENCES portfolio_secoes(id) ON DELETE CASCADE,
    registro_id UUID NOT NULL REFERENCES registros(id) ON DELETE CASCADE,
    legenda TEXT,
    ordem INTEGER DEFAULT 0,
    destaque BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_secoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_registros ENABLE ROW LEVEL SECURITY;

-- Professor pode ver/editar portfólios de seus alunos
CREATE POLICY "portfolios_professor_policy" ON portfolios
    FOR ALL USING (
        aluno_id IN (
            SELECT a.id FROM alunos a
            JOIN turmas t ON a.turma_id = t.id
            WHERE t.user_id = auth.uid()
        )
    );

-- Qualquer um pode ver portfólio publicado via share_token (verificado na aplicação)
CREATE POLICY "portfolios_publico_policy" ON portfolios
    FOR SELECT USING (share_enabled = true);

CREATE POLICY "portfolio_secoes_policy" ON portfolio_secoes
    FOR ALL USING (
        portfolio_id IN (
            SELECT p.id FROM portfolios p
            JOIN alunos a ON p.aluno_id = a.id
            JOIN turmas t ON a.turma_id = t.id
            WHERE t.user_id = auth.uid()
        )
    );

CREATE POLICY "portfolio_registros_policy" ON portfolio_registros
    FOR ALL USING (
        secao_id IN (
            SELECT ps.id FROM portfolio_secoes ps
            JOIN portfolios p ON ps.portfolio_id = p.id
            JOIN alunos a ON p.aluno_id = a.id
            JOIN turmas t ON a.turma_id = t.id
            WHERE t.user_id = auth.uid()
        )
    );

-- Função para gerar token de compartilhamento
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Índices
CREATE INDEX IF NOT EXISTS idx_portfolios_aluno ON portfolios(aluno_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_share ON portfolios(share_token) WHERE share_enabled = true;
CREATE INDEX IF NOT EXISTS idx_portfolio_secoes_portfolio ON portfolio_secoes(portfolio_id);
```

---

### Migração 007: Portal Família

```sql
-- ============================================
-- MIGRAÇÃO 007: Portal Família
-- Data: 2024-12
-- Descrição: Contas de família e comunicação
-- ============================================

-- Tabela de usuários família
CREATE TABLE IF NOT EXISTS familia_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(200),
    telefone VARCHAR(20),
    senha_hash TEXT, -- Se usar auth separada
    auth_user_id UUID REFERENCES auth.users(id), -- Se usar Supabase Auth
    alunos_ids UUID[] NOT NULL DEFAULT '{}',
    ultimo_acesso TIMESTAMPTZ,
    notificacoes_email BOOLEAN DEFAULT true,
    notificacoes_push BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de convites para família
CREATE TABLE IF NOT EXISTS familia_convites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'expirado')),
    convidado_por UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de comunicados
CREATE TABLE IF NOT EXISTS comunicados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    conteudo TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'geral' CHECK (tipo IN ('geral', 'evento', 'urgente', 'lembrete')),
    data_evento DATE,
    hora_evento TIME,
    local_evento VARCHAR(200),
    anexos_urls TEXT[],
    publicado BOOLEAN DEFAULT false,
    publicado_em TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de leitura de comunicados
CREATE TABLE IF NOT EXISTS comunicados_leitura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comunicado_id UUID NOT NULL REFERENCES comunicados(id) ON DELETE CASCADE,
    familia_usuario_id UUID NOT NULL REFERENCES familia_usuarios(id) ON DELETE CASCADE,
    lido_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comunicado_id, familia_usuario_id)
);

-- Tabela de mensagens (chat professor-família)
CREATE TABLE IF NOT EXISTS mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    remetente_tipo VARCHAR(20) NOT NULL CHECK (remetente_tipo IN ('professor', 'familia')),
    remetente_id UUID NOT NULL,
    conteudo TEXT NOT NULL,
    anexo_url TEXT,
    lida BOOLEAN DEFAULT false,
    lida_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE familia_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE familia_convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas (simplificadas, expandir conforme necessidade)
CREATE POLICY "comunicados_professor_policy" ON comunicados
    FOR ALL USING (
        turma_id IN (SELECT id FROM turmas WHERE user_id = auth.uid())
    );

CREATE POLICY "mensagens_professor_policy" ON mensagens
    FOR ALL USING (
        aluno_id IN (
            SELECT a.id FROM alunos a
            JOIN turmas t ON a.turma_id = t.id
            WHERE t.user_id = auth.uid()
        )
    );

-- Índices
CREATE INDEX IF NOT EXISTS idx_familia_email ON familia_usuarios(email);
CREATE INDEX IF NOT EXISTS idx_comunicados_turma ON comunicados(turma_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_aluno ON mensagens(aluno_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_lida ON mensagens(lida) WHERE lida = false;
```

---

### Migração 008: Analytics e Métricas

```sql
-- ============================================
-- MIGRAÇÃO 008: Analytics e Métricas
-- Data: 2024-12
-- Descrição: Tabelas para dashboard de análise
-- ============================================

-- View materializada para estatísticas de registros por turma
CREATE MATERIALIZED VIEW IF NOT EXISTS stats_registros_turma AS
SELECT 
    t.id AS turma_id,
    t.user_id,
    COUNT(DISTINCT r.id) AS total_registros,
    COUNT(DISTINCT CASE WHEN r.tipo = 'foto' THEN r.id END) AS total_fotos,
    COUNT(DISTINCT CASE WHEN r.tipo = 'video' THEN r.id END) AS total_videos,
    COUNT(DISTINCT CASE WHEN r.tipo = 'audio' THEN r.id END) AS total_audios,
    COUNT(DISTINCT CASE WHEN r.tipo = 'texto' THEN r.id END) AS total_textos,
    COUNT(DISTINCT ra.aluno_id) AS alunos_com_registro,
    MAX(r.created_at) AS ultimo_registro
FROM turmas t
LEFT JOIN alunos a ON a.turma_id = t.id
LEFT JOIN registros_alunos ra ON ra.aluno_id = a.id
LEFT JOIN registros r ON r.id = ra.registro_id
GROUP BY t.id, t.user_id;

-- Índice único para refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_stats_registros_turma ON stats_registros_turma(turma_id);

-- Função para atualizar stats
CREATE OR REPLACE FUNCTION refresh_stats_registros()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY stats_registros_turma;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar ao inserir registro
CREATE TRIGGER trigger_refresh_stats_registros
AFTER INSERT OR DELETE ON registros_alunos
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_stats_registros();

-- Tabela de alertas gerados
CREATE TABLE IF NOT EXISTS alertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'aluno_sem_registro', 'bncc_baixa_cobertura', 'parecer_pendente'
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    dados JSONB DEFAULT '{}', -- Dados adicionais (aluno_id, dias_sem_registro, etc)
    lido BOOLEAN DEFAULT false,
    acao_url TEXT, -- Link para resolver o alerta
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alertas_user_policy" ON alertas
    FOR ALL USING (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_alertas_user ON alertas(user_id);
CREATE INDEX IF NOT EXISTS idx_alertas_nao_lido ON alertas(user_id, lido) WHERE lido = false;
```

---

## 📊 Diagrama Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BANCO DE DADOS                                  │
│                             EDUCADOR PRO v2                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AUTH (Supabase)              CORE                     PLANEJAMENTO         │
│  ┌──────────────┐       ┌──────────────┐         ┌──────────────┐          │
│  │    users     │───────│ professores  │         │ bncc_campos  │          │
│  └──────────────┘       └──────────────┘         └──────────────┘          │
│         │                      │                        │                   │
│         │               ┌──────┴──────┐                 │                   │
│         │               ▼             ▼                 │                   │
│         │         ┌──────────┐  ┌──────────┐           │                   │
│         │         │  turmas  │  │ contextos│           │                   │
│         │         └────┬─────┘  └──────────┘           │                   │
│         │              │                               │                   │
│         │              ▼                               │                   │
│         │         ┌──────────┐                   ┌─────┴─────┐            │
│         │         │  alunos  │                   │atividades │            │
│         │         └────┬─────┘                   └─────┬─────┘            │
│         │              │                               │                   │
│         │    ┌─────────┼─────────┐             ┌──────┴──────┐            │
│         │    ▼         ▼         ▼             ▼             ▼            │
│         │ ┌──────┐ ┌───────┐ ┌───────┐  ┌──────────┐ ┌───────────┐       │
│         │ │marcos│ │registr│ │parecer│  │planeja-  │ │atividades │       │
│         │ └──────┘ └───┬───┘ └───────┘  │mento_sem│ │_planejadas│       │
│         │              │                └──────────┘ └───────────┘       │
│         │              │                                                   │
│         │    ┌─────────┴─────────┐                                        │
│         │    ▼                   ▼                                        │
│         │ ┌──────────────┐  ┌───────────┐                                 │
│         │ │registros_    │  │desenvolv. │                                 │
│         │ │alunos        │  │_tracking  │                                 │
│         │ └──────────────┘  └───────────┘                                 │
│                                                                            │
│  PORTFOLIO                           FAMÍLIA                               │
│  ┌──────────────┐              ┌──────────────┐                           │
│  │  portfolios  │              │familia_      │                           │
│  └──────┬───────┘              │usuarios      │                           │
│         │                      └──────────────┘                           │
│         ▼                             │                                    │
│  ┌──────────────┐              ┌──────┴──────┐                            │
│  │portfolio_    │              ▼             ▼                            │
│  │secoes        │        ┌──────────┐  ┌──────────┐                       │
│  └──────┬───────┘        │comunicad.│  │mensagens │                       │
│         │                └──────────┘  └──────────┘                       │
│         ▼                                                                  │
│  ┌──────────────┐                                                         │
│  │portfolio_    │                                                         │
│  │registros     │                                                         │
│  └──────────────┘                                                         │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*Documento atualizado em: Dezembro 2024*
*Versão: 1.0*
