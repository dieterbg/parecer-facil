'use client';

import { useState, useMemo } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { TimelineFilters } from './timeline-filters';
import { TimelineItem } from './timeline-item';
import { QuickCapture } from '@/components/captura/quick-capture';
import { EmptyRegistros } from '@/components/ui/empty-states';
import { useRegistros, useAlunos } from '@/hooks';
import type { TipoRegistro } from '@/types/database';

interface TimelineViewProps {
    turmaId: string;
}

export function TimelineView({ turmaId }: TimelineViewProps) {
    // Estado dos filtros
    const [selectedAlunos, setSelectedAlunos] = useState<string[]>([]);
    const [selectedTipo, setSelectedTipo] = useState<TipoRegistro | null>(null);
    const [selectedContexto, setSelectedContexto] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Estado da UI
    const [showCapture, setShowCapture] = useState(false);

    // Hooks de dados
    const { alunos, loading: loadingAlunos } = useAlunos({ turmaId });
    const {
        registros,
        contextos,
        loading: loadingRegistros,
        deleteRegistro,
        toggleCompartilharFamilia,
        refetch
    } = useRegistros({
        turmaId,
        tipo: selectedTipo || undefined,
        contextoId: selectedContexto || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
    });

    // Filtrar registros localmente (busca e alunos)
    const filteredRegistros = useMemo(() => {
        let result = registros;

        // Filtrar por alunos selecionados
        if (selectedAlunos.length > 0) {
            result = result.filter(reg =>
                reg.registros_alunos?.some(ra => selectedAlunos.includes(ra.aluno?.id || ''))
            );
        }

        // Filtrar por termo de busca
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(reg =>
                reg.descricao?.toLowerCase().includes(term) ||
                reg.transcricao_voz?.toLowerCase().includes(term) ||
                reg.registros_alunos?.some(ra => ra.aluno?.nome.toLowerCase().includes(term))
            );
        }

        return result;
    }, [registros, selectedAlunos, searchTerm]);

    // Agrupar por data
    const groupedByDate = useMemo(() => {
        const groups: Record<string, typeof filteredRegistros> = {};

        filteredRegistros.forEach(reg => {
            const date = new Date(reg.data_registro).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(reg);
        });

        return groups;
    }, [filteredRegistros]);

    // Limpar todos os filtros
    const clearAllFilters = () => {
        setSelectedAlunos([]);
        setSelectedTipo(null);
        setSelectedContexto(null);
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
    };

    // Handlers
    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este registro?')) return;

        try {
            await deleteRegistro(id);
        } catch (err) {
            console.error('Erro ao excluir:', err);
        }
    };

    const handleToggleShare = async (id: string, share: boolean) => {
        try {
            await toggleCompartilharFamilia(id, share);
        } catch (err) {
            console.error('Erro ao alternar compartilhamento:', err);
        }
    };

    const handleCaptureSuccess = () => {
        setShowCapture(false);
        refetch();
    };

    const loading = loadingRegistros || loadingAlunos;

    return (
        <div className="w-full">
            {/* Filtros */}
            <TimelineFilters
                alunos={alunos}
                contextos={contextos}
                selectedAlunos={selectedAlunos}
                selectedTipo={selectedTipo}
                selectedContexto={selectedContexto}
                searchTerm={searchTerm}
                startDate={startDate}
                endDate={endDate}
                onAlunosChange={setSelectedAlunos}
                onTipoChange={setSelectedTipo}
                onContextoChange={setSelectedContexto}
                onSearchChange={setSearchTerm}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onClearAll={clearAllFilters}
            />

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {/* Lista vazia */}
            {!loading && filteredRegistros.length === 0 && (
                <EmptyRegistros onCaptureClick={() => setShowCapture(true)} />
            )}

            {/* Timeline agrupada por data */}
            {!loading && filteredRegistros.length > 0 && (
                <div className="space-y-8">
                    {Object.entries(groupedByDate).map(([date, regs]) => (
                        <div key={date}>
                            {/* Cabeçalho da data */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 rounded-full bg-primary" />
                                <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">
                                    {date}
                                </h3>
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-muted-foreground">
                                    {regs.length} registro{regs.length > 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Itens */}
                            <div className="pl-1">
                                {regs.map(registro => (
                                    <TimelineItem
                                        key={registro.id}
                                        registro={registro}
                                        onDelete={handleDelete}
                                        onToggleShare={handleToggleShare}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Botão inline para novo registro */}
            {filteredRegistros.length > 0 && (
                <div className="flex justify-center py-6">
                    <button
                        onClick={() => setShowCapture(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar mais registros
                    </button>
                </div>
            )}

            {/* Modal de Captura Rápida */}
            {showCapture && (
                <QuickCapture
                    turmaId={turmaId}
                    onSuccess={handleCaptureSuccess}
                    onCancel={() => setShowCapture(false)}
                />
            )}
        </div>
    );
}
