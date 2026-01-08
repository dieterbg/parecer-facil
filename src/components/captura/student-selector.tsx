'use client';

import { useState, useMemo } from 'react';
import { Check, X, Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Aluno } from '@/types/database';
import { calcularIdade } from '@/types/database';

interface StudentSelectorProps {
    alunos: Aluno[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    loading?: boolean;
    maxSelection?: number; // Limite de alunos selecionáveis
}

export function StudentSelector({
    alunos,
    selectedIds,
    onSelectionChange,
    loading = false,
    maxSelection,
}: StudentSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Filtrar alunos pela busca
    const filteredAlunos = useMemo(() => {
        if (!searchTerm.trim()) return alunos;
        const term = searchTerm.toLowerCase();
        return alunos.filter(a => a.nome.toLowerCase().includes(term));
    }, [alunos, searchTerm]);

    // Alunos selecionados
    const selectedAlunos = useMemo(() => {
        return alunos.filter(a => selectedIds.includes(a.id));
    }, [alunos, selectedIds]);

    const toggleAluno = (alunoId: string) => {
        if (selectedIds.includes(alunoId)) {
            onSelectionChange(selectedIds.filter(id => id !== alunoId));
        } else {
            if (maxSelection && selectedIds.length >= maxSelection) {
                return; // Limite atingido
            }
            onSelectionChange([...selectedIds, alunoId]);
        }
    };

    const selectAll = () => {
        const allIds = alunos.map(a => a.id);
        if (maxSelection) {
            onSelectionChange(allIds.slice(0, maxSelection));
        } else {
            onSelectionChange(allIds);
        }
    };

    const clearSelection = () => {
        onSelectionChange([]);
    };

    if (loading) {
        return (
            <div className="p-4 bg-card rounded-xl border border-border animate-pulse">
                <div className="h-10 bg-muted rounded-lg"></div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Alunos selecionados (chips) */}
            {selectedAlunos.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {selectedAlunos.map(aluno => (
                        <div
                            key={aluno.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-sm"
                        >
                            <span className="font-medium text-primary">{aluno.nome.split(' ')[0]}</span>
                            <button
                                onClick={() => toggleAluno(aluno.id)}
                                className="p-0.5 hover:bg-primary/20 rounded-full transition-colors"
                            >
                                <X className="w-3.5 h-3.5 text-primary/70" />
                            </button>
                        </div>
                    ))}
                    {selectedAlunos.length > 1 && (
                        <button
                            onClick={clearSelection}
                            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Limpar todos
                        </button>
                    )}
                </div>
            )}

            {/* Dropdown trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'w-full flex items-center justify-between px-4 py-3 bg-card rounded-xl border transition-all',
                    isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                )}
            >
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-5 h-5" />
                    <span>
                        {selectedIds.length === 0
                            ? 'Selecione os alunos'
                            : `${selectedIds.length} aluno${selectedIds.length > 1 ? 's' : ''} selecionado${selectedIds.length > 1 ? 's' : ''}`
                        }
                    </span>
                </div>
                <div className={cn(
                    'w-5 h-5 flex items-center justify-center transition-transform',
                    isOpen && 'rotate-180'
                )}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Dropdown content */}
            {isOpen && (
                <div className="mt-2 bg-card rounded-xl border border-border shadow-xl overflow-hidden">
                    {/* Search */}
                    <div className="p-3 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar aluno..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-muted/50 rounded-lg border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border">
                        <button
                            type="button"
                            onClick={selectAll}
                            className="text-xs text-primary hover:underline"
                        >
                            Selecionar todos
                        </button>
                        <span className="text-xs text-muted-foreground">
                            {filteredAlunos.length} aluno{filteredAlunos.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* List */}
                    <div className="max-h-64 overflow-y-auto">
                        {filteredAlunos.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
                            </div>
                        ) : (
                            <ul>
                                {filteredAlunos.map(aluno => {
                                    const isSelected = selectedIds.includes(aluno.id);
                                    const isDisabled = !!(maxSelection && !isSelected && selectedIds.length >= maxSelection);

                                    return (
                                        <li key={aluno.id}>
                                            <button
                                                type="button"
                                                onClick={() => !isDisabled && toggleAluno(aluno.id)}
                                                disabled={isDisabled}
                                                className={cn(
                                                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                                                    isSelected ? 'bg-primary/10' : 'hover:bg-muted/50',
                                                    isDisabled && 'opacity-50 cursor-not-allowed'
                                                )}
                                            >
                                                {/* Checkbox visual */}
                                                <div className={cn(
                                                    'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors',
                                                    isSelected
                                                        ? 'bg-primary border-primary'
                                                        : 'border-border'
                                                )}>
                                                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                                                </div>

                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center overflow-hidden">
                                                    {aluno.foto_url ? (
                                                        <img
                                                            src={aluno.foto_url}
                                                            alt={aluno.nome}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-semibold text-primary">
                                                            {aluno.nome.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-foreground truncate">{aluno.nome}</p>
                                                    {aluno.data_nascimento && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {calcularIdade(aluno.data_nascimento)}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
