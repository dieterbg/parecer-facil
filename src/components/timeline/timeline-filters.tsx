'use client';

import { useState, useMemo } from 'react';
import {
    Filter,
    Search,
    Calendar,
    X,
    ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Aluno, Contexto, TipoRegistro } from '@/types/database';
import { TIPOS_REGISTRO } from '@/types/database';

interface TimelineFiltersProps {
    alunos: Aluno[];
    contextos: Contexto[];

    // Estado dos filtros
    selectedAlunos: string[];
    selectedTipo: TipoRegistro | null;
    selectedContexto: string | null;
    searchTerm: string;
    startDate: string;
    endDate: string;

    // Callbacks
    onAlunosChange: (ids: string[]) => void;
    onTipoChange: (tipo: TipoRegistro | null) => void;
    onContextoChange: (id: string | null) => void;
    onSearchChange: (term: string) => void;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    onClearAll: () => void;
}

export function TimelineFilters({
    alunos,
    contextos,
    selectedAlunos,
    selectedTipo,
    selectedContexto,
    searchTerm,
    startDate,
    endDate,
    onAlunosChange,
    onTipoChange,
    onContextoChange,
    onSearchChange,
    onStartDateChange,
    onEndDateChange,
    onClearAll,
}: TimelineFiltersProps) {
    const [showFilters, setShowFilters] = useState(false);
    const [alunoDropdownOpen, setAlunoDropdownOpen] = useState(false);

    // Contar filtros ativos
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (selectedAlunos.length > 0) count++;
        if (selectedTipo) count++;
        if (selectedContexto) count++;
        if (startDate || endDate) count++;
        return count;
    }, [selectedAlunos, selectedTipo, selectedContexto, startDate, endDate]);

    return (
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
            {/* Barra de busca e toggle de filtros */}
            <div className="flex items-center gap-3">
                {/* Busca */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar nos registros..."
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-muted/50 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
                        >
                            <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                    )}
                </div>

                {/* Toggle filtros */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors',
                        showFilters || activeFiltersCount > 0
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                    )}
                >
                    <Filter className="w-5 h-5" />
                    <span className="hidden sm:inline">Filtros</span>
                    {activeFiltersCount > 0 && (
                        <span className="flex items-center justify-center min-w-5 h-5 px-1.5 bg-white/20 rounded-full text-xs font-medium">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Painel de filtros expandido */}
            {showFilters && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                    {/* Linha 1: Tipo e Contexto */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Filtro por tipo */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Tipo de registro
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => onTipoChange(null)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-full text-sm transition-colors',
                                        selectedTipo === null
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted hover:bg-muted/80'
                                    )}
                                >
                                    Todos
                                </button>
                                {Object.entries(TIPOS_REGISTRO).map(([tipo, { label, icon }]) => (
                                    <button
                                        key={tipo}
                                        onClick={() => onTipoChange(tipo as TipoRegistro)}
                                        className={cn(
                                            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
                                            selectedTipo === tipo
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted hover:bg-muted/80'
                                        )}
                                    >
                                        <span>{icon}</span>
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Filtro por contexto */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Contexto
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => onContextoChange(null)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-full text-sm transition-colors',
                                        selectedContexto === null
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted hover:bg-muted/80'
                                    )}
                                >
                                    Todos
                                </button>
                                {contextos.slice(0, 5).map(ctx => (
                                    <button
                                        key={ctx.id}
                                        onClick={() => onContextoChange(ctx.id)}
                                        className={cn(
                                            'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors',
                                            selectedContexto === ctx.id
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted hover:bg-muted/80'
                                        )}
                                    >
                                        <span>{ctx.icone}</span>
                                        <span>{ctx.nome}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Linha 2: Alunos e Período */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Filtro por alunos */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Alunos
                            </label>
                            <div className="relative">
                                <button
                                    onClick={() => setAlunoDropdownOpen(!alunoDropdownOpen)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                                >
                                    <span>
                                        {selectedAlunos.length === 0
                                            ? 'Todos os alunos'
                                            : `${selectedAlunos.length} aluno${selectedAlunos.length > 1 ? 's' : ''}`
                                        }
                                    </span>
                                    <ChevronDown className={cn(
                                        'w-5 h-5 transition-transform',
                                        alunoDropdownOpen && 'rotate-180'
                                    )} />
                                </button>

                                {alunoDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                                        <button
                                            onClick={() => {
                                                onAlunosChange([]);
                                                setAlunoDropdownOpen(false);
                                            }}
                                            className={cn(
                                                'w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors',
                                                selectedAlunos.length === 0 && 'bg-primary/10 text-primary'
                                            )}
                                        >
                                            Todos os alunos
                                        </button>
                                        {alunos.map(aluno => (
                                            <button
                                                key={aluno.id}
                                                onClick={() => {
                                                    if (selectedAlunos.includes(aluno.id)) {
                                                        onAlunosChange(selectedAlunos.filter(id => id !== aluno.id));
                                                    } else {
                                                        onAlunosChange([...selectedAlunos, aluno.id]);
                                                    }
                                                }}
                                                className={cn(
                                                    'w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2',
                                                    selectedAlunos.includes(aluno.id) && 'bg-primary/10 text-primary'
                                                )}
                                            >
                                                <div className={cn(
                                                    'w-4 h-4 rounded border-2 flex items-center justify-center',
                                                    selectedAlunos.includes(aluno.id)
                                                        ? 'bg-primary border-primary'
                                                        : 'border-border'
                                                )}>
                                                    {selectedAlunos.includes(aluno.id) && (
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                {aluno.nome}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Filtro por período */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Período
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => onStartDateChange(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 bg-muted/50 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <span className="text-muted-foreground">até</span>
                                <div className="relative flex-1">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={e => onEndDateChange(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 bg-muted/50 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botão limpar filtros */}
                    {activeFiltersCount > 0 && (
                        <div className="flex justify-end">
                            <button
                                onClick={onClearAll}
                                className="text-sm text-primary hover:underline"
                            >
                                Limpar todos os filtros
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Tags dos filtros ativos (quando contraído) */}
            {!showFilters && activeFiltersCount > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {selectedAlunos.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                            {selectedAlunos.length} aluno{selectedAlunos.length > 1 ? 's' : ''}
                            <button onClick={() => onAlunosChange([])}>
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedTipo && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                            {TIPOS_REGISTRO[selectedTipo].icon} {TIPOS_REGISTRO[selectedTipo].label}
                            <button onClick={() => onTipoChange(null)}>
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedContexto && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                            {contextos.find(c => c.id === selectedContexto)?.icone}
                            {contextos.find(c => c.id === selectedContexto)?.nome}
                            <button onClick={() => onContextoChange(null)}>
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {(startDate || endDate) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                            📅 {startDate || '...'} - {endDate || '...'}
                            <button onClick={() => { onStartDateChange(''); onEndDateChange(''); }}>
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
