"use client";

import { useEffect, useState } from "react";
import { useAuth, supabase } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Users, Loader2, Trash2, Edit, Calendar } from "lucide-react";
import Link from "next/link";

interface Turma {
    id: string;
    nome: string;
    ano_letivo: string;
    escola: string | null;
    created_at: string;
    alunos_count?: number;
}

export default function TurmasPage() {
    const { user } = useAuth();
    const [turmas, setTurmas] = useState<Turma[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewTurma, setShowNewTurma] = useState(false);
    const [novaTurma, setNovaTurma] = useState({
        nome: "",
        ano_letivo: new Date().getFullYear().toString(),
        escola: ""
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            fetchTurmas();
        }
    }, [user]);

    const fetchTurmas = async () => {
        try {
            const { data, error } = await supabase
                .from('turmas')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Buscar contagem de alunos para cada turma
            const turmasComContagem = await Promise.all(
                (data || []).map(async (turma) => {
                    const { count } = await supabase
                        .from('alunos')
                        .select('*', { count: 'exact', head: true })
                        .eq('turma_id', turma.id);

                    return { ...turma, alunos_count: count || 0 };
                })
            );

            setTurmas(turmasComContagem);
        } catch (error) {
            console.error('Erro ao buscar turmas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTurma = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novaTurma.nome.trim()) {
            alert('Por favor, preencha o nome da turma.');
            return;
        }

        if (!user) {
            alert('Usuário não autenticado.');
            return;
        }

        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('turmas')
                .insert([{
                    user_id: user.id,
                    nome: novaTurma.nome,
                    ano_letivo: novaTurma.ano_letivo,
                    escola: novaTurma.escola || null
                }])
                .select();

            if (error) {
                console.error('Erro detalhado:', error);
                throw error;
            }

            console.log('Turma criada com sucesso:', data);
            setNovaTurma({ nome: "", ano_letivo: new Date().getFullYear().toString(), escola: "" });
            setShowNewTurma(false);
            fetchTurmas();
        } catch (error) {
            console.error('Erro ao criar turma:', error);
            alert('Erro ao criar turma. Verifique o console para mais detalhes.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTurma = async (id: string, nome: string) => {
        if (!confirm(`Tem certeza que deseja excluir a turma "${nome}"? Todos os alunos e registros vinculados serão excluídos.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('turmas')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchTurmas();
        } catch (error) {
            console.error('Erro ao excluir turma:', error);
            alert('Erro ao excluir turma.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Minhas Turmas</h1>
                        <p className="text-muted-foreground mt-1">Gerencie suas turmas e alunos</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/planejamento" className="gap-2">
                                <Calendar className="w-4 h-4" />
                                Planejamento
                            </Link>
                        </Button>
                        <Button onClick={() => setShowNewTurma(!showNewTurma)} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Nova Turma
                        </Button>
                    </div>
                </div>

                {showNewTurma && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Criar Nova Turma</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateTurma} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Nome da Turma *</label>
                                    <Input
                                        placeholder="Ex: Jardim II A"
                                        value={novaTurma.nome}
                                        onChange={(e) => setNovaTurma({ ...novaTurma, nome: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Ano Letivo</label>
                                        <Input
                                            placeholder="2025"
                                            value={novaTurma.ano_letivo}
                                            onChange={(e) => setNovaTurma({ ...novaTurma, ano_letivo: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Escola (Opcional)</label>
                                        <Input
                                            placeholder="Nome da escola"
                                            value={novaTurma.escola}
                                            onChange={(e) => setNovaTurma({ ...novaTurma, escola: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" disabled={saving}>
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Turma"}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setShowNewTurma(false)}>
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {turmas.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Nenhuma turma cadastrada</h3>
                            <p className="text-muted-foreground mb-4">Crie sua primeira turma para começar a organizar seus alunos.</p>
                            <Button onClick={() => setShowNewTurma(true)} className="gap-2">
                                <Plus className="w-4 h-4" />
                                Criar Primeira Turma
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {turmas.map((turma) => (
                            <Card key={turma.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-xl">{turma.nome}</CardTitle>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {turma.ano_letivo}
                                                {turma.escola && ` • ${turma.escola}`}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteTurma(turma.id, turma.nome)}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                        <Users className="w-4 h-4" />
                                        <span className="text-sm">
                                            {turma.alunos_count} {turma.alunos_count === 1 ? 'aluno' : 'alunos'}
                                        </span>
                                    </div>
                                    <Link href={`/turmas/${turma.id}`}>
                                        <Button className="w-full">
                                            Ver Turma
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
