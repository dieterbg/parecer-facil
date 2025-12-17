'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTurmas } from '@/hooks/use-turmas';
import { usePlanejamento } from '@/hooks/use-planejamento';
import { WeeklyCalendar, MarkRealizadaModal } from '@/components/planejamento';
import {
    getSegundaFeira,
    formatarSemana,
    TIPOS_ATIVIDADE,
    type AtividadePlanejada,
    type TipoAtividade
} from '@/types/database';

export default function PlanejamentoPage() {
    const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);
    const [currentWeek, setCurrentWeek] = useState(() => getSegundaFeira());
    const [showAddModal, setShowAddModal] = useState<{ dia: number } | null>(null);
    const [showRealizadaModal, setShowRealizadaModal] = useState<AtividadePlanejada | null>(null);
    const [newActivityTitle, setNewActivityTitle] = useState('');
    const [newActivityTipo, setNewActivityTipo] = useState<TipoAtividade>('livre');
    const [savingActivity, setSavingActivity] = useState(false);

    const { turmas, loading: loadingTurmas } = useTurmas();
    const {
        planejamentoAtual,
        loading: loadingPlanejamento,
        getOrCreatePlanejamentoSemana,
        moverAtividade,
        removeAtividadePlanejada,
        addAtividadePlanejada,
        getPlanejamentoComAtividades
    } = usePlanejamento({ turmaId: selectedTurmaId || undefined });

    // Selecionar primeira turma automaticamente
    useEffect(() => {
        if (turmas.length > 0 && !selectedTurmaId) {
            setSelectedTurmaId(turmas[0].id);
        }
    }, [turmas, selectedTurmaId]);

    // Carregar planejamento da semana quando turma ou semana mudar
    useEffect(() => {
        if (selectedTurmaId) {
            getOrCreatePlanejamentoSemana(selectedTurmaId, currentWeek);
        }
    }, [selectedTurmaId, currentWeek, getOrCreatePlanejamentoSemana]);

    const handlePrevWeek = () => {
        const newWeek = new Date(currentWeek);
        newWeek.setDate(newWeek.getDate() - 7);
        setCurrentWeek(newWeek);
    };

    const handleNextWeek = () => {
        const newWeek = new Date(currentWeek);
        newWeek.setDate(newWeek.getDate() + 7);
        setCurrentWeek(newWeek);
    };

    const handleToday = () => {
        setCurrentWeek(getSegundaFeira());
    };

    const handleAddActivity = async () => {
        if (!planejamentoAtual || !showAddModal || !newActivityTitle.trim()) return;

        setSavingActivity(true);
        try {
            const tipoInfo = TIPOS_ATIVIDADE[newActivityTipo];
            await addAtividadePlanejada({
                planejamento_id: planejamentoAtual.id,
                titulo: newActivityTitle,
                dia_semana: showAddModal.dia,
                cor: tipoInfo.cor,
                duracao_minutos: 30,
            });
            setShowAddModal(null);
            setNewActivityTitle('');
            setNewActivityTipo('livre');
        } catch (err) {
            console.error('Erro ao adicionar:', err);
        } finally {
            setSavingActivity(false);
        }
    };

    if (loadingTurmas) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (turmas.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
                <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold mb-2">Nenhuma turma encontrada</h2>
                <p className="text-muted-foreground mb-4">Crie uma turma para começar a planejar</p>
                <Button asChild>
                    <Link href="/turmas">Ir para Turmas</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-primary" />
                            Planejamento Semanal
                        </h1>
                        <p className="text-muted-foreground">
                            Organize suas atividades da semana
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/planejamento/atividades">
                                <BookOpen className="w-4 h-4 mr-2" />
                                Banco de Atividades
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Seletor de turma e navegação de semana */}
                <Card>
                    <CardContent className="py-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            {/* Seletor de turma */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">Turma:</span>
                                <select
                                    value={selectedTurmaId || ''}
                                    onChange={(e) => setSelectedTurmaId(e.target.value)}
                                    className="px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary"
                                >
                                    {turmas.map(turma => (
                                        <option key={turma.id} value={turma.id}>
                                            {turma.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Navegação de semana */}
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={handlePrevWeek}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>

                                <Button variant="outline" onClick={handleToday}>
                                    Hoje
                                </Button>

                                <div className="px-4 py-2 bg-primary/10 rounded-lg min-w-[200px] text-center">
                                    <span className="font-medium">{formatarSemana(currentWeek)}</span>
                                </div>

                                <Button variant="outline" size="icon" onClick={handleNextWeek}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tema da semana */}
                {planejamentoAtual && (
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground">Tema da Semana:</span>
                                <input
                                    type="text"
                                    placeholder="Ex: Animais da Fazenda, Estações do Ano..."
                                    defaultValue={planejamentoAtual.tema_semana || ''}
                                    className="flex-1 px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Calendário semanal */}
                <Card>
                    <CardHeader>
                        <CardTitle>Atividades da Semana</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingPlanejamento ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : planejamentoAtual ? (
                            <WeeklyCalendar
                                planejamento={planejamentoAtual}
                                onMoveActivity={(id, dia, ordem) => moverAtividade(id, dia, ordem)}
                                onToggleRealizada={(id) => {
                                    // Encontrar atividade e abrir modal
                                    const ativ = planejamentoAtual.atividades_planejadas?.find(a => a.id === id);
                                    if (ativ && !ativ.realizada) {
                                        setShowRealizadaModal(ativ);
                                    }
                                }}
                                onRemoveActivity={(id) => {
                                    if (confirm('Remover esta atividade?')) {
                                        removeAtividadePlanejada(id);
                                    }
                                }}
                                onAddActivity={(dia) => setShowAddModal({ dia })}
                            />
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                Selecione uma turma para ver o planejamento
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Modal adicionar atividade rápida */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md">
                            <CardHeader>
                                <CardTitle>Nova Atividade</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Título</label>
                                    <input
                                        type="text"
                                        placeholder="Nome da atividade"
                                        value={newActivityTitle}
                                        onChange={(e) => setNewActivityTitle(e.target.value)}
                                        className="w-full px-4 py-2 bg-muted rounded-lg border focus:ring-2 focus:ring-primary"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">Tipo</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {(Object.entries(TIPOS_ATIVIDADE) as [TipoAtividade, { label: string; icon: string; cor: string }][]).map(([tipo, info]) => (
                                            <button
                                                key={tipo}
                                                type="button"
                                                onClick={() => setNewActivityTipo(tipo)}
                                                className={`p-2 rounded-lg text-center transition-all ${newActivityTipo === tipo
                                                    ? 'ring-2 ring-primary bg-primary/10'
                                                    : 'bg-muted hover:bg-muted/80'
                                                    }`}
                                            >
                                                <span className="text-xl block mb-1">{info.icon}</span>
                                                <span className="text-xs">{info.label.split(' ')[0]}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowAddModal(null)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={handleAddActivity}
                                        disabled={!newActivityTitle.trim() || savingActivity}
                                    >
                                        {savingActivity ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Modal marcar realizada */}
                {showRealizadaModal && planejamentoAtual && (
                    <MarkRealizadaModal
                        atividade={showRealizadaModal}
                        onClose={() => setShowRealizadaModal(null)}
                        onSuccess={() => {
                            setShowRealizadaModal(null);
                            if (planejamentoAtual) {
                                getPlanejamentoComAtividades(planejamentoAtual.id);
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
}
