"use client";

import { useAuth, supabase } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AudioRecorder } from "@/components/audio-recorder";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NovoParecerPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [nome, setNome] = useState("");
    const [idade, setIdade] = useState("");
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const handleSubmit = async () => {
        if (!user || !audioBlob || !nome) return;

        setLoading(true);
        try {
            // 1. Upload Audio
            const parecerId = crypto.randomUUID();
            const fileName = `${user.id}/${parecerId}.webm`;

            const { error: uploadError } = await supabase.storage
                .from('audios')
                .upload(fileName, audioBlob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('audios')
                .getPublicUrl(fileName);

            // 2. Create Database Record
            const { error: dbError } = await supabase
                .from('pareceres')
                .insert({
                    id: parecerId,
                    uid_professor: user.id,
                    aluno_nome: nome,
                    aluno_idade: idade,
                    audio_url: publicUrl,
                    status: 'processando'
                });

            if (dbError) throw dbError;

            // 3. Call n8n Webhook (via Proxy)
            console.log('Calling internal webhook proxy...');

            try {
                const response = await fetch('/api/webhook', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        parecerId,
                        professorUid: user.id
                    })
                });

                console.log('Proxy response status:', response.status);

                if (!response.ok) {
                    const text = await response.text();
                    console.error('Webhook proxy error:', text);
                }
            } catch (fetchError) {
                console.error('Fetch error details:', fetchError);
            }

            router.push('/dashboard');
        } catch (error) {
            console.error('Error creating parecer:', error);
            alert('Erro ao criar parecer. Tente novamente.');
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
                    <h1 className="text-2xl font-bold">Novo Parecer</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Dados do Aluno</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nome do Aluno</label>
                                <Input
                                    placeholder="Ex: João Silva"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Idade / Turma</label>
                                <Input
                                    placeholder="Ex: 4 anos - Maternal II"
                                    value={idade}
                                    onChange={(e) => setIdade(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Observações em Áudio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AudioRecorder onAudioReady={setAudioBlob} />
                        <p className="text-sm text-muted-foreground mt-4">
                            Grave um áudio descrevendo o desenvolvimento do aluno, pontos fortes e áreas a desenvolver. Fale naturalmente.
                        </p>
                    </CardContent>
                </Card>

                <Button
                    size="lg"
                    className="w-full h-14 text-lg"
                    onClick={handleSubmit}
                    disabled={loading || !audioBlob || !nome}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Enviando...
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
