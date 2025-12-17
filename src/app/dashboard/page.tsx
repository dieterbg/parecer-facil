"use client";

import { useAuth, supabase } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Loader2, UserCircle, School, Users, Camera, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StudentsInFocus } from "@/components/dashboard/students-in-focus";
import { BnccRadar } from "@/components/dashboard/bncc-radar";

interface Parecer {
    id: string;
    aluno_nome: string;
    status: 'pendente' | 'processando' | 'concluído' | 'erro';
    created_at: string;
}



interface DashboardMetrics {
    totalAlunos: number;
    totalTurmas: number;
    registrosSemana: number;
    pareceresConcluidos: number;
}

export default function DashboardPage() {
    const { user, loading: authLoading, signOut } = useAuth();
    const [pareceres, setPareceres] = useState<Parecer[]>([]);
    const [metrics, setMetrics] = useState<DashboardMetrics>({ totalAlunos: 0, totalTurmas: 0, registrosSemana: 0, pareceresConcluidos: 0 });
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
            return;
        }

        if (user) {
            loadDashboardData();
        }
    }, [user, authLoading, router]);

    const loadDashboardData = async () => {
        setLoading(true);
        await Promise.all([fetchPareceres(), fetchMetrics()]);
        setLoading(false);
    };

    const fetchMetrics = async () => {
        try {
            // 1. Total Alunos (Active)
            const { count: alunosCount } = await supabase
                .from('alunos')
                .select('*', { count: 'exact', head: true })
                .eq('ativo', true);

            // 2. Total Turmas (Active)
            const { count: turmasCount } = await supabase
                .from('turmas')
                .select('*', { count: 'exact', head: true })
                .eq('ativa', true);

            // 3. Registros this week
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const { count: registrosCount } = await supabase
                .from('registros')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', oneWeekAgo.toISOString());

            // 4. Pareceres Concluded (Last 30 days maybe? or total)
            const { count: pareceresCount } = await supabase
                .from('pareceres')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'concluído');

            setMetrics({
                totalAlunos: alunosCount || 0,
                totalTurmas: turmasCount || 0,
                registrosSemana: registrosCount || 0,
                pareceresConcluidos: pareceresCount || 0
            });
        } catch (error) {
            console.error("Error fetching metrics:", error);
        }
    };

    const fetchPareceres = async () => {
        const { data, error } = await supabase
            .from('pareceres')
            .select('id, aluno_nome, status, created_at')
            .order('created_at', { ascending: false })
            .limit(5); // Show only recent 5

        if (!error && data) {
            setPareceres(data as Parecer[]);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'concluído': return 'text-green-500 bg-green-500/10';
            case 'processando': return 'text-blue-500 bg-blue-500/10';
            case 'erro': return 'text-red-500 bg-red-500/10';
            default: return 'text-yellow-500 bg-yellow-500/10';
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
        <div className="min-h-screen bg-background space-y-8">
            {/* Onboarding Wizard Trigger */}
            {!loading && metrics.totalTurmas === 0 && user && (
                <OnboardingWizard
                    userId={user.id}
                    onComplete={() => loadDashboardData()}
                />
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
                    <p className="text-muted-foreground mt-1">
                        Resumo das suas atividades e turmas.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/turmas">
                            <School className="w-4 h-4 mr-2" />
                            Minhas Turmas
                        </Link>
                    </Button>
                    <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/20">
                        <Link href="/novo">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Parecer
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Alunos Ativos"
                    value={metrics.totalAlunos}
                    icon={Users}
                    description="Total matriculado"
                />
                <MetricCard
                    title="Registros (7d)"
                    value={metrics.registrosSemana}
                    icon={Camera}
                    description="Observações recentes"
                    trend="up"
                />
                <MetricCard
                    title="Pareceres Prontos"
                    value={metrics.pareceresConcluidos}
                    icon={CheckCircle}
                    description="Total finalizado"
                />
                <MetricCard
                    title="Minhas Turmas"
                    value={metrics.totalTurmas}
                    icon={School}
                    description="Ativas este ano"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Pareceres Section */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Pareceres Recentes
                        </h2>
                        <Link href="/novo" className="text-sm text-primary hover:underline flex items-center">
                            Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>

                    <div className="grid gap-3">
                        {pareceres.length === 0 ? (
                            <Card className="border-dashed bg-muted/30">
                                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <FileText className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Nenhum parecer criado recentemente.</p>
                                    <Button variant="link" asChild className="mt-2">
                                        <Link href="/novo">Criar o primeiro</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            pareceres.map((parecer) => (
                                <div
                                    key={parecer.id}
                                    onClick={() => router.push(`/parecer/${parecer.id}`)}
                                    className="group flex items-center justify-between p-4 bg-card hover:bg-accent/50 border rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-full ${getStatusColor(parecer.status)} transition-colors`}>
                                            {parecer.status === 'concluído' ? <CheckCircle className="w-5 h-5" /> :
                                                parecer.status === 'processando' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                                    <Clock className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold group-hover:text-primary transition-colors">{parecer.aluno_nome}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Criado em {new Date(parecer.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${parecer.status === 'concluído' ? 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-900' :
                                            parecer.status === 'processando' ? 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900' :
                                                'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-900'
                                            }`}>
                                            {parecer.status}
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Intelligence & Shortcuts */}
                <div className="space-y-6">
                    {/* New Intelligence Widgets */}
                    <div className="grid gap-6">
                        <StudentsInFocus />
                        <BnccRadar />
                    </div>
                    <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-none shadow-none">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-lg mb-2">Dica do Dia 💡</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Você sabia? Ao registrar uma atividade, marque-a como <strong>"Evidência de Desenvolvimento"</strong> para que ela seja citada automaticamente nos próximos pareceres.
                            </p>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Acesso Rápido</h3>
                        <Button variant="outline" className="w-full justify-start h-12" asChild>
                            <Link href="/turmas">
                                <Users className="w-4 h-4 mr-3 text-blue-500" />
                                Visualizar Alunos
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12" asChild>
                            <Link href="/perfil">
                                <UserCircle className="w-4 h-4 mr-3 text-purple-500" />
                                Meu Perfil
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon, description, trend }: any) {
    return (
        <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}
