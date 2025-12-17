# 📋 Cronograma Detalhado - Educador Pro

> **Plano de execução semana a semana**

---

## 📅 Visão Geral do Cronograma

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                           2025 - DESENVOLVIMENTO EDUCADOR PRO                             │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                           │
│  JAN          FEV          MAR          ABR          MAI          JUN                    │
│  ════         ════         ════         ════         ════         ════                   │
│                                                                                           │
│  ┌─────────────────────────┐   ┌─────────────────┐   ┌─────────────────┐                │
│  │     FASE 1: FUNDAÇÃO    │   │ FASE 2: PLANEJ. │   │ FASE 3: PORTF.  │                │
│  │      8-10 semanas       │   │    6-8 semanas  │   │   6-8 semanas   │                │
│  └─────────────────────────┘   └─────────────────┘   └─────────────────┘                │
│                                                                                           │
│  S01 S02 S03 S04 S05 S06 S07 S08 S09 S10 S11 S12 S13 S14 S15 S16 S17 S18 S19 S20 S21 S22│
│                                                                                           │
│  ▓▓▓ Setup & Migração DB                                                                 │
│      ▓▓▓▓▓▓ Captura Rápida                                                               │
│            ▓▓▓▓▓▓ Timeline v2                                                            │
│                  ▓▓▓▓▓▓ Perfil Aluno                                                     │
│                        ▓▓▓▓ Marcos                                                       │
│                              ▓▓▓▓▓▓▓▓ Planejador                                         │
│                                      ▓▓▓▓ BNCC                                           │
│                                          ▓▓▓▓▓▓▓▓ Portfólio                              │
│                                                                                           │
│  JUL          AGO          SET          OUT          NOV          DEZ                    │
│  ════         ════         ════         ════         ════         ════                   │
│                                                                                           │
│  ┌─────────────────────────┐   ┌─────────────────┐                                       │
│  │    FASE 4: FAMÍLIAS     │   │  FASE 5: ANÁLISE│                                       │
│  │      6-8 semanas        │   │   4-5 semanas   │                                       │
│  └─────────────────────────┘   └─────────────────┘                                       │
│                                                                                           │
│  S23 S24 S25 S26 S27 S28 S29 S30 S31 S32 S33 S34 S35 S36 S37 S38 S39 S40               │
│                                                                                           │
│  ▓▓▓▓▓▓▓▓ Portal Família                                                                 │
│          ▓▓▓▓ Comunicação                                                                │
│              ▓▓▓▓▓▓ App Pais                                                             │
│                    ▓▓▓▓▓▓ Dashboard                                                      │
│                          ▓▓▓▓ Alertas & Métricas                                         │
│                                                                                           │
│  ════════════════════════════════════════════════════════════════════════════════════════│
│  MARCOS:  🚀 v2.0 Beta (Mar)    🚀 v2.1 (Jun)    🚀 v2.2 (Set)    🚀 v3.0 (Nov)         │
│                                                                                           │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 FASE 1: Fundação (Semanas 1-10)

### Semana 1-2: Setup e Infraestrutura

| Dia | Tarefa | Responsável | Status |
|-----|--------|-------------|--------|
| **Seg** | Criar branch `feature/v2` | Dev | ⬜ |
| **Seg** | Reorganizar estrutura de pastas | Dev | ⬜ |
| **Ter** | Executar migrações 001-003 no Supabase Staging | Dev | ⬜ |
| **Ter** | Configurar ambiente de staging | Dev | ⬜ |
| **Qua** | Atualizar RLS policies | Dev | ⬜ |
| **Qui** | Criar hooks básicos (useAlunos, useRegistros) | Dev | ⬜ |
| **Sex** | Testes de integração do banco | Dev | ⬜ |

**Entregável:** Ambiente staging com novo schema funcionando

---

### Semana 3-4: Captura Rápida

| Dia | Tarefa | Responsável | Status |
|-----|--------|-------------|--------|
| **Seg** | Design UI do componente de captura | Design | ⬜ |
| **Ter** | Componente `CameraCapture` | Dev | ⬜ |
| **Qua** | Componente `StudentSelector` com multi-select | Dev | ⬜ |
| **Qui** | Componente `VoiceDescription` + transcrição | Dev | ⬜ |
| **Sex** | Componente `ContextTags` | Dev | ⬜ |
| **Seg** | Integrar componentes no fluxo de registro | Dev | ⬜ |
| **Ter** | Testes E2E do fluxo de captura | Dev | ⬜ |
| **Qua** | Refinar UX baseado em testes | Dev | ⬜ |
| **Qui** | Documentar componentes | Dev | ⬜ |
| **Sex** | Code review e merge | Dev | ⬜ |

**Entregável:** Nova interface de captura rápida funcionando

---

### Semana 5-6: Timeline Avançada

| Dia | Tarefa | Responsável | Status |
|-----|--------|-------------|--------|
| **Seg** | Design dos filtros da timeline | Design | ⬜ |
| **Ter** | Refatorar `timeline-view.tsx` | Dev | ⬜ |
| **Qua** | Componente `TimelineFilters` | Dev | ⬜ |
| **Qui** | Filtro por aluno (dropdown multi-select) | Dev | ⬜ |
| **Sex** | Filtro por tipo de registro | Dev | ⬜ |
| **Seg** | Componente `DateRangePicker` | Dev | ⬜ |
| **Ter** | Busca por texto com debounce | Dev | ⬜ |
| **Qua** | Infinite scroll / paginação | Dev | ⬜ |
| **Qui** | Resumo semanal com IA (opcional) | Dev | ⬜ |
| **Sex** | Testes e refinamentos | Dev | ⬜ |

**Entregável:** Timeline com filtros avançados e busca

---

### Semana 7-8: Perfil Individual do Aluno

| Dia | Tarefa | Responsável | Status |
|-----|--------|-------------|--------|
| **Seg** | Design da página de perfil | Design | ⬜ |
| **Ter** | Criar rota `/alunos/[id]` | Dev | ⬜ |
| **Qua** | Componente `StudentHeader` | Dev | ⬜ |
| **Qui** | Componente `StudentGallery` | Dev | ⬜ |
| **Sex** | Componente `StudentTimeline` (individual) | Dev | ⬜ |
| **Seg** | Sub-página `/alunos/[id]/galeria` | Dev | ⬜ |
| **Ter** | Sub-página `/alunos/[id]/timeline` | Dev | ⬜ |
| **Qua** | Navegação entre sub-páginas | Dev | ⬜ |
| **Qui** | Testes | Dev | ⬜ |
| **Sex** | Refinamentos | Dev | ⬜ |

**Entregável:** Página de perfil individual completa

---

### Semana 9-10: Sistema de Marcos

| Dia | Tarefa | Responsável | Status |
|-----|--------|-------------|--------|
| **Seg** | Design do sistema de marcos | Design | ⬜ |
| **Ter** | Componente `MilestoneForm` | Dev | ⬜ |
| **Qua** | Componente `MilestonesList` | Dev | ⬜ |
| **Qui** | Vincular evidências (registros) ao marco | Dev | ⬜ |
| **Sex** | Componente `DevelopmentChart` (gráfico radar) | Dev | ⬜ |
| **Seg** | Integrar marcos no perfil do aluno | Dev | ⬜ |
| **Ter** | CRUD completo de marcos | Dev | ⬜ |
| **Qua** | Testes | Dev | ⬜ |
| **Qui** | Deploy para staging | Dev | ⬜ |
| **Sex** | **🚀 RELEASE v2.0 BETA** | Todos | ⬜ |

**Entregável:** Sistema de marcos funcionando + Deploy Beta

---

## 📅 FASE 2: Planejamento (Semanas 11-18)

### Semana 11-12: Estrutura do Planejador

| Dia | Tarefa | Responsável | Status |
|-----|--------|-------------|--------|
| **Seg** | Design do planejador semanal | Design | ⬜ |
| **Ter** | Executar migrações 004-005 | Dev | ⬜ |
| **Qua** | Criar rota `/planejamento` | Dev | ⬜ |
| **Qui** | Componente `WeeklyCalendar` (grid) | Dev | ⬜ |
| **Sex** | Navegação entre semanas | Dev | ⬜ |
| **Seg** | Visualização de dias com slots | Dev | ⬜ |
| **Ter** | Estilização do calendário | Dev | ⬜ |
| **Qua** | Testes básicos | Dev | ⬜ |

---

### Semana 13-14: Banco de Atividades

| Dia | Tarefa | Responsável | Status |
|-----|--------|-------------|--------|
| **Seg** | Design do banco de atividades | Design | ⬜ |
| **Ter** | Rota `/planejamento/atividades` | Dev | ⬜ |
| **Qua** | Componente `ActivityForm` | Dev | ⬜ |
| **Qui** | Componente `ActivityCard` | Dev | ⬜ |
| **Sex** | CRUD de atividades | Dev | ⬜ |
| **Seg** | Busca e filtros de atividades | Dev | ⬜ |
| **Ter** | Templates de atividades pré-definidas | Dev | ⬜ |
| **Qua** | Testes | Dev | ⬜ |

---

### Semana 15-16: Drag & Drop + BNCC

| Dia | Tarefa | Responsável | Status |
|-----|--------|-------------|--------|
| **Seg** | Implementar drag & drop (dnd-kit) | Dev | ⬜ |
| **Ter** | Arrastar atividade para dia | Dev | ⬜ |
| **Qua** | Reordenar atividades no dia | Dev | ⬜ |
| **Qui** | Componente `BnccSelector` | Dev | ⬜ |
| **Sex** | Vincular atividade a campos BNCC | Dev | ⬜ |
| **Seg** | Visualização de cobertura BNCC | Dev | ⬜ |
| **Ter** | Seed de dados BNCC completo | Dev | ⬜ |
| **Qua** | Testes integração BNCC | Dev | ⬜ |

---

### Semana 17-18: Execução e IA

| Dia | Tarefa | Responsável | Status |
|-----|--------|-------------|--------|
| **Seg** | Marcar atividade como realizada | Dev | ⬜ |
| **Ter** | Vincular registro a atividade | Dev | ⬜ |
| **Qua** | Componente `AiSuggestions` | Dev | ⬜ |
| **Qui** | Integração com Gemini para sugestões | Dev | ⬜ |
| **Sex** | Duplicar semana anterior | Dev | ⬜ |
| **Seg** | Testes E2E completos | Dev | ⬜ |
| **Ter** | Refinamentos UX | Dev | ⬜ |
| **Qua** | Deploy para staging | Dev | ⬜ |
| **Qui** | Testes com usuários beta | Todos | ⬜ |
| **Sex** | **🚀 RELEASE v2.1** | Todos | ⬜ |

**Entregável:** Sistema de planejamento completo

---

## 🎨 FASE 3: Portfólio (Semanas 19-26)

### Semana 19-20: Estrutura do Portfólio

| Tarefa | Estimativa |
|--------|-----------|
| Executar migração 006 | 1d |
| Design do builder de portfólio | 2d |
| Criar rotas `/portfolios` | 1d |
| Componente `PortfolioBuilder` | 3d |
| Lista de portfólios existentes | 2d |
| Criar novo portfólio | 1d |

---

### Semana 21-22: Editor de Seções

| Tarefa | Estimativa |
|--------|-----------|
| Componente `SectionEditor` | 3d |
| Seção tipo "capa" | 1d |
| Seção tipo "galeria" | 2d |
| Seção tipo "texto" | 1d |
| Seção tipo "evolução" | 2d |
| Reordenar seções (drag) | 1d |

---

### Semana 23-24: Templates e IA

| Tarefa | Estimativa |
|--------|-----------|
| Componente `TemplateGallery` | 2d |
| Criar 3 templates visuais | 3d |
| Seleção automática de registros (IA) | 3d |
| Geração de texto de apresentação (IA) | 2d |

---

### Semana 25-26: Exportação e Compartilhamento

| Tarefa | Estimativa |
|--------|-----------|
| Componente `PdfExporter` | 3d |
| Geração de PDF high-quality | 2d |
| Sistema de share token | 1d |
| Página pública `/share/[token]` | 2d |
| Testes e deploy | 2d |
| **🚀 RELEASE v2.2** | - |

---

## 👨‍👩‍👧 FASE 4: Famílias (Semanas 27-34)

### Semana 27-28: Auth Família

| Tarefa | Estimativa |
|--------|-----------|
| Executar migração 007 | 1d |
| Sistema de convites por email | 2d |
| Página de aceite de convite | 1d |
| Login separado para famílias | 2d |
| Vincular família a alunos | 2d |
| Testes de auth | 2d |

---

### Semana 29-30: Portal Família

| Tarefa | Estimativa |
|--------|-----------|
| Design do portal família | 2d |
| Rotas `/familia/*` | 1d |
| Home do portal (feed) | 2d |
| Galeria de fotos compartilhadas | 2d |
| Perfil do filho (view only) | 2d |
| Testes | 1d |

---

### Semana 31-32: Comunicação

| Tarefa | Estimativa |
|--------|-----------|
| Sistema de comunicados | 2d |
| Editor de comunicados (professor) | 2d |
| Visualização de comunicados (família) | 1d |
| Agenda de eventos | 2d |
| Marcar como lido | 1d |
| Testes | 2d |

---

### Semana 33-34: Chat e Notificações

| Tarefa | Estimativa |
|--------|-----------|
| Sistema de chat professor-família | 3d |
| Notificações in-app | 2d |
| Notificações push (Web Push API) | 2d |
| Email digest semanal | 1d |
| Testes E2E completos | 2d |

---

## 📊 FASE 5: Análise (Semanas 35-40)

### Semana 35-36: Dashboard

| Tarefa | Estimativa |
|--------|-----------|
| Executar migração 008 | 1d |
| Redesign do dashboard | 2d |
| Cards de estatísticas | 2d |
| Gráfico de atividade mensal | 2d |
| Visão geral dos alunos | 2d |
| Testes | 1d |

---

### Semana 37-38: Alertas e Insights

| Tarefa | Estimativa |
|--------|-----------|
| Sistema de geração de alertas | 2d |
| Alerta: aluno sem registro | 1d |
| Alerta: BNCC baixa cobertura | 1d |
| Alerta: parecer pendente | 1d |
| Painel de alertas no dashboard | 2d |
| Marcar alertas como resolvidos | 1d |
| Testes | 2d |

---

### Semana 39-40: Relatórios e Polish

| Tarefa | Estimativa |
|--------|-----------|
| Relatório mensal automático | 2d |
| Exportar relatórios (PDF) | 2d |
| Performance optimization | 2d |
| Bug fixes finais | 2d |
| Documentação de usuário | 1d |
| **🚀 RELEASE v3.0 FINAL** | - |

---

## 📈 Marcos e Milestones

| Data | Marco | Descrição |
|------|-------|-----------|
| **Mar 2025** | 🚀 v2.0 Beta | Captura + Timeline + Perfil + Marcos |
| **Jun 2025** | 🚀 v2.1 | + Planejamento + BNCC |
| **Set 2025** | 🚀 v2.2 | + Portfólio Digital |
| **Nov 2025** | 🚀 v3.0 | + Portal Família + Dashboard |

---

## 🎯 KPIs por Fase

### Fase 1
- [ ] Tempo de criação de registro < 30s
- [ ] 100% dos alunos podem ser filtrados na timeline
- [ ] Perfil do aluno com todas as informações integradas

### Fase 2
- [ ] Planejamento semanal em < 15 minutos
- [ ] 100% das atividades vinculáveis à BNCC
- [ ] Sugestões de IA relevantes em 80% dos casos

### Fase 3
- [ ] Portfólio gerado em < 10 minutos
- [ ] PDF de alta qualidade gerado sem erros
- [ ] Link de compartilhamento funcional

### Fase 4
- [ ] 70% das famílias convidadas aceitam
- [ ] Comunicados lidos em < 24h por 80% das famílias
- [ ] Chat com resposta média < 4h

### Fase 5
- [ ] Dashboard carrega em < 2s
- [ ] Alertas gerados automaticamente em 100% dos casos
- [ ] NPS geral > 60

---

## 📞 Reuniões e Cerimônias

| Tipo | Frequência | Duração | Participantes |
|------|------------|---------|---------------|
| **Daily** | Diária | 15min | Dev Team |
| **Sprint Planning** | Quinzenal | 2h | Todos |
| **Sprint Review** | Quinzenal | 1h | Todos + Stakeholders |
| **Retrospectiva** | Quinzenal | 1h | Dev Team |
| **Demo Usuários** | Mensal | 1h | Todos + Usuários Beta |

---

*Documento atualizado em: Dezembro 2024*
*Versão: 1.0*
