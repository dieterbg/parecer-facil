"use client";

import { useAuth, supabase } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Loader2, UserCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Parecer {
    id: string;
    aluno_nome: string;
    status: 'pendente' | 'processando' | 'concluído' | 'erro';
    created_at: string;
}

export default function DashboardPage() {
    const { user, loading: authLoading, signOut } = useAuth();
    const [pareceres, setPareceres] = useState<Parecer[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
            return;
        }

        if (user) {
            fetchPareceres();

            // Realtime subscription
            const channel = supabase
                .channel('pareceres_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'pareceres',
                        filter: `uid_professor=eq.${user.id}`
                    },
                    (payload) => {
                        fetchPareceres(); // Refresh list on any change
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user, authLoading, router]);

    const fetchPareceres = async () => {
        const { data, error } = await supabase
            .from('pareceres')
            .select('id, aluno_nome, status, created_at')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setPareceres(data as Parecer[]);
        }
        setLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'concluído': return 'text-green-500 bg-green-500/10';
            case 'processando': return 'text-blue-500 bg-blue-500/10';
            case 'erro': return 'text-red-500 bg-red-500/10';
            default: return 'text-yellow-500 bg-yellow-500/10';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'concluído': return <CheckCircle className="w-4 h-4" />;
            case 'processando': return <Loader2 className="w-4 h-4 animate-spin" />;
            case 'erro': return <AlertCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const handleDelete = async (e: React.MouseEvent, parecerId: string, alunoNome: string) => {
        e.stopPropagation(); // Previne navegação ao clicar no botão

        const confirmDelete = confirm(`Tem certeza que deseja excluir o parecer de ${alunoNome}? Esta ação não pode ser desfeita.`);
        if (!confirmDelete) return;

        try {
            const { error } = await supabase
                .from('pareceres')
                .delete()
                .eq('id', parecerId);

            if (error) throw error;

            // Atualiza a lista removendo o parecer excluído
            setPareceres(pareceres.filter(p => p.id !== parecerId));
        } catch (error) {
            console.error('Error deleting parecer:', error);
            alert('Erro ao excluir parecer.');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <header className="flex justify-between items-center mb-8 max-w-5xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold">Meus Pareceres</h1>
                    <p className="text-muted-foreground">Bem-vindo, {user?.user_metadata?.full_name}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/perfil">
                            <UserCircle className="w-5 h-5" />
                        </Link>
                    </Button>
                    <Button variant="ghost" onClick={signOut}>Sair</Button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto space-y-6">
                <Link href="/novo">
                    <Button size="lg" className="w-full h-16 text-lg shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all hover:scale-[1.01]">
                        <Plus className="mr-2 w-6 h-6" />
                        Criar Novo Parecer
                    </Button>
                </Link>

                <div className="grid gap-4">
                    {pareceres.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <FileText className="w-12 h-12 mb-4 opacity-20" />
                                <p>Nenhum parecer criado ainda.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        pareceres.map((parecer) => (
                            <Card key={parecer.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                                router.push(`/parecer/${parecer.id}`);
                            }}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-full ${getStatusColor(parecer.status)}`}>
                                            {getStatusIcon(parecer.status)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{parecer.aluno_nome}</h3>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(parecer.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(parecer.status)}`}>
                                            {parecer.status}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={(e) => handleDelete(e, parecer.id, parecer.aluno_nome)}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
