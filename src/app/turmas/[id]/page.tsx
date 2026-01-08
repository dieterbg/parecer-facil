"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Users, Loader2, Trash2, FileSpreadsheet, ExternalLink, Camera } from "lucide-react";
import Link from "next/link";
import { ImportadorExcel } from "@/components/importador-excel";
import { TimelineView } from "@/components/timeline";

import { calcularIdade } from "@/types/database";

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
    const [activeTab, setActiveTab] = useState<'alunos' | 'registros'>('registros');


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
                        onClick={() => setActiveTab('registros')}
                        className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${activeTab === 'registros'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        📷 Registros
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

                {/* Tab: Registros (Timeline) */}
                {activeTab === 'registros' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Camera className="w-5 h-5" />
                                Registros e Observações
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TimelineView turmaId={turma.id} />
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
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Pequeno timeout para garantir que UI não bloqueie
                                                        setTimeout(() => handleDeleteAluno(aluno.id, aluno.nome), 10);
                                                    }}
                                                >
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


            </div>
        </div>
    );
}

