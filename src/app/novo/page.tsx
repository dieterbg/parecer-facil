"use client";

import { useAuth, supabase } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AudioRecorder } from "@/components/audio-recorder";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Aluno {
    id: string;
    nome: string;
    turma_id: string;
    turma: { nome: string };
}

export default function NovoParecerPage() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(false);
    const [alunos, setAlunos] = useState<Aluno[]>([]);
    const [selectedAlunoId, setSelectedAlunoId] = useState<string>(searchParams.get('alunoId') || "");
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [instrucoes, setInstrucoes] = useState("");

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
                    periodo_inicio: '2024-01-01', // TODO: Permitir selecionar datas
                    periodo_fim: new Date().toISOString(),
                    audio_url: publicUrl
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Erro na geração");
            }

            const { parecer } = await response.json();

            // Redirect to edit page
            router.push(`/parecer/${parecer.id}`);

        } catch (error: any) {
            console.error('Error creating parecer:', error);
            alert(`Erro: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Novo Parecer Descritivo (IA)</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Configuração</CardTitle>
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

                        <div className="space-y-2">
                            <Label>Instruções Adicionais (Opcional)</Label>
                            <Input
                                placeholder="Ex: Focar na evolução da escrita..."
                                value={instrucoes}
                                onChange={e => setInstrucoes(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Contexto Verbal (Opcional)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AudioRecorder onAudioReady={setAudioBlob} />
                        <p className="text-sm text-muted-foreground mt-4">
                            Grave um áudio descrevendo pontos que não estão nos registros. A IA usará isso junto com as evidências do sistema.
                        </p>
                    </CardContent>
                </Card>

                <Button
                    size="lg"
                    className="w-full h-14 text-lg"
                    onClick={handleSubmit}
                    disabled={loading || !selectedAlunoId}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Gerando Parecer...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-5 w-5" />
                            Gerar Parecer com IA
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

