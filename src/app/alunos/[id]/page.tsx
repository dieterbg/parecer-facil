'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Loader2,
    Calendar,
    Camera,
    Star,
    Edit,
    Trash2,
    Plus,
    ChevronRight,
    Sparkles,
    FileText
} from 'lucide-react';
import { supabase } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarcos, useDesenvolvimento } from '@/hooks/use-marcos';
import {
    calcularIdade,
    formatarData,
    AREAS_DESENVOLVIMENTO,
    AREAS_CORES,
    AREAS_ICONES,
    type AreaDesenvolvimento
} from '@/types/database';
import { BnccChart, aggregateBnccTags } from '@/components/bncc-chart';

interface Aluno {
    id: string;
    nome: string;
    data_nascimento: string | null;
    observacoes: string | null;
    foto_url: string | null;
    turma_id: string;
    turma?: {
        id: string;
        nome: string;
    };
}

interface Registro {
    id: string;
    tipo: 'foto' | 'video' | 'audio' | 'texto';
    url_arquivo: string | null;
    descricao: string | null;
    data_registro: string;
    tags_bncc?: string[] | null;
}

export default function AlunoProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [aluno, setAluno] = useState<Aluno | null>(null);
    const [registros, setRegistros] = useState<Registro[]>([]);
    const [pareceres, setPareceres] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'galeria' | 'timeline' | 'marcos' | 'pareceres'>('galeria');

    const { marcos, loading: loadingMarcos, createMarco, deleteMarco, getContagemorArea } = useMarcos({ alunoId: params.id as string });
    const { getNiveisAtuais } = useDesenvolvimento(params.id as string);

    // Estado do formulário de novo marco
    const [showNewMarco, setShowNewMarco] = useState(false);
    const [novoMarco, setNovoMarco] = useState({
        titulo: '',
        descricao: '',
        area: 'social_emocional' as AreaDesenvolvimento,
        data_marco: new Date().toISOString().split('T')[0],
    });
    const [savingMarco, setSavingMarco] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchAlunoData();
        }
    }, [params.id]);

    const fetchAlunoData = async () => {
        try {
            // Buscar aluno com turma
            const { data: alunoData, error: alunoError } = await supabase
                .from('alunos')
                .select(`
          *,
          turma:turmas(id, nome)
        `)
                .eq('id', params.id)
                .single();

            if (alunoError) throw alunoError;
            setAluno(alunoData);

            // Buscar registros do aluno
            const { data: registrosData, error: registrosError } = await supabase
                .from('registros_alunos')
                .select(`
          registro:registros(*)
        `)
                .eq('aluno_id', params.id)
                .order('created_at', { ascending: false });

            if (!registrosError && registrosData) {
                const regs = registrosData
                    .map(r => r.registro)
                    .filter(Boolean)
                    .sort((a: any, b: any) => new Date(b.data_registro).getTime() - new Date(a.data_registro).getTime());
                setRegistros(regs as unknown as Registro[]);
            }

            // Buscar pareceres
            const { data: pareceresData } = await supabase
                .from('pareceres')
                .select('*')
                .eq('aluno_id', params.id)
                .order('created_at', { ascending: false });

            if (pareceresData) {
                setPareceres(pareceresData);
            }
        } catch (error) {
            console.error('Erro:', error);
            router.push('/turmas');
        } finally {
            setLoading(false);
        }
    };

    // Fotos para galeria
    const fotos = useMemo(() => {
        return registros.filter(r => r.tipo === 'foto' && r.url_arquivo);
    }, [registros]);

    // Contagem de marcos por área
    const [marcosPorArea, setMarcosPorArea] = useState<Record<AreaDesenvolvimento, number>>({
        motor_fino: 0, motor_grosso: 0, linguagem_oral: 0, linguagem_escrita: 0,
        matematica: 0, social_emocional: 0, autonomia: 0, criatividade: 0, cognitivo: 0,
    });

    useEffect(() => {
        if (params.id) {
            getContagemorArea(params.id as string).then(contagem => {
                if (contagem) setMarcosPorArea(contagem);
            });
        }
    }, [params.id, marcos]);

    // Salvar novo marco
    const handleSaveMarco = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novoMarco.titulo.trim()) return;

        setSavingMarco(true);
        try {
            await createMarco({
                aluno_id: params.id as string,
                titulo: novoMarco.titulo,
                descricao: novoMarco.descricao || undefined,
                area: novoMarco.area,
                data_marco: novoMarco.data_marco,
            });
            setNovoMarco({
                titulo: '',
                descricao: '',
                area: 'social_emocional',
                data_marco: new Date().toISOString().split('T')[0],
            });
            setShowNewMarco(false);
        } catch (err) {
            console.error('Erro ao salvar marco:', err);
        } finally {
            setSavingMarco(false);
        }
    };

    const handleDeleteMarco = async (id: string) => {
        if (!confirm('Excluir este marco?')) return;
        try {
            await deleteMarco(id);
        } catch (err) {
            console.error('Erro ao excluir marco:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!aluno) return null;

    return (
        <div className="min-h-screen bg-background">
            {/* Header com foto de perfil */}
            <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 pt-8 pb-20">
                <div className="max-w-4xl mx-auto px-4">
                    <Button variant="ghost" size="icon" asChild className="absolute top-4 left-4">
                        <Link href={`/turmas/${aluno.turma_id}`}>
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                    </Button>

                    <div className="flex flex-col items-center text-center">
                        {/* Avatar grande */}
                        <div className="w-32 h-32 rounded-full bg-card border-4 border-background shadow-xl flex items-center justify-center overflow-hidden mb-4">
                            {aluno.foto_url ? (
                                <img
                                    src={aluno.foto_url}
                                    alt={aluno.nome}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-5xl font-bold text-primary">
                                    {aluno.nome.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl font-bold mb-1">{aluno.nome}</h1>

                        {aluno.data_nascimento && (
                            <p className="text-muted-foreground">
                                {calcularIdade(aluno.data_nascimento)} • Nascido em {formatarData(aluno.data_nascimento)}
                            </p>
                        )}

                        {aluno.turma && (
                            <Link
                                href={`/turmas/${aluno.turma.id}`}
                                className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                                {aluno.turma.nome}
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        )}

                        <div className="mt-6 flex flex-wrap gap-3 justify-center">
                            <Button className="rounded-full shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700" asChild>
                                <Link href={`/novo?alunoId=${aluno.id}`}>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Gerar Esboço de Parecer
                                </Link>
                            </Button>
                            <Button variant="outline" className="rounded-full" asChild>
                                <Link href={`/relatorio?alunoId=${aluno.id}`}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Relatório de Atividades
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats rápidos */}
            <div className="max-w-4xl mx-auto px-4 -mt-10">
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card className="text-center">
                        <CardContent className="pt-4 pb-3">
                            <div className="text-2xl font-bold text-primary">{registros.length}</div>
                            <div className="text-xs text-muted-foreground">Registros</div>
                        </CardContent>
                    </Card>
                    <Card className="text-center">
                        <CardContent className="pt-4 pb-3">
                            <div className="text-2xl font-bold text-primary">{fotos.length}</div>
                            <div className="text-xs text-muted-foreground">Fotos</div>
                        </CardContent>
                    </Card>
                    <Card className="text-center">
                        <CardContent className="pt-4 pb-3">
                            <div className="text-2xl font-bold text-primary">{marcos.length}</div>
                            <div className="text-xs text-muted-foreground">Marcos</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-border mb-6">
                    <button
                        onClick={() => setActiveTab('galeria')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'galeria'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Camera className="w-4 h-4 inline-block mr-2" />
                        Galeria
                    </button>
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'timeline'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Calendar className="w-4 h-4 inline-block mr-2" />
                        Timeline
                    </button>
                    <button
                        onClick={() => setActiveTab('marcos')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'marcos'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Star className="w-4 h-4 inline-block mr-2" />
                        Marcos
                    </button>
                    <button
                        onClick={() => setActiveTab('pareceres')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'pareceres'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <FileText className="w-4 h-4 inline-block mr-2" />
                        Pareceres
                    </button>
                </div>

                {/* Tab: Galeria */}
                {activeTab === 'galeria' && (
                    <div>
                        {fotos.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium mb-2">Nenhuma foto ainda</h3>
                                <p>Fotos registradas aparecerão aqui</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {fotos.map(foto => (
                                    <div
                                        key={foto.id}
                                        className="aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                                    >
                                        <img
                                            src={foto.url_arquivo!}
                                            alt={foto.descricao || 'Foto'}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Timeline */}
                {activeTab === 'timeline' && (
                    <div className="space-y-4">
                        {registros.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium mb-2">Nenhum registro ainda</h3>
                                <p>Registros deste aluno aparecerão aqui</p>
                            </div>
                        ) : (
                            registros.map(registro => (
                                <Card key={registro.id}>
                                    <CardContent className="p-4">
                                        <div className="flex gap-3">
                                            {/* Tipo */}
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                {registro.tipo === 'foto' && '📸'}
                                                {registro.tipo === 'video' && '🎬'}
                                                {registro.tipo === 'audio' && '🎙️'}
                                                {registro.tipo === 'texto' && '✏️'}
                                            </div>

                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground mb-2">
                                                    {formatarData(registro.data_registro)}
                                                </p>

                                                {registro.tipo === 'foto' && registro.url_arquivo && (
                                                    <img
                                                        src={registro.url_arquivo}
                                                        alt="Registro"
                                                        className="max-h-48 rounded-lg object-cover mb-2"
                                                    />
                                                )}

                                                {registro.descricao && (
                                                    <p className="text-sm">{registro.descricao}</p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* Tab: Marcos */}
                {activeTab === 'marcos' && (
                    <div className="space-y-6">
                        {/* Gráfico BNCC */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Cobertura BNCC (Campos de Experiência)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <BnccChart data={aggregateBnccTags(registros)} type="bar" />
                            </CardContent>
                        </Card>

                        {/* Indicadores por área */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Desenvolvimento por Área</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-3">
                                    {(Object.entries(AREAS_DESENVOLVIMENTO) as [AreaDesenvolvimento, string][]).map(([area, label]) => (
                                        <div
                                            key={area}
                                            className="text-center p-3 rounded-lg bg-muted/50"
                                        >
                                            <div className="text-2xl mb-1">{AREAS_ICONES[area]}</div>
                                            <div
                                                className="text-lg font-bold"
                                                style={{ color: AREAS_CORES[area] }}
                                            >
                                                {marcosPorArea[area]}
                                            </div>
                                            <div className="text-xs text-muted-foreground leading-tight">
                                                {area === 'motor_fino' ? 'M. Fina' :
                                                    area === 'motor_grosso' ? 'M. Grossa' :
                                                        label.split(' ')[0]}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Botão novo marco */}
                        <div className="flex justify-end">
                            <Button onClick={() => setShowNewMarco(!showNewMarco)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Marco
                            </Button>
                        </div>

                        {/* Formulário novo marco */}
                        {showNewMarco && (
                            <Card className="bg-muted/50">
                                <CardContent className="pt-6">
                                    <form onSubmit={handleSaveMarco} className="space-y-4">
                                        <input
                                            type="text"
                                            placeholder="Título do marco"
                                            value={novoMarco.titulo}
                                            onChange={e => setNovoMarco({ ...novoMarco, titulo: e.target.value })}
                                            className="w-full px-4 py-2 bg-card rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            required
                                        />
                                        <textarea
                                            placeholder="Descrição (opcional)"
                                            value={novoMarco.descricao}
                                            onChange={e => setNovoMarco({ ...novoMarco, descricao: e.target.value })}
                                            rows={2}
                                            className="w-full px-4 py-2 bg-card rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <select
                                                value={novoMarco.area}
                                                onChange={e => setNovoMarco({ ...novoMarco, area: e.target.value as AreaDesenvolvimento })}
                                                className="px-4 py-2 bg-card rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            >
                                                {(Object.entries(AREAS_DESENVOLVIMENTO) as [AreaDesenvolvimento, string][]).map(([area, label]) => (
                                                    <option key={area} value={area}>{AREAS_ICONES[area]} {label}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="date"
                                                value={novoMarco.data_marco}
                                                onChange={e => setNovoMarco({ ...novoMarco, data_marco: e.target.value })}
                                                className="px-4 py-2 bg-card rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <Button type="submit" disabled={savingMarco}>
                                                {savingMarco ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => setShowNewMarco(false)}>
                                                Cancelar
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {/* Lista de marcos */}
                        {loadingMarcos ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : marcos.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Star className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium mb-2">Nenhum marco registrado</h3>
                                <p>Registre conquistas e progressos do aluno</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {marcos.map(marco => (
                                    <Card key={marco.id} className="group">
                                        <CardContent className="p-4">
                                            <div className="flex gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xl"
                                                    style={{ backgroundColor: `${AREAS_CORES[marco.area]}20` }}
                                                >
                                                    {AREAS_ICONES[marco.area]}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h4 className="font-medium">{marco.titulo}</h4>
                                                            <p className="text-xs text-muted-foreground">
                                                                {AREAS_DESENVOLVIMENTO[marco.area]} • {formatarData(marco.data_marco)}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive"
                                                            onClick={() => handleDeleteMarco(marco.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    {marco.descricao && (
                                                        <p className="text-sm text-muted-foreground mt-2">{marco.descricao}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Pareceres */}
                {activeTab === 'pareceres' && (
                    <div className="space-y-4">
                        {pareceres.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium mb-2">Nenhum parecer gerado</h3>
                                <p className="mb-4">Gere o primeiro parecer para este aluno</p>
                                <Button asChild>
                                    <Link href={`/novo?alunoId=${aluno.id}`}>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Gerar Esboço de Parecer
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            pareceres.map(parecer => (
                                <Card key={parecer.id} className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="p-4">
                                        <Link href={`/parecer/${parecer.id}`}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">
                                                        {new Date(parecer.created_at).toLocaleDateString('pt-BR', {
                                                            day: '2-digit', month: 'long', year: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground capitalize">
                                                        Status: {parecer.status}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
