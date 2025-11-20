"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, FileText, PlayCircle } from "lucide-react";
import Link from "next/link";

interface Parecer {
    id: string;
    aluno_nome: string;
    aluno_idade: string;
    resultado_texto: string;
    audio_url: string;
    status: string;
    created_at: string;
}

export default function ParecerDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [parecer, setParecer] = useState<Parecer | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!parecer) return;

        const confirmDelete = confirm(`Tem certeza que deseja excluir o parecer de ${parecer.aluno_nome}? Esta ação não pode ser desfeita.`);
        if (!confirmDelete) return;

        setDeleting(true);
        try {
            const { error } = await supabase
                .from('pareceres')
                .delete()
                .eq('id', parecer.id);

            if (error) throw error;

            alert('Parecer excluído com sucesso!');
            router.push('/dashboard');
        } catch (error) {
            console.error('Error deleting parecer:', error);
            alert('Erro ao excluir parecer.');
            setDeleting(false);
        }
    };

    useEffect(() => {
        const fetchParecer = async () => {
            if (!params.id) return;

            const { data, error } = await supabase
                .from('pareceres')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error) {
                console.error('Error fetching parecer:', error);
                alert('Erro ao carregar o parecer.');
                router.push('/dashboard');
                return;
            }

            setParecer(data);
            setLoading(false);
        };

        fetchParecer();
    }, [params.id, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!parecer) return null;

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/dashboard">
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold">Detalhes do Parecer</h1>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="gap-2"
                    >
                        {deleting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Excluindo...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Excluir
                            </>
                        )}
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Aluno: {parecer.aluno_nome}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-semibold">Idade/Turma:</span> {parecer.aluno_idade}
                            </div>
                            <div>
                                <span className="font-semibold">Data:</span> {new Date(parecer.created_at).toLocaleDateString('pt-BR')}
                            </div>
                        </div>

                        {parecer.audio_url && (
                            <div className="mt-4 p-4 bg-muted rounded-lg">
                                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <PlayCircle className="w-4 h-4" />
                                    Áudio Original
                                </h3>
                                <audio controls src={parecer.audio_url} className="w-full" />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="min-h-[400px]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Parecer Gerado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose max-w-none whitespace-pre-wrap leading-relaxed text-foreground/90 text-lg">
                            {parecer.resultado_texto || "O texto ainda está sendo gerado..."}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
