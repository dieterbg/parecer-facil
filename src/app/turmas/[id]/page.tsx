"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Users, Loader2, Trash2, FileSpreadsheet, User, ExternalLink, Calendar, ChevronLeft, ChevronRight, Camera, FileText, Video, Mic } from "lucide-react";
import Link from "next/link";
import { ImportadorExcel } from "@/components/importador-excel";
import { TimelineView } from "@/components/timeline";
import { WeeklyCalendar, MarkRealizadaModal, DayDetailModal } from "@/components/planejamento";
import { BnccSelector } from "@/components/planejamento/bncc-selector";
import { NovoRegistro } from "@/components/novo-registro";
import { calcularIdade, getSegundaFeira, formatarSemana, TIPOS_ATIVIDADE, DIAS_SEMANA, type AtividadePlanejada, type TipoAtividade, type RegistroComDetalhes } from "@/types/database";
import { usePlanejamento } from "@/hooks/use-planejamento";
import { useRegistros } from "@/hooks/use-registros";

interface Turma {
    id: string;
    nome: string;
    ano_letivo: string;
    escola: string | null;
    cor: string;
}

interface Aluno {
    id: string;
    nome: string;
    data_nascimento: string | null;
    foto_url: string | null;
}

export default function TurmaDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [turma, setTurma] = useState<Turma | null>(null);
    const [alunos, setAlunos] = useState<Aluno[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewAluno, setShowNewAluno] = useState(false);
    const [showImportExcel, setShowImportExcel] = useState(false);
    const [novoAluno, setNovoAluno] = useState({ nome: "", data_nascimento: "" });
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'alunos' | 'diario'>('diario');
    const [currentWeek, setCurrentWeek] = useState(() => getSegundaFeira());
    const [showAddModal, setShowAddModal] = useState<{ dia: number; tipo: 'atividade' | 'registro' } | null>(null);
    const [showRealizadaModal, setShowRealizadaModal] = useState<AtividadePlanejada | null>(null);
    const [newActivityTitle, setNewActivityTitle] = useState('');
    const [newActivityTipo, setNewActivityTipo] = useState<TipoAtividade>('livre');
    const [newActivityBncc, setNewActivityBncc] = useState<string[]>([]);
    const [savingActivity, setSavingActivity] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [showNovoRegistro, setShowNovoRegistro] = useState(false);
    const [registroParaAtividade, setRegistroParaAtividade] = useState<AtividadePlanejada | null>(null);
    const [editingRegistro, setEditingRegistro] = useState<RegistroComDetalhes | null>(null);
    const [editingAtividade, setEditingAtividade] = useState<AtividadePlanejada | null>(null);

    // Hook de planejamento
    const {
        planejamentoAtual,
        loading: loadingPlanejamento,
        getOrCreatePlanejamentoSemana,
        moverAtividade,
        removeAtividadePlanejada,
        addAtividadePlanejada,
        getPlanejamentoComAtividades
    } = usePlanejamento({ turmaId: params.id as string });

    // Hook de registros
    const { registros, refetch: refetchRegistros } = useRegistros({});

    // Filtrar registros da semana atual
    const registrosDaSemana = registros.filter(r => {
        const regDate = new Date(r.data_registro || r.created_at);
        const semanaFim = new Date(currentWeek);
        semanaFim.setDate(semanaFim.getDate() + 4); // até sexta
        return regDate >= currentWeek && regDate <= semanaFim;
    });

    // Carregar planejamento quando mudar semana
    useEffect(() => {
        if (params.id && activeTab === 'diario') {
            getOrCreatePlanejamentoSemana(params.id as string, currentWeek);
        }
    }, [params.id, currentWeek, activeTab, getOrCreatePlanejamentoSemana]);

    useEffect(() => {
        if (params.id) {
            fetchTurmaData();
        }
    }, [params.id]);

    const fetchTurmaData = async () => {
        try {
            const { data: turmaData, error: turmaError } = await supabase
                .from('turmas')
                .select('*')
                .eq('id', params.id)
                .single();

            if (turmaError) throw turmaError;
            setTurma(turmaData);

            const { data: alunosData, error: alunosError } = await supabase
                .from('alunos')
                .select('*')
                .eq('turma_id', params.id)
                .eq('ativo', true)
                .order('nome');

            if (alunosError) throw alunosError;
            setAlunos(alunosData || []);
        } catch (error) {
            console.error('Erro:', error);
            router.push('/turmas');
        } finally {
            setLoading(false);
        }
    };

    const handleImportExcel = async (alunosImportados: { nome: string; data_nascimento?: string }[]) => {
        try {
            const alunosParaInserir = alunosImportados.map(aluno => ({
                turma_id: params.id,
                nome: aluno.nome,
                data_nascimento: aluno.data_nascimento || null
            }));

            const { error } = await supabase.from('alunos').insert(alunosParaInserir);
            if (error) throw error;

            alert(`${alunosImportados.length} aluno(s) importado(s)!`);
            fetchTurmaData();
        } catch (error) {
            console.error('Erro:', error);
            throw error;
        }
    };

    const handleCreateAluno = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novoAluno.nome.trim()) return;

        setSaving(true);
        try {
            const { error } = await supabase.from('alunos').insert([{
                turma_id: params.id,
                nome: novoAluno.nome,
                data_nascimento: novoAluno.data_nascimento || null
            }]);

            if (error) throw error;
            setNovoAluno({ nome: "", data_nascimento: "" });
            setShowNewAluno(false);
            fetchTurmaData();
        } catch (error) {
            console.error('Erro:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAluno = async (id: string, nome: string) => {
        if (!confirm(`Excluir "${nome}"?`)) return;

        try {
            const { error } = await supabase
                .from('alunos')
                .update({ ativo: false })
                .eq('id', id);
            if (error) throw error;
            fetchTurmaData();
        } catch (error) {
            console.error('Erro:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!turma) return null;

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/turmas">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: turma.cor || '#6366F1' }}
                            />
                            <h1 className="text-3xl font-bold">{turma.nome}</h1>
                        </div>
                        <p className="text-muted-foreground">{turma.ano_letivo} • {alunos.length} alunos</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-border pb-2">
                    <button
                        onClick={() => setActiveTab('diario')}
                        className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${activeTab === 'diario'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        📅 Diário
                    </button>
                    <button
                        onClick={() => setActiveTab('alunos')}
                        className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${activeTab === 'alunos'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        👥 Alunos ({alunos.length})
                    </button>
                </div>

                {/* Tab: Diário (Calendário unificado) */}
                {activeTab === 'diario' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Diário da Turma
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" onClick={() => {
                                        const newWeek = new Date(currentWeek);
                                        newWeek.setDate(newWeek.getDate() - 7);
                                        setCurrentWeek(newWeek);
                                    }}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <div className="px-4 py-2 bg-primary/10 rounded-lg min-w-[180px] text-center">
                                        <span className="font-medium text-sm">{formatarSemana(currentWeek)}</span>
                                    </div>
                                    <Button variant="outline" size="icon" onClick={() => {
                                        const newWeek = new Date(currentWeek);
                                        newWeek.setDate(newWeek.getDate() + 7);
                                        setCurrentWeek(newWeek);
                                    }}>
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                    <div className="border-l h-6 mx-2" />
                                    <Button onClick={() => setShowNovoRegistro(true)} className="gap-2">
                                        <Camera className="w-4 h-4" />
                                        + Registro
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingPlanejamento ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : planejamentoAtual ? (
                                <WeeklyCalendar
                                    planejamento={planejamentoAtual}
                                    currentWeek={currentWeek}
                                    registros={registrosDaSemana}
                                    onMoveActivity={(id, dia, ordem) => moverAtividade(id, dia, ordem)}
                                    onToggleRealizada={(id) => {
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
                                    onAddActivity={(dia) => setShowAddModal({ dia, tipo: 'atividade' })}
                                    onActivityClick={(atividade) => setEditingAtividade(atividade)}
                                    onDayClick={(dia) => setSelectedDay(dia)}
                                    onRegistroClick={(registro) => {
                                        const fullRegistro = registrosDaSemana.find(r => r.id === registro.id);
                                        if (fullRegistro) {
                                            setEditingRegistro(fullRegistro);
                                        }
                                    }}
                                    onAddRegistro={(atividade) => {
                                        setRegistroParaAtividade(atividade);
                                        setShowNovoRegistro(true);
                                    }}
                                />
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    Carregando...
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Tab: Alunos */}
                {activeTab === 'alunos' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Alunos da Turma
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button onClick={() => setShowImportExcel(!showImportExcel)} size="sm" variant="outline">
                                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                                        Importar Excel
                                    </Button>
                                    <Button onClick={() => setShowNewAluno(!showNewAluno)} size="sm">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Adicionar
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {showImportExcel && (
                                <ImportadorExcel
                                    onImport={handleImportExcel}
                                    onClose={() => setShowImportExcel(false)}
                                />
                            )}

                            {showNewAluno && (
                                <Card className="bg-muted/50">
                                    <CardContent className="pt-6">
                                        <form onSubmit={handleCreateAluno} className="space-y-4">
                                            <Input
                                                placeholder="Nome do aluno"
                                                value={novoAluno.nome}
                                                onChange={(e) => setNovoAluno({ ...novoAluno, nome: e.target.value })}
                                                required
                                            />
                                            <Input
                                                type="date"
                                                value={novoAluno.data_nascimento}
                                                onChange={(e) => setNovoAluno({ ...novoAluno, data_nascimento: e.target.value })}
                                            />
                                            <div className="flex gap-2">
                                                <Button type="submit" disabled={saving} size="sm">
                                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar"}
                                                </Button>
                                                <Button type="button" variant="outline" size="sm" onClick={() => setShowNewAluno(false)}>
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            )}

                            {alunos.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Nenhum aluno cadastrado.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {alunos.map((aluno) => (
                                        <div
                                            key={aluno.id}
                                            className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-primary/50 transition-colors group"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                                                {aluno.foto_url ? (
                                                    <img src={aluno.foto_url} alt={aluno.nome} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-lg font-semibold text-primary">{aluno.nome.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{aluno.nome}</p>
                                                {aluno.data_nascimento && (
                                                    <p className="text-xs text-muted-foreground">{calcularIdade(aluno.data_nascimento)}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                                                    <Link href={`/alunos/${aluno.id}`}><ExternalLink className="w-4 h-4" /></Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteAluno(aluno.id, aluno.nome)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Modal adicionar atividade rápida */}
                {showAddModal && planejamentoAtual && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md">
                            <CardHeader>
                                <CardTitle>Nova Atividade</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Título</label>
                                    <Input
                                        placeholder="Nome da atividade"
                                        value={newActivityTitle}
                                        onChange={(e) => setNewActivityTitle(e.target.value)}
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
                                                <span className="text-[10px]">{info.label.split(' ')[0]}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Campos BNCC</label>
                                    <BnccSelector
                                        selectedCodigos={newActivityBncc}
                                        onChange={setNewActivityBncc}
                                        maxSelections={3}
                                    />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(null)}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        disabled={!newActivityTitle.trim() || savingActivity}
                                        onClick={async () => {
                                            setSavingActivity(true);
                                            try {
                                                const tipoInfo = TIPOS_ATIVIDADE[newActivityTipo];
                                                await addAtividadePlanejada({
                                                    planejamento_id: planejamentoAtual.id,
                                                    titulo: newActivityTitle,
                                                    dia_semana: showAddModal.dia,
                                                    cor: tipoInfo.cor,
                                                    duracao_minutos: 30,
                                                    campos_bncc: newActivityBncc.length > 0 ? newActivityBncc : undefined,
                                                });
                                                setShowAddModal(null);
                                                setNewActivityTitle('');
                                                setNewActivityTipo('livre');
                                                setNewActivityBncc([]);
                                            } finally {
                                                setSavingActivity(false);
                                            }
                                        }}
                                    >
                                        {savingActivity ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Modal marcar realizada */}
                {showRealizadaModal && (
                    <MarkRealizadaModal
                        atividade={showRealizadaModal}
                        currentWeek={currentWeek}
                        onClose={() => setShowRealizadaModal(null)}
                        onSuccess={() => {
                            setShowRealizadaModal(null);
                            if (planejamentoAtual) {
                                getPlanejamentoComAtividades(planejamentoAtual.id);
                            }
                        }}
                    />
                )}

                {/* Modal detalhes do dia */}
                {selectedDay && planejamentoAtual && (
                    <DayDetailModal
                        isOpen={!!selectedDay}
                        onClose={() => setSelectedDay(null)}
                        turmaId={params.id as string}
                        dia={selectedDay}
                        dataInicio={currentWeek}
                        atividades={planejamentoAtual.atividades_planejadas?.filter(a => a.dia_semana === selectedDay) || []}
                        alunos={alunos.map(a => ({ id: a.id, nome: a.nome }))}
                        onToggleRealizada={(id) => {
                            const ativ = planejamentoAtual.atividades_planejadas?.find(a => a.id === id);
                            if (ativ && !ativ.realizada) {
                                setSelectedDay(null);
                                setShowRealizadaModal(ativ);
                            }
                        }}
                    />
                )}

                {/* Modal Novo Registro */}
                {showNovoRegistro && turma && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="max-w-2xl w-full">
                            <NovoRegistro
                                turmaId={turma.id}
                                alunos={alunos.map(a => ({ id: a.id, nome: a.nome }))}
                                currentWeek={currentWeek}
                                atividade={registroParaAtividade ? {
                                    id: registroParaAtividade.id,
                                    titulo: registroParaAtividade.titulo,
                                    dia_semana: registroParaAtividade.dia_semana
                                } : undefined}
                                onSuccess={() => {
                                    setShowNovoRegistro(false);
                                    setRegistroParaAtividade(null);
                                    refetchRegistros();
                                }}
                                onCancel={() => {
                                    setShowNovoRegistro(false);
                                    setRegistroParaAtividade(null);
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Modal Editar Registro */}
                {editingRegistro && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-lg">
                            <CardHeader className="border-b">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Editar Registro</CardTitle>
                                    <Button variant="ghost" size="icon" onClick={() => setEditingRegistro(null)}>
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Tipo</label>
                                    <div className="flex gap-2">
                                        {['foto', 'video', 'audio', 'texto'].map(tipo => (
                                            <span
                                                key={tipo}
                                                className={`px-3 py-1 rounded text-sm ${editingRegistro.tipo === tipo
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground'
                                                    }`}
                                            >
                                                {tipo === 'foto' && '📷'}
                                                {tipo === 'video' && '🎥'}
                                                {tipo === 'audio' && '🎙️'}
                                                {tipo === 'texto' && '📝'}
                                                {' '}{tipo}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Data</label>
                                    <p className="text-sm">
                                        {new Date(editingRegistro.data_registro || editingRegistro.created_at).toLocaleDateString('pt-BR', {
                                            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Descrição</label>
                                    <textarea
                                        className="w-full border rounded-lg p-3 min-h-[100px] bg-background"
                                        value={editingRegistro.descricao || ''}
                                        onChange={(e) => setEditingRegistro({
                                            ...editingRegistro,
                                            descricao: e.target.value
                                        })}
                                    />
                                </div>
                                {editingRegistro.registros_alunos && editingRegistro.registros_alunos.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Alunos vinculados</label>
                                        <div className="flex flex-wrap gap-2">
                                            {editingRegistro.registros_alunos.map(ra => (
                                                <span key={ra.aluno.id} className="px-2 py-1 bg-accent rounded text-sm">
                                                    {ra.aluno.nome}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-2 pt-4">
                                    <Button
                                        variant="destructive"
                                        onClick={async () => {
                                            if (confirm('Tem certeza que deseja excluir este registro?')) {
                                                await supabase.from('registros').delete().eq('id', editingRegistro.id);
                                                setEditingRegistro(null);
                                                refetchRegistros();
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
                                    </Button>
                                    <div className="flex-1" />
                                    <Button variant="outline" onClick={() => setEditingRegistro(null)}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            await supabase.from('registros').update({
                                                descricao: editingRegistro.descricao
                                            }).eq('id', editingRegistro.id);
                                            setEditingRegistro(null);
                                            refetchRegistros();
                                        }}
                                    >
                                        Salvar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Modal Editar Atividade */}
                {editingAtividade && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-lg">
                            <CardHeader className="border-b">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Editar Atividade</CardTitle>
                                    <Button variant="ghost" size="icon" onClick={() => setEditingAtividade(null)}>
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Título</label>
                                    <Input
                                        value={editingAtividade.titulo}
                                        onChange={(e) => setEditingAtividade({
                                            ...editingAtividade,
                                            titulo: e.target.value
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Dia da Semana</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(dia => (
                                            <button
                                                key={dia}
                                                onClick={() => setEditingAtividade({
                                                    ...editingAtividade,
                                                    dia_semana: dia
                                                })}
                                                className={`px-3 py-1 rounded text-sm ${editingAtividade.dia_semana === dia
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted hover:bg-accent'
                                                    }`}
                                            >
                                                {DIAS_SEMANA[dia]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Descrição/Observações</label>
                                    <textarea
                                        className="w-full border rounded-lg p-3 min-h-[80px] bg-background"
                                        value={editingAtividade.observacoes || ''}
                                        onChange={(e) => setEditingAtividade({
                                            ...editingAtividade,
                                            observacoes: e.target.value
                                        })}
                                        placeholder="Adicione observações sobre a atividade..."
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editingAtividade.realizada}
                                        onChange={(e) => setEditingAtividade({
                                            ...editingAtividade,
                                            realizada: e.target.checked
                                        })}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Marcar como realizada</span>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button
                                        variant="destructive"
                                        onClick={async () => {
                                            if (confirm('Tem certeza que deseja excluir esta atividade?')) {
                                                await removeAtividadePlanejada(editingAtividade.id);
                                                setEditingAtividade(null);
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
                                    </Button>
                                    <div className="flex-1" />
                                    <Button variant="outline" onClick={() => setEditingAtividade(null)}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            await supabase.from('atividades_planejadas').update({
                                                titulo: editingAtividade.titulo,
                                                observacoes: editingAtividade.observacoes,
                                                dia_semana: editingAtividade.dia_semana,
                                                realizada: editingAtividade.realizada
                                            }).eq('id', editingAtividade.id);
                                            setEditingAtividade(null);
                                            getPlanejamentoComAtividades(planejamentoAtual?.id || '');
                                        }}
                                    >
                                        Salvar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Modal: Detalhes do Dia (Timeline) */}
                {selectedDay !== null && planejamentoAtual && (
                    <DayDetailModal
                        isOpen={selectedDay !== null}
                        onClose={() => setSelectedDay(null)}
                        turmaId={params.id as string}
                        dia={selectedDay}
                        dataInicio={currentWeek}
                        atividades={planejamentoAtual.atividades_planejadas?.filter(a => a.dia_semana === selectedDay) || []}
                        onToggleRealizada={(id) => {
                            const ativ = planejamentoAtual.atividades_planejadas?.find(a => a.id === id);
                            if (ativ && !ativ.realizada) {
                                setShowRealizadaModal(ativ);
                                setSelectedDay(null);
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
}
