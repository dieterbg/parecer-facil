/**
 * Tipos do Banco de Dados - Educador Pro
 * Baseado no schema do Supabase
 */

// ============================================
// ENUMS
// ============================================

export type TipoRegistro = 'foto' | 'video' | 'audio' | 'texto';

export type AreaDesenvolvimento =
    | 'motor_fino'
    | 'motor_grosso'
    | 'linguagem_oral'
    | 'linguagem_escrita'
    | 'matematica'
    | 'social_emocional'
    | 'autonomia'
    | 'criatividade'
    | 'cognitivo';

export type StatusParecer = 'pendente' | 'processando' | 'concluido' | 'erro';

// ============================================
// TABELAS
// ============================================

export interface Professor {
    id: string;
    uid: string;
    nome: string | null;
    email: string | null;
    estilo_escrita: string | null;
    paginas_esperadas: number;
    created_at: string;
}

export interface Turma {
    id: string;
    user_id: string;
    nome: string;
    ano_letivo: string;
    escola: string | null;
    descricao: string | null;
    cor: string;
    ativa: boolean;
    created_at: string;
    updated_at: string;
}

export interface Aluno {
    id: string;
    turma_id: string;
    nome: string;
    data_nascimento: string | null;
    observacoes: string | null;
    foto_url: string | null;
    ativo: boolean;
    created_at: string;
    updated_at: string;
}

export interface Contexto {
    id: string;
    user_id: string | null;
    nome: string;
    icone: string;
    cor: string;
    is_default: boolean;
    ordem: number;
    created_at: string;
}

export interface Registro {
    id: string;
    tipo: TipoRegistro;
    url_arquivo: string | null;
    descricao: string | null;
    transcricao_voz: string | null;
    tags_bncc: string[] | null;
    ai_metadata: Record<string, any> | null;
    contexto_id: string | null;
    compartilhar_familia: boolean;
    is_evidencia: boolean;
    data_registro: string;
    created_by: string | null;
    created_at: string;
}

export interface RegistroAluno {
    id: string;
    registro_id: string;
    aluno_id: string;
    created_at: string;
}

export interface Marco {
    id: string;
    aluno_id: string;
    titulo: string;
    descricao: string | null;
    area: AreaDesenvolvimento;
    data_marco: string;
    evidencias_ids: string[] | null;
    created_by: string | null;
    created_at: string;
}

export interface DesenvolvimentoTracking {
    id: string;
    aluno_id: string;
    area: AreaDesenvolvimento;
    nivel: number;
    periodo: string;
    observacoes: string | null;
    created_by: string | null;
    updated_at: string;
}

export interface RegistroComAlunos extends Registro {
    alunos: Aluno[];
    contexto?: Contexto | null;
}

export interface RegistroComDetalhes extends Registro {
    registros_alunos: {
        aluno: Aluno;
    }[];
    contexto?: Contexto | null;
}

export interface MarcoComAluno extends Marco {
    aluno: Aluno;
}

export interface Parecer {
    id: string;
    aluno_id: string;
    turma_id: string;
    conteudo_gerado: string;
    conteudo_editado: string | null;
    status: StatusParecer;
    referencia_periodo: string | null;
    created_at: string;
    updated_at: string;
}

export interface TurmaComAlunos extends Turma {
    alunos: Aluno[];
    _count?: {
        alunos: number;
    };
}

// ============================================
// TIPOS PARA FORMULÁRIOS (Insert/Update)
// ============================================

export interface TurmaInsert {
    nome: string;
    ano_letivo?: string;
    escola?: string;
    descricao?: string;
    cor?: string;
}

export interface TurmaUpdate extends Partial<TurmaInsert> { }

export interface AlunoInsert {
    turma_id: string;
    nome: string;
    data_nascimento?: string;
    observacoes?: string;
    foto_url?: string;
}

export interface AlunoUpdate extends Partial<Omit<AlunoInsert, 'turma_id'>> { }

export interface RegistroInsert {
    tipo: TipoRegistro;
    url_arquivo?: string;
    descricao?: string;
    transcricao_voz?: string;
    tags_bncc?: string[];
    contexto_id?: string;
    compartilhar_familia?: boolean;
    is_evidencia?: boolean;
    data_registro?: string;
}

export interface MarcoInsert {
    aluno_id: string;
    titulo: string;
    descricao?: string;
    area: AreaDesenvolvimento;
    data_marco?: string;
    evidencias_ids?: string[];
}

export interface MarcoUpdate extends Partial<Omit<MarcoInsert, 'aluno_id'>> { }

// ============================================
// CONSTANTES E HELPERS
// ============================================

export const AREAS_DESENVOLVIMENTO: Record<AreaDesenvolvimento, string> = {
    motor_fino: 'Coordenação Motora Fina',
    motor_grosso: 'Coordenação Motora Grossa',
    linguagem_oral: 'Linguagem Oral',
    linguagem_escrita: 'Linguagem Escrita',
    matematica: 'Pensamento Matemático',
    social_emocional: 'Desenvolvimento Socioemocional',
    autonomia: 'Autonomia',
    criatividade: 'Criatividade e Imaginação',
    cognitivo: 'Desenvolvimento Cognitivo',
};

export const AREAS_CORES: Record<AreaDesenvolvimento, string> = {
    motor_fino: '#F59E0B',
    motor_grosso: '#EF4444',
    linguagem_oral: '#3B82F6',
    linguagem_escrita: '#6366F1',
    matematica: '#10B981',
    social_emocional: '#EC4899',
    autonomia: '#8B5CF6',
    criatividade: '#F472B6',
    cognitivo: '#06B6D4',
};

export const AREAS_ICONES: Record<AreaDesenvolvimento, string> = {
    motor_fino: '✏️',
    motor_grosso: '🏃',
    linguagem_oral: '🗣️',
    linguagem_escrita: '📝',
    matematica: '🔢',
    social_emocional: '💜',
    autonomia: '🌟',
    criatividade: '🎨',
    cognitivo: '🧠',
};

export const TIPOS_REGISTRO: Record<TipoRegistro, { label: string; icon: string }> = {
    foto: { label: 'Foto', icon: '📸' },
    video: { label: 'Vídeo', icon: '🎬' },
    audio: { label: 'Áudio', icon: '🎙️' },
    texto: { label: 'Texto', icon: '✏️' },
};

// Helper para calcular idade a partir da data de nascimento
export function calcularIdade(dataNascimento: string | null): string {
    if (!dataNascimento) return '';

    const nascimento = new Date(dataNascimento);
    const hoje = new Date();

    let anos = hoje.getFullYear() - nascimento.getFullYear();
    let meses = hoje.getMonth() - nascimento.getMonth();

    if (meses < 0) {
        anos--;
        meses += 12;
    }

    if (hoje.getDate() < nascimento.getDate()) {
        meses--;
        if (meses < 0) {
            anos--;
            meses += 12;
        }
    }

    if (anos === 0) {
        return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
    }

    if (meses === 0) {
        return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
    }

    return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
}

// Helper para formatar data no formato brasileiro
export function formatarData(data: string | null): string {
    if (!data) return '';
    return new Date(data).toLocaleDateString('pt-BR');
}

// Helper para formatar data e hora
export function formatarDataHora(data: string | null): string {
    if (!data) return '';
    return new Date(data).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// ============================================
// FASE 2: PLANEJAMENTO E BNCC
// ============================================

export type FaixaEtariaBncc = 'bebes' | 'criancas_bem_pequenas' | 'criancas_pequenas';

export type CampoExperienciaBncc =
    | 'O eu, o outro e o nós'
    | 'Corpo, gestos e movimentos'
    | 'Traços, sons, cores e formas'
    | 'Escuta, fala, pensamento e imaginação'
    | 'Espaços, tempos, quantidades, relações e transformações';

export type TipoAtividade =
    | 'dirigida' | 'livre' | 'roda' | 'parque'
    | 'arte' | 'musica' | 'culinaria' | 'movimento'
    | 'leitura' | 'natureza';

export type StatusPlanejamento = 'rascunho' | 'ativo' | 'concluido';

export interface BnccCampo {
    codigo: string;
    campo: CampoExperienciaBncc;
    faixa_etaria: FaixaEtariaBncc;
    objetivo: string;
    palavras_chave: string[] | null;
}

export interface Atividade {
    id: string;
    user_id: string;
    titulo: string;
    descricao: string | null;
    duracao_minutos: number;
    materiais: string[] | null;
    campos_bncc: string[] | null;
    tipo: TipoAtividade;
    faixa_etaria: FaixaEtariaBncc | null;
    is_template: boolean;
    cor: string;
    created_at: string;
    updated_at: string;
}

export interface PlanejamentoSemanal {
    id: string;
    user_id: string;
    turma_id: string;
    semana_inicio: string;
    tema_semana: string | null;
    objetivos: string | null;
    status: StatusPlanejamento;
    created_at: string;
    updated_at: string;
}

export interface AtividadePlanejada {
    id: string;
    planejamento_id: string;
    atividade_id: string | null;
    titulo: string;
    descricao: string | null;
    duracao_minutos: number;
    campos_bncc: string[] | null;
    cor: string;
    dia_semana: number; // 0=dom, 1=seg..6=sab
    ordem: number;
    horario: string | null;
    realizada: boolean;
    observacoes: string | null;
    registro_id: string | null;
    registros_ids: string[] | null; // Múltiplos registros vinculados
    created_at: string;
}

// Tipos com joins
export interface PlanejamentoComAtividades extends PlanejamentoSemanal {
    atividades_planejadas: AtividadePlanejada[];
    turma?: Turma;
}

export interface AtividadeComBncc extends Atividade {
    bncc_campos?: BnccCampo[];
}

// Tipos para formulários
export interface AtividadeInsert {
    titulo: string;
    descricao?: string;
    duracao_minutos?: number;
    materiais?: string[];
    campos_bncc?: string[];
    tipo?: TipoAtividade;
    faixa_etaria?: FaixaEtariaBncc;
    cor?: string;
}

export interface AtividadeUpdate extends Partial<AtividadeInsert> { }

export interface PlanejamentoInsert {
    turma_id: string;
    semana_inicio: string;
    tema_semana?: string;
    objetivos?: string;
    status?: StatusPlanejamento;
}

export interface PlanejamentoUpdate extends Partial<Omit<PlanejamentoInsert, 'turma_id' | 'semana_inicio'>> { }

export interface AtividadePlanejadaInsert {
    planejamento_id: string;
    atividade_id?: string;
    titulo: string;
    descricao?: string;
    duracao_minutos?: number;
    campos_bncc?: string[];
    cor?: string;
    dia_semana: number;
    ordem?: number;
    horario?: string;
}

// ============================================
// CONSTANTES PLANEJAMENTO
// ============================================

export const TIPOS_ATIVIDADE: Record<TipoAtividade, { label: string; icon: string; cor: string }> = {
    dirigida: { label: 'Atividade Dirigida', icon: '📋', cor: '#6366F1' },
    livre: { label: 'Brincadeira Livre', icon: '🎮', cor: '#10B981' },
    roda: { label: 'Roda de Conversa', icon: '🔵', cor: '#3B82F6' },
    parque: { label: 'Parque', icon: '🌳', cor: '#22C55E' },
    arte: { label: 'Arte', icon: '🎨', cor: '#F59E0B' },
    musica: { label: 'Música', icon: '🎵', cor: '#EC4899' },
    culinaria: { label: 'Culinária', icon: '🍳', cor: '#F97316' },
    movimento: { label: 'Movimento', icon: '🏃', cor: '#EF4444' },
    leitura: { label: 'Leitura', icon: '📚', cor: '#8B5CF6' },
    natureza: { label: 'Natureza', icon: '🌿', cor: '#14B8A6' },
};

export const CAMPOS_EXPERIENCIA: Record<CampoExperienciaBncc, { sigla: string; cor: string }> = {
    'O eu, o outro e o nós': { sigla: 'EO', cor: '#EC4899' },
    'Corpo, gestos e movimentos': { sigla: 'CG', cor: '#EF4444' },
    'Traços, sons, cores e formas': { sigla: 'TS', cor: '#F59E0B' },
    'Escuta, fala, pensamento e imaginação': { sigla: 'EF', cor: '#3B82F6' },
    'Espaços, tempos, quantidades, relações e transformações': { sigla: 'ET', cor: '#10B981' },
};

export const FAIXAS_ETARIAS: Record<FaixaEtariaBncc, { label: string; idade: string }> = {
    bebes: { label: 'Bebês', idade: '0 a 1 ano e 6 meses' },
    criancas_bem_pequenas: { label: 'Crianças bem pequenas', idade: '1 ano e 7 meses a 3 anos e 11 meses' },
    criancas_pequenas: { label: 'Crianças pequenas', idade: '4 anos a 5 anos e 11 meses' },
};

export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const DIAS_SEMANA_COMPLETO = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

// Helper para obter segunda-feira da semana
export function getSegundaFeira(data: Date = new Date()): Date {
    const d = new Date(data);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Helper para formatar data para ISO YYYY-MM-DD (Local Time)
// Evita o problema do toISOString() que converte para UTC
export function formatarDataISO(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Helper para formatar semana
export function formatarSemana(segundaFeira: Date): string {
    const sexta = new Date(segundaFeira);
    sexta.setDate(sexta.getDate() + 4);

    const formatOpts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
    return `${segundaFeira.toLocaleDateString('pt-BR', formatOpts)} - ${sexta.toLocaleDateString('pt-BR', formatOpts)}`;
}
