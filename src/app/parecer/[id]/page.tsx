"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Loader2, PlayCircle, Save, Download } from "lucide-react";
import Link from "next/link";
import { WordEditor } from "@/components/word-editor";

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
    const [saving, setSaving] = useState(false);
    const [editedText, setEditedText] = useState("");

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

    const handleSave = async () => {
        if (!parecer) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('pareceres')
                .update({ resultado_texto: editedText })
                .eq('id', parecer.id);

            if (error) throw error;
            alert('Alterações salvas com sucesso!');
        } catch (error) {
            console.error('Error saving parecer:', error);
            alert('Erro ao salvar alterações.');
        } finally {
            setSaving(false);
        }
    };

    const handleExportWord = () => {
        console.log("Iniciando exportação...");
        if (!parecer) {
            console.error("Parecer não encontrado");
            return;
        }

        try {
            const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Parecer</title></head><body>`;
            const postHtml = "</body></html>";
            const html = preHtml + editedText + postHtml;

            const blob = new Blob(['\ufeff', html], {
                type: 'application/msword'
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Nome simplificado para teste
            const safeName = parecer.aluno_nome ? parecer.aluno_nome.replace(/[^a-zA-Z0-9]/g, '_') : 'parecer';
            link.download = `Parecer_${safeName}.doc`;

            document.body.appendChild(link);
            link.click();

            console.log("Download disparado:", link.download);

            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 500);
        } catch (err) {
            console.error("Erro ao exportar:", err);
            alert("Erro ao gerar o arquivo. Tente novamente.");
        }
    };

    const handleExportPDF = async () => {
        if (!parecer) return;

        try {
            // Import html2pdf dynamically
            const html2pdf = (await import('html2pdf.js')).default;

            const element = document.createElement('div');
            element.innerHTML = `
                <div style="padding: 40px; font-family: Arial, sans-serif;">
                    <h1 style="text-align: center; margin-bottom: 30px;">Parecer Descritivo</h1>
                    <div style="margin-bottom: 20px;">
                        <strong>Aluno:</strong> ${parecer.aluno_nome}<br/>
                        <strong>Data:</strong> ${new Date(parecer.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div style="line-height: 1.6; text-align: justify;">
                        ${editedText}
                    </div>
                </div>
            `;

            const opt = {
                margin: 10,
                filename: `Parecer_${parecer.aluno_nome.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
                image: { type: 'jpeg' as any, quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as any }
            };

            html2pdf().set(opt).from(element).save();

        } catch (error) {
            console.error("Erro ao exportar PDF:", error);
            alert("Erro ao gerar PDF. Tente novamente.");
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
            setEditedText(data.resultado_texto || "");
            setLoading(false);
        };

        fetchParecer();

        // Subscribe to realtime updates for this specific parecer
        const channel = supabase
            .channel(`parecer-${params.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'pareceres',
                    filter: `id=eq.${params.id}`
                },
                (payload) => {
                    const newParecer = payload.new as Parecer;
                    setParecer(newParecer);
                    // Only update text if it was empty or if status changed to completed
                    // This prevents overwriting user edits if they started typing while it was processing
                    if (payload.old.status === 'processando' && newParecer.status === 'concluído') {
                        setEditedText(newParecer.resultado_texto);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
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
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/dashboard">
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold">Detalhes do Parecer</h1>
                    </div>
                    <div className="flex gap-2">
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
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium text-muted-foreground">Informações do Aluno</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold">{parecer.aluno_nome}</h2>
                                    <p className="text-muted-foreground">{parecer.aluno_idade}</p>
                                </div>

                                <div className="flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Data:</span>
                                        <span>{new Date(parecer.created_at).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Status:</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${parecer.status === 'concluído' ? 'bg-green-100 text-green-700' :
                                            parecer.status === 'processando' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {parecer.status}
                                        </span>
                                    </div>
                                </div>

                                {parecer.audio_url && (
                                    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                                        <PlayCircle className="w-4 h-4 text-primary" />
                                        <audio controls src={parecer.audio_url} className="h-8 w-48" />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="min-h-[700px] flex flex-col border-none shadow-none bg-transparent">
                        <CardHeader className="flex flex-row items-center justify-between px-0 pt-0">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Parecer Descritivo
                            </CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleExportWord}
                                    disabled={parecer.status === 'processando'}
                                    className="gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Exportar Word
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleExportPDF}
                                    disabled={parecer.status === 'processando'}
                                    className="gap-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    Exportar PDF
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || parecer.status === 'processando'}
                                    className="gap-2"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Salvar Alterações
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0">
                            {parecer.status === 'processando' ? (
                                <div className="h-[500px] flex flex-col items-center justify-center text-muted-foreground space-y-4 border rounded-md bg-muted/10">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                    <p>A Inteligência Artificial está escrevendo o parecer...</p>
                                    <p className="text-sm">Isso pode levar alguns minutos.</p>
                                </div>
                            ) : (
                                <WordEditor
                                    content={editedText}
                                    onChange={setEditedText}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
