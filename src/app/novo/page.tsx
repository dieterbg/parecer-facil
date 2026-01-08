"use client";

import { useAuth, supabase } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AudioRecorder } from "@/components/audio-recorder";
import { ArrowLeft, Loader2, Sparkles, Calendar } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Aluno {
    id: string;
    nome: string;
    turma_id: string;
    turma: { nome: string };
}

function NovoParecerContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [alunos, setAlunos] = useState<Aluno[]>([]);
    const [selectedAlunoId, setSelectedAlunoId] = useState<string>(searchParams.get('alunoId') || "");
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [instrucoes, setInstrucoes] = useState("");

    // Período padrão: últimos 3 meses
    const hoje = new Date();
    const tresMesesAtras = new Date(hoje);
    tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);

    const [periodoInicio, setPeriodoInicio] = useState(tresMesesAtras.toISOString().split('T')[0]);
    const [periodoFim, setPeriodoFim] = useState(hoje.toISOString().split('T')[0]);

    // Carregar alunos do professor
    useEffect(() => {
        if (!user) return;
        const fetchAlunos = async () => {
            const { data } = await supabase
                .from('alunos')
                .select('id, nome, turma_id, turma:turmas(nome)')
                .eq('ativo', true);

            if (data) setAlunos(data as any);
        };
        fetchAlunos();
    }, [user]);

    const handleSubmit = async () => {
        if (!user || !selectedAlunoId) return;

        setLoading(true);
        setError(null);

        try {
            let publicUrl = null;

            // 1. Upload Audio if exists
            if (audioBlob) {
                const parecerId = crypto.randomUUID();
                const fileName = `${user.id}/${parecerId}.webm`;
                const { error: uploadError } = await supabase.storage
                    .from('audios')
                    .upload(fileName, audioBlob);

                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('audios').getPublicUrl(fileName);
                publicUrl = data.publicUrl;
            }

            const aluno = alunos.find(a => a.id === selectedAlunoId);
            if (!aluno) throw new Error("Aluno não encontrado");

            // 2. Call Internal API
            const response = await fetch('/api/gerar-parecer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    aluno_id: selectedAlunoId,
                    turma_id: aluno.turma_id,
                    professor_instrucoes: instrucoes,
                    periodo_inicio: periodoInicio,
                    periodo_fim: periodoFim,
                    audio_url: publicUrl
                })
            });

            if (!response.ok) {
                const err = await response.json();
                const errorMessage = err.error || "Erro na geração";

                // Tratamento específico para erro de quota
                if (errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('exceeded')) {
                    setError("⚠️ Limite de uso da IA atingido. Por favor, aguarde alguns minutos e tente novamente, ou verifique sua chave de API do Gemini.");
                } else if (errorMessage.includes('API key')) {
                    setError("🔑 Chave de API do Gemini inválida ou não configurada. Verifique as variáveis de ambiente.");
                } else {
                    setError(`❌ ${errorMessage}`);
                }
                return;
            }

            const { parecer } = await response.json();

            // Redirect to edit page
            router.push(`/parecer/${parecer.id}`);

        } catch (error: any) {
            console.error('Error creating parecer:', error);
            setError(`❌ Erro inesperado: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const alunoSelecionado = alunos.find(a => a.id === selectedAlunoId);

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={alunoSelecionado ? `/alunos/${alunoSelecionado.id}` : "/dashboard"}>
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Gerar Esboço de Parecer</h1>
                        <p className="text-muted-foreground text-sm">
                            Crie um rascunho baseado nos registros do período selecionado
                        </p>
                    </div>
                </div>

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
                            Período dos Registros
                        </CardTitle>
                        <CardDescription>
                            Selecione o período que será considerado para gerar o esboço
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

                <Card>
                    <CardHeader>
                        <CardTitle>Instruções Adicionais</CardTitle>
                        <CardDescription>
                            Adicione orientações para a IA considerar na geração
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            placeholder="Ex: Focar na evolução da escrita, mencionar participação nas atividades em grupo..."
                            value={instrucoes}
                            onChange={e => setInstrucoes(e.target.value)}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Contexto Verbal (Opcional)</CardTitle>
                        <CardDescription>
                            Grave observações que não estão nos registros
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AudioRecorder onAudioReady={setAudioBlob} />
                        <p className="text-sm text-muted-foreground mt-4">
                            A IA usará este áudio junto com os registros do período para enriquecer o esboço.
                        </p>
                    </CardContent>
                </Card>

                {/* Alerta de erro */}
                {error && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
                        <p className="text-sm font-medium">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="text-xs underline mt-2 opacity-70 hover:opacity-100"
                        >
                            Fechar
                        </button>
                    </div>
                )}

                <Button
                    size="lg"
                    className="w-full h-14 text-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    onClick={handleSubmit}
                    disabled={loading || !selectedAlunoId}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Gerando Esboço...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Gerar Esboço de Parecer
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

export default function NovoParecerPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <NovoParecerContent />
        </Suspense>
    );
}
