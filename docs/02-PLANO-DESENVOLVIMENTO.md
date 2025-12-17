# 🗺️ Plano de Desenvolvimento - Educador Pro

> **Roadmap técnico completo para transformar o Parecer Fácil em Educador Pro**

---

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Fases de Desenvolvimento](#fases-de-desenvolvimento)
3. [Detalhamento Técnico](#detalhamento-técnico)
4. [Cronograma](#cronograma)
5. [Stack Tecnológico](#stack-tecnológico)
6. [Estimativas de Esforço](#estimativas-de-esforço)

---

## 🎯 Visão Geral

### Estado Atual (Parecer Fácil v1)

O que já temos funcionando:
- ✅ Sistema de autenticação (email/senha + Google)
- ✅ Gerenciamento de turmas e alunos
- ✅ Gravação e upload de áudio
- ✅ Integração com n8n para processamento IA
- ✅ Geração de pareceres com IA
- ✅ Editor de texto rico (TinyMCE)
- ✅ Exportação para Word
- ✅ Linha do tempo básica
- ✅ Registro de fotos/vídeos/áudios/textos
- ✅ Importação de alunos via Excel
- ✅ Realtime com Supabase

### Estado Desejado (Educador Pro v2)

O que queremos construir:
- 🔲 Captura rápida mobile-first
- 🔲 Linha do tempo avançada com filtros
- 🔲 Perfil individual completo do aluno
- 🔲 Planejador pedagógico com BNCC
- 🔲 Portfólio digital automático
- 🔲 Portal para famílias
- 🔲 Dashboard de análise
- 🔲 App móvel (PWA avançado)

---

## 📅 Fases de Desenvolvimento

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROADMAP DE DESENVOLVIMENTO                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FASE 1          FASE 2          FASE 3          FASE 4          FASE 5    │
│  Fundação        Planejamento    Portfólio       Famílias        Análise   │
│  ━━━━━━━━        ━━━━━━━━━━━━    ━━━━━━━━━       ━━━━━━━━        ━━━━━━━   │
│  2-3 meses       2 meses         2 meses         2 meses         1 mês     │
│                                                                              │
│  • Captura       • Plano         • Seleção       • App Pais      • Dashb.  │
│    Rápida          Semanal         Automática    • Chat          • Alertas │
│  • Linha do      • Banco         • Templates     • Agenda        • Relat.  │
│    Tempo           Atividades    • Exportação    • Notificar     • Métric. │
│  • Perfil        • BNCC          • Comparativo                             │
│    Aluno         • Sugestões                                                │
│  • Marcos          IA                                                       │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  JAN   FEV   MAR   ABR   MAI   JUN   JUL   AGO   SET   OUT   NOV   DEZ     │
│  2025                                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 FASE 1: Fundação (8-10 semanas)

### Objetivo
Aprimorar a experiência de captura e visualização de registros, criando uma base sólida para as demais funcionalidades.

### 1.1 Captura Rápida Melhorada

#### Épico: Registro em Segundos

| User Story | Prioridade | Estimativa |
|------------|------------|------------|
| Como professor, quero tirar foto e marcar alunos rapidamente | Alta | 3 dias |
| Como professor, quero adicionar descrição por voz | Alta | 2 dias |
| Como professor, quero acessar a câmera direto da home | Média | 2 dias |
| Como professor, quero selecionar múltiplos alunos de uma vez | Alta | 1 dia |
| Como professor, quero adicionar tags de contexto | Média | 2 dias |

#### Tarefas Técnicas

```
📁 src/components/
├── captura-rapida/
│   ├── camera-capture.tsx      # Componente de câmera
│   ├── voice-description.tsx   # Gravação de descrição
│   ├── student-selector.tsx    # Seleção múltipla de alunos
│   ├── context-tags.tsx        # Tags de contexto
│   └── quick-save-button.tsx   # Botão de salvar rápido
```

**Alterações no Banco de Dados:**
```sql
-- Adicionar tags de contexto
CREATE TABLE contextos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    icone VARCHAR(50),
    cor VARCHAR(7),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar contexto aos registros
ALTER TABLE registros ADD COLUMN contexto_id UUID REFERENCES contextos(id);

-- Adicionar descrição por voz transcrita
ALTER TABLE registros ADD COLUMN transcricao_voz TEXT;
```

---

### 1.2 Linha do Tempo Avançada

#### Épico: Visualização e Busca

| User Story | Prioridade | Estimativa |
|------------|------------|------------|
| Como professor, quero filtrar registros por aluno | Alta | 2 dias |
| Como professor, quero filtrar por tipo de registro | Alta | 1 dia |
| Como professor, quero filtrar por período de datas | Alta | 2 dias |
| Como professor, quero buscar por texto nas descrições | Média | 3 dias |
| Como professor, quero ver resumo automático da semana | Baixa | 3 dias |

#### Tarefas Técnicas

```
📁 src/app/turmas/[id]/
├── page.tsx                    # Página atual (refatorar)
├── components/
│   ├── timeline/
│   │   ├── timeline-view.tsx       # Container principal
│   │   ├── timeline-filters.tsx    # Barra de filtros
│   │   ├── timeline-item.tsx       # Item individual
│   │   ├── timeline-date-picker.tsx # Seletor de período
│   │   ├── timeline-search.tsx     # Busca por texto
│   │   └── timeline-summary.tsx    # Resumo semanal (IA)
```

---

### 1.3 Perfil Individual do Aluno

#### Épico: Tudo Sobre o Aluno

| User Story | Prioridade | Estimativa |
|------------|------------|------------|
| Como professor, quero ver todos os dados do aluno em uma tela | Alta | 3 dias |
| Como professor, quero ver a galeria de fotos do aluno | Alta | 2 dias |
| Como professor, quero ver a timeline individual | Alta | 2 dias |
| Como professor, quero registrar marcos de desenvolvimento | Média | 3 dias |
| Como professor, quero ver gráfico de desenvolvimento | Baixa | 4 dias |

#### Estrutura de Páginas

```
📁 src/app/alunos/[id]/
├── page.tsx                    # Perfil principal
├── galeria/page.tsx            # Galeria de fotos
├── timeline/page.tsx           # Timeline individual
├── marcos/page.tsx             # Marcos de desenvolvimento
├── pareceres/page.tsx          # Histórico de pareceres
└── components/
    ├── student-header.tsx
    ├── development-chart.tsx
    ├── milestones-list.tsx
    ├── student-gallery.tsx
    └── student-timeline.tsx
```

**Alterações no Banco de Dados:**
```sql
-- Tabela de marcos de desenvolvimento
CREATE TABLE marcos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    area_desenvolvimento VARCHAR(50), -- motor_fino, motor_grosso, linguagem, social, autonomia
    data_marco DATE NOT NULL,
    evidencias_ids UUID[], -- IDs de registros relacionados
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de áreas de desenvolvimento para tracking
CREATE TABLE desenvolvimento_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
    area VARCHAR(50) NOT NULL,
    nivel INTEGER DEFAULT 0, -- 0-100
    periodo VARCHAR(20) NOT NULL, -- "2024-B1", "2024-B2"
    observacoes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 1.4 Entregáveis da Fase 1

| Entregável | Descrição | Critério de Aceite |
|------------|-----------|-------------------|
| Captura Rápida | Nova interface de registro | Registro criado em < 30s |
| Timeline Avançada | Filtros e busca funcionando | Encontrar registro em < 30s |
| Perfil do Aluno | Página completa implementada | Todas as informações visíveis |
| Marcos | Sistema de marcos funcionando | Criar e visualizar marcos |

---

## 📅 FASE 2: Planejamento (6-8 semanas)

### Objetivo
Criar um sistema de planejamento pedagógico integrado com a BNCC e sugestões inteligentes.

### 2.1 Planejador Semanal

#### Épico: Planejar a Semana

| User Story | Prioridade | Estimativa |
|------------|------------|------------|
| Como professor, quero ver minha semana em formato visual | Alta | 4 dias |
| Como professor, quero arrastar atividades para os dias | Alta | 3 dias |
| Como professor, quero criar atividades personalizadas | Alta | 2 dias |
| Como professor, quero marcar atividades como realizadas | Média | 1 dia |
| Como professor, quero duplicar semanas anteriores | Média | 2 dias |

#### Estrutura Técnica

```
📁 src/app/planejamento/
├── page.tsx                    # Visão semanal
├── [semana]/page.tsx           # Semana específica
├── atividades/page.tsx         # Banco de atividades
└── components/
    ├── weekly-calendar.tsx     # Calendário drag-drop
    ├── activity-card.tsx       # Card de atividade
    ├── activity-form.tsx       # Formulário de atividade
    ├── bncc-selector.tsx       # Seletor de campos BNCC
    └── week-summary.tsx        # Resumo da semana
```

**Banco de Dados:**
```sql
-- Tabela de atividades (banco de atividades)
CREATE TABLE atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    duracao_minutos INTEGER,
    materiais TEXT[],
    campos_bncc VARCHAR(20)[], -- ["EI01ET01", "EI02EO03"]
    tipo VARCHAR(50), -- dirigida, livre, roda, etc
    is_template BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de planejamento semanal
CREATE TABLE planejamento_semanal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    turma_id UUID REFERENCES turmas(id),
    semana_inicio DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'rascunho', -- rascunho, ativo, concluido
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de atividades planejadas
CREATE TABLE atividades_planejadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planejamento_id UUID REFERENCES planejamento_semanal(id) ON DELETE CASCADE,
    atividade_id UUID REFERENCES atividades(id),
    dia_semana INTEGER NOT NULL, -- 0=domingo, 1=segunda, etc
    horario TIME,
    realizada BOOLEAN DEFAULT false,
    observacoes TEXT,
    registro_id UUID REFERENCES registros(id) -- link com registro
);
```

---

### 2.2 Integração BNCC

#### Épico: Campos de Experiência

| User Story | Prioridade | Estimativa |
|------------|------------|------------|
| Como professor, quero ver os campos BNCC para Ed. Infantil | Alta | 2 dias |
| Como professor, quero vincular atividades a campos BNCC | Alta | 2 dias |
| Como professor, quero ver cobertura de BNCC na semana | Média | 3 dias |
| Como professor, quero ver alertas de campos não trabalhados | Média | 2 dias |

**Dados BNCC:**
```sql
-- Tabela de campos de experiência BNCC
CREATE TABLE bncc_campos (
    codigo VARCHAR(20) PRIMARY KEY,
    campo VARCHAR(100) NOT NULL, -- "O eu, o outro e o nós"
    faixa_etaria VARCHAR(20) NOT NULL, -- "creche", "pre-escola"
    objetivo TEXT NOT NULL,
    palavras_chave TEXT[]
);

-- Inserir campos BNCC Ed. Infantil
INSERT INTO bncc_campos VALUES
('EI01EO01', 'O eu, o outro e o nós', 'creche', 'Perceber que suas ações têm efeitos nas outras crianças...', ARRAY['interação', 'emoções']),
('EI01EO02', 'O eu, o outro e o nós', 'creche', 'Perceber as possibilidades e os limites de seu corpo...', ARRAY['corpo', 'movimento']),
-- ... todos os códigos
```

---

### 2.3 Sugestões IA

#### Épico: IA como Assistente

| User Story | Prioridade | Estimativa |
|------------|------------|------------|
| Como professor, quero receber sugestões baseadas nos registros | Média | 5 dias |
| Como professor, quero IA sugerindo atividades para campos menos trabalhados | Baixa | 3 dias |

---

## 📦 FASE 3: Portfólio (6-8 semanas)

### Objetivo
Gerar automaticamente portfólios bonitos e profissionais para cada aluno.

### 3.1 Geração de Portfólio

| User Story | Prioridade | Estimativa |
|------------|------------|------------|
| Como professor, quero gerar portfólio de um aluno | Alta | 5 dias |
| Como professor, quero que IA selecione melhores registros | Média | 4 dias |
| Como professor, quero escolher entre templates | Alta | 3 dias |
| Como professor, quero personalizar seções | Média | 3 dias |
| Como professor, quero exportar PDF de alta qualidade | Alta | 4 dias |
| Como professor, quero compartilhar link com família | Média | 2 dias |

#### Estrutura Técnica

```
📁 src/app/portfolio/
├── page.tsx                    # Lista de portfólios
├── [id]/page.tsx               # Editor de portfólio
├── [id]/preview/page.tsx       # Pré-visualização
├── [id]/share/[token]/page.tsx # Link público para família
└── components/
    ├── portfolio-builder.tsx
    ├── section-editor.tsx
    ├── template-gallery.tsx
    ├── media-selector.tsx
    └── pdf-exporter.tsx
```

**Banco de Dados:**
```sql
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
    titulo VARCHAR(200),
    periodo VARCHAR(50), -- "2024", "2024-S1"
    template VARCHAR(50) DEFAULT 'moderno',
    secoes JSONB, -- estrutura das seções
    status VARCHAR(20) DEFAULT 'rascunho',
    share_token VARCHAR(100) UNIQUE,
    share_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portfolio_secoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- capa, apresentacao, galeria, texto, evolucao
    titulo VARCHAR(200),
    conteudo JSONB,
    ordem INTEGER NOT NULL
);
```

---

## 👨‍👩‍👧 FASE 4: Portal Famílias (6-8 semanas)

### Objetivo
Criar um portal onde as famílias acompanham o dia a dia do filho na escola.

### 4.1 App/Portal para Pais

| User Story | Prioridade | Estimativa |
|------------|------------|------------|
| Como pai, quero ver fotos e atividades do meu filho | Alta | 5 dias |
| Como pai, quero receber notificações de novos registros | Alta | 3 dias |
| Como pai, quero ver a agenda de eventos | Média | 2 dias |
| Como pai, quero receber comunicados da escola | Alta | 2 dias |
| Como pai, quero enviar mensagens para a professora | Média | 4 dias |
| Como pai, quero ver relatórios mensais | Baixa | 3 dias |

#### Estrutura Técnica

```
📁 src/app/familia/
├── page.tsx                    # Home do portal família
├── auth/page.tsx               # Login diferenciado
├── [aluno]/page.tsx            # Perfil do filho
├── [aluno]/galeria/page.tsx    # Fotos compartilhadas
├── [aluno]/agenda/page.tsx     # Eventos
├── [aluno]/mensagens/page.tsx  # Chat com professor
└── components/
    ├── family-header.tsx
    ├── activity-feed.tsx
    ├── event-calendar.tsx
    ├── message-thread.tsx
    └── monthly-summary.tsx
```

**Banco de Dados:**
```sql
-- Contas de família (vinculadas a alunos)
CREATE TABLE familia_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(200),
    alunos_ids UUID[] NOT NULL, -- Pode ter vários filhos
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensagens entre família e professor
CREATE TABLE mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID REFERENCES alunos(id),
    remetente_type VARCHAR(20) NOT NULL, -- 'professor' ou 'familia'
    remetente_id UUID NOT NULL,
    conteudo TEXT NOT NULL,
    lida BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comunicados
CREATE TABLE comunicados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID REFERENCES turmas(id),
    titulo VARCHAR(200) NOT NULL,
    conteudo TEXT NOT NULL,
    tipo VARCHAR(50), -- geral, evento, urgente
    data_evento DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registros compartilhados com família
ALTER TABLE registros ADD COLUMN compartilhar_familia BOOLEAN DEFAULT false;
```

---

## 📊 FASE 5: Dashboard e Análise (4-5 semanas)

### Objetivo
Fornecer insights acionáveis sobre a turma e o trabalho do professor.

### 5.1 Dashboard

| User Story | Prioridade | Estimativa |
|------------|------------|------------|
| Como professor, quero ver resumo da minha turma | Alta | 3 dias |
| Como professor, quero alertas sobre alunos sem registro | Alta | 2 dias |
| Como professor, quero ver cobertura de BNCC | Média | 2 dias |
| Como professor, quero ver minha produtividade | Baixa | 2 dias |

#### Estrutura Técnica

```
📁 src/app/dashboard/
├── page.tsx                    # Dashboard principal (refatorar)
└── components/
    ├── stats-cards.tsx         # Cards de estatísticas
    ├── alerts-panel.tsx        # Painel de alertas
    ├── bncc-coverage.tsx       # Cobertura BNCC
    ├── activity-chart.tsx      # Gráfico de atividade
    └── student-overview.tsx    # Visão geral dos alunos
```

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnologia | Uso | Status |
|------------|-----|--------|
| Next.js 16 | Framework React | ✅ Já usando |
| React 19 | Biblioteca UI | ✅ Já usando |
| Tailwind CSS 4 | Estilização | ✅ Já usando |
| shadcn/ui | Componentes | ✅ Já usando |
| TinyMCE | Editor rico | ✅ Já usando |
| Framer Motion | Animações | 🔲 Adicionar |
| React Query | Cache/Estado | 🔲 Adicionar |

### Backend
| Tecnologia | Uso | Status |
|------------|-----|--------|
| Supabase | Database + Auth + Storage + Realtime | ✅ Já usando |
| n8n | Automação/Workflows | ✅ Já usando |
| Edge Functions | APIs serverless | 🔲 Considerar |

### IA/ML
| Tecnologia | Uso | Status |
|------------|-----|--------|
| Google Gemini | Geração de texto | ✅ Já usando |
| Whisper (OpenAI) | Transcrição de áudio | 🔲 Adicionar |
| Claude | Alternativa de texto | ✅ Já usando |

### Mobile
| Tecnologia | Uso | Status |
|------------|-----|--------|
| PWA | App instalável | 🔲 Melhorar |
| Capacitor | App nativo | 🔲 Considerar futuro |

---

## ⏱️ Estimativas de Esforço

### Por Fase

| Fase | Semanas | Story Points | Features |
|------|---------|--------------|----------|
| Fase 1 - Fundação | 8-10 | 85 | 15 |
| Fase 2 - Planejamento | 6-8 | 65 | 12 |
| Fase 3 - Portfólio | 6-8 | 55 | 8 |
| Fase 4 - Famílias | 6-8 | 70 | 10 |
| Fase 5 - Análise | 4-5 | 35 | 6 |
| **TOTAL** | **30-39** | **310** | **51** |

### Por Tipo de Trabalho

| Tipo | Porcentagem | Horas Estimadas |
|------|-------------|-----------------|
| Frontend | 45% | ~400h |
| Backend/DB | 25% | ~220h |
| IA/Integrações | 15% | ~130h |
| Design/UX | 10% | ~90h |
| Testes/QA | 5% | ~45h |
| **TOTAL** | **100%** | **~885h** |

---

## 📋 Próximos Passos Imediatos

### Semana 1-2: Setup

- [ ] Criar branch `feature/educador-pro-v2`
- [ ] Atualizar estrutura de pastas
- [ ] Criar migrações de banco de dados
- [ ] Configurar ambiente de staging

### Semana 3-4: Captura Rápida

- [ ] Implementar novo componente de câmera
- [ ] Implementar seleção múltipla de alunos
- [ ] Implementar tags de contexto
- [ ] Implementar descrição por voz

### Semana 5-6: Timeline

- [ ] Refatorar componente de timeline
- [ ] Implementar filtros
- [ ] Implementar busca por texto
- [ ] Implementar seletor de período

### Semana 7-8: Perfil do Aluno

- [ ] Criar página de perfil
- [ ] Implementar galeria individual
- [ ] Implementar sistema de marcos
- [ ] Implementar gráfico de desenvolvimento

---

## 🔄 Processo de Desenvolvimento

### Metodologia
- **Sprints de 2 semanas**
- **Daily standups** (se equipe > 1)
- **Code review** obrigatório
- **Testes automatizados** para críticos

### Git Flow
```
main
  └── develop
        ├── feature/captura-rapida
        ├── feature/timeline-v2
        ├── feature/perfil-aluno
        └── ...
```

### CI/CD
- Push para `develop` → Deploy automático em staging
- Merge para `main` → Deploy automático em produção

---

*Documento atualizado em: Dezembro 2024*
*Versão: 1.0*
