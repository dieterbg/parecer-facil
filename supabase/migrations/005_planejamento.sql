-- ============================================
-- MIGRAÇÃO 005: Planejamento Pedagógico + BNCC
-- Data: 2024-12
-- Descrição: Sistema de planejamento semanal com integração BNCC
-- ============================================

-- ============================================
-- TABELA: bncc_campos
-- Campos de Experiência da BNCC (Ed. Infantil)
-- ============================================
CREATE TABLE IF NOT EXISTS public.bncc_campos (
    codigo VARCHAR(20) PRIMARY KEY,
    campo VARCHAR(100) NOT NULL,
    faixa_etaria VARCHAR(30) NOT NULL, -- 'bebes', 'criancas_bem_pequenas', 'criancas_pequenas'
    objetivo TEXT NOT NULL,
    palavras_chave TEXT[]
);

-- ============================================
-- SEED: Campos BNCC - Educação Infantil
-- ============================================

-- BEBÊS (0 a 1 ano e 6 meses)
-- O eu, o outro e o nós
INSERT INTO public.bncc_campos VALUES
('EI01EO01', 'O eu, o outro e o nós', 'bebes', 'Perceber que suas ações têm efeitos nas outras crianças e nos adultos.', ARRAY['interação', 'efeitos', 'relações']),
('EI01EO02', 'O eu, o outro e o nós', 'bebes', 'Perceber as possibilidades e os limites de seu corpo nas brincadeiras e interações das quais participa.', ARRAY['corpo', 'limites', 'brincadeiras']),
('EI01EO03', 'O eu, o outro e o nós', 'bebes', 'Interagir com crianças da mesma faixa etária e adultos ao explorar espaços, materiais, objetos, brinquedos.', ARRAY['interação', 'exploração', 'materiais']),
('EI01EO04', 'O eu, o outro e o nós', 'bebes', 'Comunicar necessidades, desejos e emoções, utilizando gestos, balbucios, palavras.', ARRAY['comunicação', 'emoções', 'gestos']),
('EI01EO05', 'O eu, o outro e o nós', 'bebes', 'Reconhecer seu corpo e expressar suas sensações em momentos de alimentação, higiene, brincadeira e descanso.', ARRAY['corpo', 'sensações', 'rotina']),
('EI01EO06', 'O eu, o outro e o nós', 'bebes', 'Interagir com outras crianças da mesma faixa etária e adultos, adaptando-se ao convívio social.', ARRAY['socialização', 'convívio', 'adaptação'])
ON CONFLICT (codigo) DO NOTHING;

-- Corpo, gestos e movimentos
INSERT INTO public.bncc_campos VALUES
('EI01CG01', 'Corpo, gestos e movimentos', 'bebes', 'Movimentar as partes do corpo para exprimir corporalmente emoções, necessidades e desejos.', ARRAY['movimento', 'expressão', 'corpo']),
('EI01CG02', 'Corpo, gestos e movimentos', 'bebes', 'Experimentar as possibilidades corporais nas brincadeiras e interações em ambientes acolhedores e desafiantes.', ARRAY['exploração', 'brincadeiras', 'movimento']),
('EI01CG03', 'Corpo, gestos e movimentos', 'bebes', 'Imitar gestos e movimentos de outras crianças, adultos e animais.', ARRAY['imitação', 'gestos', 'movimento']),
('EI01CG04', 'Corpo, gestos e movimentos', 'bebes', 'Participar do cuidado do seu corpo e da promoção do seu bem-estar.', ARRAY['autocuidado', 'bem-estar', 'corpo']),
('EI01CG05', 'Corpo, gestos e movimentos', 'bebes', 'Utilizar os movimentos de preensão, encaixe e lançamento, ampliando suas possibilidades de manuseio de diferentes materiais e objetos.', ARRAY['coordenação', 'manuseio', 'objetos'])
ON CONFLICT (codigo) DO NOTHING;

-- Traços, sons, cores e formas
INSERT INTO public.bncc_campos VALUES
('EI01TS01', 'Traços, sons, cores e formas', 'bebes', 'Explorar sons produzidos com o próprio corpo e com objetos do ambiente.', ARRAY['sons', 'exploração', 'corpo']),
('EI01TS02', 'Traços, sons, cores e formas', 'bebes', 'Traçar marcas gráficas, em diferentes suportes, usando instrumentos riscantes e tintas.', ARRAY['desenho', 'traços', 'arte']),
('EI01TS03', 'Traços, sons, cores e formas', 'bebes', 'Explorar diferentes fontes sonoras e materiais para acompanhar brincadeiras cantadas, canções, músicas e melodias.', ARRAY['música', 'sons', 'brincadeiras']),
('EI01TS04', 'Traços, sons, cores e formas', 'bebes', 'Manipular materiais diversos e variados para comparar as diferenças e semelhanças entre eles.', ARRAY['materiais', 'texturas', 'exploração'])
ON CONFLICT (codigo) DO NOTHING;

-- Escuta, fala, pensamento e imaginação
INSERT INTO public.bncc_campos VALUES
('EI01EF01', 'Escuta, fala, pensamento e imaginação', 'bebes', 'Reconhecer quando é chamado por seu nome e reconhecer os nomes de pessoas com quem convive.', ARRAY['nome', 'identidade', 'reconhecimento']),
('EI01EF02', 'Escuta, fala, pensamento e imaginação', 'bebes', 'Demonstrar interesse ao ouvir a leitura de poemas e a apresentação de músicas.', ARRAY['leitura', 'música', 'interesse']),
('EI01EF03', 'Escuta, fala, pensamento e imaginação', 'bebes', 'Demonstrar interesse ao ouvir histórias lidas ou contadas, observando ilustrações e os movimentos de leitura do adulto-leitor.', ARRAY['histórias', 'leitura', 'ilustrações']),
('EI01EF04', 'Escuta, fala, pensamento e imaginação', 'bebes', 'Reconhecer elementos das ilustrações de histórias, apontando-os, a pedido do adulto-leitor.', ARRAY['ilustrações', 'reconhecimento', 'histórias']),
('EI01EF05', 'Escuta, fala, pensamento e imaginação', 'bebes', 'Imitar as variações de entonação e gestos realizados pelos adultos, ao ler histórias e ao cantar.', ARRAY['imitação', 'entonação', 'leitura']),
('EI01EF06', 'Escuta, fala, pensamento e imaginação', 'bebes', 'Comunicar-se com outras pessoas usando movimentos, gestos, balbucios, fala e outras formas de expressão.', ARRAY['comunicação', 'expressão', 'linguagem']),
('EI01EF07', 'Escuta, fala, pensamento e imaginação', 'bebes', 'Conhecer e manipular materiais impressos e audiovisuais em diferentes portadores.', ARRAY['materiais', 'livros', 'audiovisual']),
('EI01EF08', 'Escuta, fala, pensamento e imaginação', 'bebes', 'Participar de situações de escuta de textos em diferentes gêneros textuais.', ARRAY['escuta', 'gêneros', 'textos']),
('EI01EF09', 'Escuta, fala, pensamento e imaginação', 'bebes', 'Conhecer e manipular diferentes instrumentos e suportes de escrita.', ARRAY['escrita', 'instrumentos', 'suportes'])
ON CONFLICT (codigo) DO NOTHING;

-- Espaços, tempos, quantidades, relações e transformações
INSERT INTO public.bncc_campos VALUES
('EI01ET01', 'Espaços, tempos, quantidades, relações e transformações', 'bebes', 'Explorar e descobrir as propriedades de objetos e materiais.', ARRAY['exploração', 'propriedades', 'materiais']),
('EI01ET02', 'Espaços, tempos, quantidades, relações e transformações', 'bebes', 'Explorar relações de causa e efeito em brincadeiras com objetos e interações com o ambiente.', ARRAY['causa-efeito', 'brincadeiras', 'exploração']),
('EI01ET03', 'Espaços, tempos, quantidades, relações e transformações', 'bebes', 'Explorar o ambiente pela ação e observação, manipulando, experimentando e fazendo descobertas.', ARRAY['ambiente', 'exploração', 'descobertas']),
('EI01ET04', 'Espaços, tempos, quantidades, relações e transformações', 'bebes', 'Manipular, experimentar, arrumar e explorar o espaço por meio de experiências de deslocamentos de si e dos objetos.', ARRAY['espaço', 'movimento', 'exploração']),
('EI01ET05', 'Espaços, tempos, quantidades, relações e transformações', 'bebes', 'Manipular materiais diversos e variados para comparar as diferenças e semelhanças entre eles.', ARRAY['materiais', 'comparação', 'texturas']),
('EI01ET06', 'Espaços, tempos, quantidades, relações e transformações', 'bebes', 'Vivenciar diferentes ritmos, velocidades e fluxos nas interações e brincadeiras.', ARRAY['ritmo', 'velocidade', 'brincadeiras'])
ON CONFLICT (codigo) DO NOTHING;

-- CRIANÇAS BEM PEQUENAS (1 ano e 7 meses a 3 anos e 11 meses)
INSERT INTO public.bncc_campos VALUES
('EI02EO01', 'O eu, o outro e o nós', 'criancas_bem_pequenas', 'Demonstrar atitudes de cuidado e solidariedade na interação com crianças e adultos.', ARRAY['cuidado', 'solidariedade', 'interação']),
('EI02EO02', 'O eu, o outro e o nós', 'criancas_bem_pequenas', 'Demonstrar imagem positiva de si e confiança em sua capacidade para enfrentar dificuldades e desafios.', ARRAY['autoestima', 'confiança', 'desafios']),
('EI02EO03', 'O eu, o outro e o nós', 'criancas_bem_pequenas', 'Compartilhar os objetos e os espaços com crianças da mesma faixa etária e adultos.', ARRAY['compartilhar', 'espaços', 'socialização']),
('EI02EO04', 'O eu, o outro e o nós', 'criancas_bem_pequenas', 'Comunicar-se com os colegas e os adultos, buscando compreendê-los e fazendo-se compreender.', ARRAY['comunicação', 'compreensão', 'diálogo']),
('EI02EO05', 'O eu, o outro e o nós', 'criancas_bem_pequenas', 'Perceber que as pessoas têm características físicas diferentes, respeitando essas diferenças.', ARRAY['diversidade', 'respeito', 'características']),
('EI02EO06', 'O eu, o outro e o nós', 'criancas_bem_pequenas', 'Respeitar regras básicas de convívio social nas interações e brincadeiras.', ARRAY['regras', 'convívio', 'respeito']),
('EI02EO07', 'O eu, o outro e o nós', 'criancas_bem_pequenas', 'Resolver conflitos nas interações e brincadeiras, com a orientação de um adulto.', ARRAY['conflitos', 'resolução', 'orientação'])
ON CONFLICT (codigo) DO NOTHING;

-- CRIANÇAS PEQUENAS (4 anos a 5 anos e 11 meses)
INSERT INTO public.bncc_campos VALUES
('EI03EO01', 'O eu, o outro e o nós', 'criancas_pequenas', 'Demonstrar empatia pelos outros, percebendo que as pessoas têm diferentes sentimentos, necessidades e maneiras de pensar e agir.', ARRAY['empatia', 'sentimentos', 'diversidade']),
('EI03EO02', 'O eu, o outro e o nós', 'criancas_pequenas', 'Agir de maneira independente, com confiança em suas capacidades, reconhecendo suas conquistas e limitações.', ARRAY['independência', 'autoconhecimento', 'confiança']),
('EI03EO03', 'O eu, o outro e o nós', 'criancas_pequenas', 'Ampliar as relações interpessoais, desenvolvendo atitudes de participação e cooperação.', ARRAY['cooperação', 'participação', 'relações']),
('EI03EO04', 'O eu, o outro e o nós', 'criancas_pequenas', 'Comunicar suas ideias e sentimentos a pessoas e grupos diversos.', ARRAY['comunicação', 'expressão', 'sentimentos']),
('EI03EO05', 'O eu, o outro e o nós', 'criancas_pequenas', 'Demonstrar valorização das características de seu corpo e respeitar as características dos outros.', ARRAY['corpo', 'respeito', 'diversidade']),
('EI03EO06', 'O eu, o outro e o nós', 'criancas_pequenas', 'Manifestar interesse e respeito por diferentes culturas e modos de vida.', ARRAY['cultura', 'respeito', 'diversidade']),
('EI03EO07', 'O eu, o outro e o nós', 'criancas_pequenas', 'Usar estratégias pautadas no respeito mútuo para lidar com conflitos nas interações com crianças e adultos.', ARRAY['conflitos', 'respeito', 'estratégias'])
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- TABELA: atividades
-- Banco de atividades do professor
-- ============================================
CREATE TABLE IF NOT EXISTS public.atividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    duracao_minutos INTEGER DEFAULT 30,
    materiais TEXT[],
    campos_bncc VARCHAR(20)[], -- ["EI02EO01", "EI02CG03"]
    tipo VARCHAR(50) DEFAULT 'livre', -- dirigida, livre, roda, parque, arte, musica, culinaria
    faixa_etaria VARCHAR(30), -- bebes, criancas_bem_pequenas, criancas_pequenas
    is_template BOOLEAN DEFAULT false,
    cor VARCHAR(7) DEFAULT '#6366F1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_atividades_user ON public.atividades(user_id);
CREATE INDEX IF NOT EXISTS idx_atividades_tipo ON public.atividades(tipo);

-- RLS
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "atividades_policy" ON public.atividades;
CREATE POLICY "atividades_policy" ON public.atividades
    FOR ALL USING (user_id = auth.uid() OR is_template = true);

-- ============================================
-- TABELA: planejamento_semanal
-- Planejamentos semanais por turma
-- ============================================
CREATE TABLE IF NOT EXISTS public.planejamento_semanal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    semana_inicio DATE NOT NULL, -- Segunda-feira da semana
    tema_semana VARCHAR(200),
    objetivos TEXT,
    status VARCHAR(20) DEFAULT 'rascunho', -- rascunho, ativo, concluido
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(turma_id, semana_inicio)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_planejamento_user ON public.planejamento_semanal(user_id);
CREATE INDEX IF NOT EXISTS idx_planejamento_turma ON public.planejamento_semanal(turma_id);
CREATE INDEX IF NOT EXISTS idx_planejamento_semana ON public.planejamento_semanal(semana_inicio);

-- RLS
ALTER TABLE public.planejamento_semanal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planejamento_policy" ON public.planejamento_semanal;
CREATE POLICY "planejamento_policy" ON public.planejamento_semanal
    FOR ALL USING (user_id = auth.uid());

-- ============================================
-- TABELA: atividades_planejadas
-- Atividades vinculadas aos dias da semana
-- ============================================
CREATE TABLE IF NOT EXISTS public.atividades_planejadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    planejamento_id UUID NOT NULL REFERENCES public.planejamento_semanal(id) ON DELETE CASCADE,
    atividade_id UUID REFERENCES public.atividades(id) ON DELETE SET NULL,
    
    -- Dados da atividade (copiados ou customizados)
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    duracao_minutos INTEGER DEFAULT 30,
    campos_bncc VARCHAR(20)[],
    cor VARCHAR(7) DEFAULT '#6366F1',
    
    -- Posição no calendário
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=dom, 1=seg..6=sab
    ordem INTEGER DEFAULT 0, -- Ordem no dia
    horario TIME,
    
    -- Status
    realizada BOOLEAN DEFAULT false,
    observacoes TEXT,
    registro_id UUID REFERENCES public.registros(id), -- Link com registro de evidência
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_atividades_planejadas_planejamento ON public.atividades_planejadas(planejamento_id);
CREATE INDEX IF NOT EXISTS idx_atividades_planejadas_dia ON public.atividades_planejadas(dia_semana);

-- RLS
ALTER TABLE public.atividades_planejadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "atividades_planejadas_policy" ON public.atividades_planejadas;
CREATE POLICY "atividades_planejadas_policy" ON public.atividades_planejadas
    FOR ALL USING (
        planejamento_id IN (
            SELECT id FROM public.planejamento_semanal WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- Trigger: updated_at
-- ============================================
CREATE TRIGGER update_atividades_updated_at
    BEFORE UPDATE ON public.atividades
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planejamento_updated_at
    BEFORE UPDATE ON public.planejamento_semanal
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- CONSTANTES: Tipos de atividade
-- ============================================
COMMENT ON TABLE public.atividades IS 'Tipos: dirigida, livre, roda, parque, arte, musica, culinaria, movimento, leitura, natureza';
