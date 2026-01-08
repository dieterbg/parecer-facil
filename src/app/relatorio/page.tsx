"use client";

import { useAuth, supabase } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, FileText, Calendar, Download, Printer } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatarData, AREAS_DESENVOLVIMENTO, AREAS_ICONES, AreaDesenvolvimento } from "@/types/database";

interface Aluno {
    id: string;
    nome: string;
    turma_id: string;
    data_nascimento: string | null;
    turma: { nome: string };
}

interface Registro {
    id: string;
    tipo: 'foto' | 'video' | 'audio' | 'texto';
    url_arquivo: string | null;
    descricao: string | null;
    data_registro: string;
    tags_bncc?: string[];
    transcricao_voz?: string;
    contexto?: { nome: string; emoji?: string } | null;
}

interface Marco {
    id: string;
    titulo: string;
    descricao: string | null;
    area: AreaDesenvolvimento;
    data_marco: string;
}

function RelatorioContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [alunos, setAlunos] = useState<Aluno[]>([]);
    const [selectedAlunoId, setSelectedAlunoId] = useState<string>(searchParams.get('alunoId') || "");

    const [registros, setRegistros] = useState<Registro[]>([]);
    const [marcos, setMarcos] = useState<Marco[]>([]);
    const [showReport, setShowReport] = useState(false);

    // Período padrão: últimos 6 meses
    const hoje = new Date();
    const seisMesesAtras = new Date(hoje);
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

    const [periodoInicio, setPeriodoInicio] = useState(seisMesesAtras.toISOString().split('T')[0]);
    const [periodoFim, setPeriodoFim] = useState(hoje.toISOString().split('T')[0]);

    // Carregar alunos do professor
    useEffect(() => {
        if (!user) return;
        const fetchAlunos = async () => {
            const { data } = await supabase
                .from('alunos')
                .select('id, nome, turma_id, data_nascimento, turma:turmas(nome)')
                .eq('ativo', true);

            if (data) setAlunos(data as any);
        };
        fetchAlunos();
    }, [user]);

    const handleGerarRelatorio = async () => {
        if (!selectedAlunoId) return;

        setGenerating(true);
        try {
            // Buscar registros do período
            const { data: registrosData } = await supabase
                .from('registros_alunos')
                .select(`
                    registro:registros(
                        id, tipo, url_arquivo, descricao, data_registro, 
                        tags_bncc, transcricao_voz,
                        contexto:contextos(nome, emoji)
                    )
                `)
                .eq('aluno_id', selectedAlunoId);

            if (registrosData) {
                const regs = registrosData
                    .map(r => r.registro)
                    .filter(Boolean)
                    .filter((r: any) => {
                        const dataReg = new Date(r.data_registro);
                        return dataReg >= new Date(periodoInicio) && dataReg <= new Date(periodoFim);
                    })
                    .sort((a: any, b: any) => new Date(a.data_registro).getTime() - new Date(b.data_registro).getTime());
                setRegistros(regs as unknown as Registro[]);
            }

            // Buscar marcos do período
            const { data: marcosData } = await supabase
                .from('marcos_desenvolvimento')
                .select('*')
                .eq('aluno_id', selectedAlunoId)
                .gte('data_marco', periodoInicio)
                .lte('data_marco', periodoFim)
                .order('data_marco', { ascending: true });

            if (marcosData) {
                setMarcos(marcosData);
            }

            setShowReport(true);
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
        } finally {
            setGenerating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const alunoSelecionado = alunos.find(a => a.id === selectedAlunoId);

    // Agrupar registros por mês
    const registrosPorMes = registros.reduce((acc, reg) => {
        const mesAno = new Date(reg.data_registro).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        if (!acc[mesAno]) acc[mesAno] = [];
        acc[mesAno].push(reg);
        return acc;
    }, {} as Record<string, Registro[]>);

    // Estatísticas
    const stats = {
        totalRegistros: registros.length,
        fotos: registros.filter(r => r.tipo === 'foto').length,
        audios: registros.filter(r => r.tipo === 'audio').length,
        videos: registros.filter(r => r.tipo === 'video').length,
        textos: registros.filter(r => r.tipo === 'texto').length,
        marcos: marcos.length,
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 print:p-0 print:bg-white">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header - escondido na impressão */}
                <div className="flex items-center gap-4 print:hidden">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={alunoSelecionado ? `/alunos/${alunoSelecionado.id}` : "/dashboard"}>
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Relatório de Atividades</h1>
                        <p className="text-muted-foreground text-sm">
                            Resumo dos registros e marcos do aluno
                        </p>
                    </div>
                </div>

                {/* Configuração - escondida na impressão */}
                {!showReport && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>Aluno</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Selecione o Aluno</Label>
                                    <Select value={selectedAlunoId} onValueChange={setSelectedAlunoId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {alunos.map(aluno => (
                                                <SelectItem key={aluno.id} value={aluno.id}>
                                                    {aluno.nome} ({aluno.turma?.nome})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Período do Relatório
                                </CardTitle>
                                <CardDescription>
                                    Selecione o período para incluir no relatório
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Data Início</Label>
                                        <Input
                                            type="date"
                                            value={periodoInicio}
                                            onChange={e => setPeriodoInicio(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Data Fim</Label>
                                        <Input
                                            type="date"
                                            value={periodoFim}
                                            onChange={e => setPeriodoFim(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Button
                            size="lg"
                            className="w-full h-14 text-lg"
                            onClick={handleGerarRelatorio}
                            disabled={generating || !selectedAlunoId}
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Gerando Relatório...
                                </>
                            ) : (
                                <>
                                    <FileText className="mr-2 h-5 w-5" />
                                    Gerar Relatório
                                </>
                            )}
                        </Button>
                    </>
                )}

                {/* Relatório Gerado */}
                {showReport && alunoSelecionado && (
                    <div className="space-y-6">
                        {/* Ações - escondidas na impressão */}
                        <div className="flex gap-2 print:hidden">
                            <Button variant="outline" onClick={() => setShowReport(false)}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Voltar
                            </Button>
                            <Button variant="outline" onClick={handlePrint}>
                                <Printer className="w-4 h-4 mr-2" />
                                Imprimir
                            </Button>
                        </div>

                        {/* Cabeçalho do Relatório */}
                        <Card className="print:shadow-none print:border-0">
                            <CardHeader className="text-center border-b">
                                <CardTitle className="text-2xl">Relatório de Atividades</CardTitle>
                                <CardDescription className="text-base">
                                    <strong>{alunoSelecionado.nome}</strong> • {alunoSelecionado.turma?.nome}
                                </CardDescription>
                                <p className="text-sm text-muted-foreground">
                                    Período: {formatarData(periodoInicio)} a {formatarData(periodoFim)}
                                </p>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {/* Estatísticas */}
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <div className="text-2xl font-bold text-primary">{stats.totalRegistros}</div>
                                        <div className="text-xs text-muted-foreground">Total</div>
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-500">{stats.fotos}</div>
                                        <div className="text-xs text-muted-foreground">📸 Fotos</div>
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-500">{stats.audios}</div>
                                        <div className="text-xs text-muted-foreground">🎙️ Áudios</div>
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <div className="text-2xl font-bold text-red-500">{stats.videos}</div>
                                        <div className="text-xs text-muted-foreground">🎬 Vídeos</div>
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <div className="text-2xl font-bold text-amber-500">{stats.textos}</div>
                                        <div className="text-xs text-muted-foreground">✏️ Textos</div>
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <div className="text-2xl font-bold text-purple-500">{stats.marcos}</div>
                                        <div className="text-xs text-muted-foreground">⭐ Marcos</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Marcos do Período */}
                        {marcos.length > 0 && (
                            <Card className="print:shadow-none print:border-0">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        ⭐ Marcos de Desenvolvimento
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {marcos.map(marco => (
                                            <div key={marco.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                                                <div className="text-2xl">{AREAS_ICONES[marco.area]}</div>
                                                <div className="flex-1">
                                                    <div className="font-medium">{marco.titulo}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {AREAS_DESENVOLVIMENTO[marco.area]} • {formatarData(marco.data_marco)}
                                                    </div>
                                                    {marco.descricao && (
                                                        <p className="text-sm mt-1">{marco.descricao}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Registros por Mês */}
                        {Object.entries(registrosPorMes).map(([mesAno, regs]) => (
                            <Card key={mesAno} className="print:shadow-none print:border-0">
                                <CardHeader>
                                    <CardTitle className="capitalize">{mesAno}</CardTitle>
                                    <CardDescription>{regs.length} registro(s)</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {regs.map(reg => (
                                            <div key={reg.id} className="flex gap-3 p-3 border rounded-lg">
                                                <div className="text-xl">
                                                    {reg.tipo === 'foto' && '📸'}
                                                    {reg.tipo === 'video' && '🎬'}
                                                    {reg.tipo === 'audio' && '🎙️'}
                                                    {reg.tipo === 'texto' && '✏️'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs text-muted-foreground mb-1">
                                                        {formatarData(reg.data_registro)}
                                                        {reg.contexto && ` • ${reg.contexto.emoji || ''} ${reg.contexto.nome}`}
                                                    </div>
                                                    {reg.tipo === 'foto' && reg.url_arquivo && (
                                                        <img
                                                            src={reg.url_arquivo}
                                                            alt="Registro"
                                                            className="max-h-40 rounded-lg object-cover mb-2 print:max-h-24"
                                                        />
                                                    )}
                                                    {reg.descricao && (
                                                        <p className="text-sm">{reg.descricao}</p>
                                                    )}
                                                    {reg.transcricao_voz && (
                                                        <p className="text-sm italic text-muted-foreground mt-1">
                                                            "{reg.transcricao_voz}"
                                                        </p>
                                                    )}
                                                    {reg.tags_bncc && reg.tags_bncc.length > 0 && (
                                                        <div className="flex gap-1 mt-2 flex-wrap">
                                                            {reg.tags_bncc.map(tag => (
                                                                <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {registros.length === 0 && marcos.length === 0 && (
                            <Card>
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <h3 className="text-lg font-medium mb-2">Nenhum registro encontrado</h3>
                                    <p>Não há registros ou marcos no período selecionado.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function RelatorioPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <RelatorioContent />
        </Suspense>
    );
}
