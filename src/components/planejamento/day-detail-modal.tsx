'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Camera, FileText, Video, Mic, Check, Clock, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRegistros } from '@/hooks/use-registros';
import { DIAS_SEMANA, type AtividadePlanejada, type Registro, type TipoRegistro } from '@/types/database';

interface DayDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    turmaId: string;
    dia: number; // 1-5 (seg-sex)
    dataInicio: Date; // segunda-feira da semana
    atividades: AtividadePlanejada[];
    alunos?: { id: string; nome: string }[]; // Lista de alunos para filtro
    onToggleRealizada?: (id: string) => void;
}

export function DayDetailModal({
    isOpen,
    onClose,
    turmaId,
    dia,
    dataInicio,
    atividades,
    alunos = [],
    onToggleRealizada
}: DayDetailModalProps) {
    const [showNewRegistro, setShowNewRegistro] = useState(false);
    const [tipoRegistro, setTipoRegistro] = useState<TipoRegistro>('texto');
    const [textoRegistro, setTextoRegistro] = useState('');
    const [saving, setSaving] = useState(false);
    const [registrosDoDia, setRegistrosDoDia] = useState<Registro[]>([]);
    const [selectedAlunoId, setSelectedAlunoId] = useState<string>('todos');

    // Buscar todos os registros do usuário (sem filtro por turma pois registros podem não ter alunos vinculados)
    const { registros, loading: loadingRegistros, createRegistro, refetch } = useRegistros({});

    // Calcular a data específica do dia
    const dataDia = new Date(dataInicio);
    dataDia.setDate(dataDia.getDate() + (dia - 1)); // dia 1 = segunda = +0

    // Filtrar registros do dia usando comparação local (evita problemas de fuso)
    useEffect(() => {
        if (registros) {
            const filtered = registros.filter(r => {
                // Usar data_registro se disponível, senão created_at
                const regDate = new Date(r.data_registro || r.created_at);
                // Comparar ano, mês e dia locais (mesmo método do WeeklyCalendar)
                // Comparar ano, mês e dia locais (mesmo método do WeeklyCalendar)
                const isSameDay = regDate.getFullYear() === dataDia.getFullYear() &&
                    regDate.getMonth() === dataDia.getMonth() &&
                    regDate.getDate() === dataDia.getDate();

                if (!isSameDay) return false;

                // Filtro por aluno
                if (selectedAlunoId !== 'todos') {
                    // Verificar se o registro tem o aluno vinculado
                    // Precisamos acessar registros_alunos que vem no RegistroComDetalhes
                    const regComDetalhes = r as any; // Cast temporário pois Registro não tem registros_alunos na interface base
                    if (regComDetalhes.registros_alunos && Array.isArray(regComDetalhes.registros_alunos)) {
                        return regComDetalhes.registros_alunos.some((ra: any) => ra.aluno?.id === selectedAlunoId || ra.aluno_id === selectedAlunoId);
                    }
                    return false;
                }

                return true;
            });
            setRegistrosDoDia(filtered);
        }
    }, [registros, dataDia.getFullYear(), dataDia.getMonth(), dataDia.getDate(), selectedAlunoId]);

    // Carregar registros quando abrir
    useEffect(() => {
        if (isOpen) {
            refetch();
        }
    }, [isOpen, refetch]);

    const handleSaveRegistro = async () => {
        if (!textoRegistro.trim() && tipoRegistro === 'texto') return;

        setSaving(true);
        try {
            await createRegistro({
                tipo: tipoRegistro,
                descricao: textoRegistro || `Registro de ${tipoRegistro}`,
                data_registro: dataDia.toISOString().split('T')[0], // Vincula ao dia correto
            }, []);
            setTextoRegistro('');
            setShowNewRegistro(false);
            await refetch();
        } catch (err) {
            console.error('Erro ao criar registro:', err);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <CardHeader className="border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">
                                {DIAS_SEMANA[dia]}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                {dataDia.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-4 overflow-y-auto flex-1 space-y-6">
                    {/* Seção: Atividades Planejadas */}
                    <div>
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                            📋 Atividades Planejadas ({atividades.length})
                        </h3>
                        {atividades.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">
                                Nenhuma atividade planejada para este dia.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {atividades.map(ativ => (
                                    <div
                                        key={ativ.id}
                                        className={`p-3 rounded-lg border flex items-center justify-between ${ativ.realizada ? 'bg-green-50 border-green-200' : 'bg-card'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-full shrink-0"
                                                style={{ backgroundColor: ativ.realizada ? '#22c55e' : ativ.cor }}
                                            />
                                            <div>
                                                <p className={`font-medium ${ativ.realizada ? 'text-green-700' : ''}`}>
                                                    {ativ.realizada && '✅ '}{ativ.titulo}
                                                </p>
                                                {ativ.duracao_minutos > 0 && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {ativ.duracao_minutos}min
                                                    </p>
                                                )}
                                                {ativ.observacoes && (
                                                    <p className="text-xs text-green-700 mt-1 italic">
                                                        "{ativ.observacoes}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {!ativ.realizada && onToggleRealizada && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onToggleRealizada(ativ.id)}
                                                className="shrink-0"
                                            >
                                                <Check className="w-4 h-4 mr-1" />
                                                Marcar
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Seção: Registros do Dia */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                📷 Registros do Dia ({registrosDoDia.length})
                            </h3>
                            <div className="flex gap-2">
                                {alunos && alunos.length > 0 && (
                                    <div className="relative">
                                        <select
                                            className="h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={selectedAlunoId}
                                            onChange={(e) => setSelectedAlunoId(e.target.value)}
                                        >
                                            <option value="todos">Todos os alunos</option>
                                            {alunos.map(aluno => (
                                                <option key={aluno.id} value={aluno.id}>
                                                    {aluno.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <Button size="sm" onClick={() => setShowNewRegistro(true)}>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Novo Registro
                                </Button>
                            </div>
                        </div>

                        {loadingRegistros ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : registrosDoDia.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">
                                Nenhum registro para este dia.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {registrosDoDia.map(reg => (
                                    <div key={reg.id} className="p-3 rounded-lg border bg-card">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                {reg.tipo === 'foto' && <Camera className="w-5 h-5 text-primary" />}
                                                {reg.tipo === 'video' && <Video className="w-5 h-5 text-primary" />}
                                                {reg.tipo === 'audio' && <Mic className="w-5 h-5 text-primary" />}
                                                {reg.tipo === 'texto' && <FileText className="w-5 h-5 text-primary" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {reg.tipo === 'foto' && reg.url_arquivo ? (
                                                    <img
                                                        src={reg.url_arquivo}
                                                        alt="Registro"
                                                        className="w-full max-h-40 object-cover rounded-lg mb-2"
                                                    />
                                                ) : null}
                                                <p className="text-sm">{reg.descricao}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(reg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Form: Novo Registro */}
                    {showNewRegistro && (
                        <div className="border-t pt-4">
                            <h3 className="font-semibold mb-3">Novo Registro</h3>

                            {/* Tipo de registro */}
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {([
                                    { tipo: 'foto', icon: Camera, label: 'Foto' },
                                    { tipo: 'texto', icon: FileText, label: 'Texto' },
                                    { tipo: 'video', icon: Video, label: 'Vídeo' },
                                    { tipo: 'audio', icon: Mic, label: 'Áudio' },
                                ] as const).map(({ tipo, icon: Icon, label }) => (
                                    <button
                                        key={tipo}
                                        onClick={() => setTipoRegistro(tipo)}
                                        className={`p-3 rounded-lg border text-center transition-all ${tipoRegistro === tipo
                                            ? 'ring-2 ring-primary bg-primary/10'
                                            : 'hover:bg-muted'
                                            }`}
                                    >
                                        <Icon className="w-6 h-6 mx-auto mb-1" />
                                        <span className="text-xs">{label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Campo de texto */}
                            <div className="mb-4">
                                <Input
                                    placeholder={tipoRegistro === 'texto' ? 'Escreva sua observação...' : 'Descrição (opcional)'}
                                    value={textoRegistro}
                                    onChange={(e) => setTextoRegistro(e.target.value)}
                                />
                            </div>

                            {/* Botões */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setShowNewRegistro(false);
                                        setTextoRegistro('');
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1"
                                    disabled={saving || (tipoRegistro === 'texto' && !textoRegistro.trim())}
                                    onClick={handleSaveRegistro}
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
