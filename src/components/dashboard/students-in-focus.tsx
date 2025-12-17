"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Plus, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { differenceInDays } from "date-fns";

interface Aluno {
    id: string;
    nome: string;
    foto_url: string | null;
    turma: {
        nome: string;
    };
}

export function StudentsInFocus() {
    const [students, setStudents] = useState<Aluno[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAtRiskStudents();
    }, []);

    const fetchAtRiskStudents = async () => {
        try {
            // 1. Buscar todos os alunos ativos
            const { data: allStudents, error: studentsError } = await supabase
                .from('alunos')
                .select('id, nome, foto_url, turma:turmas(nome)')
                .eq('ativo', true);

            if (studentsError) throw studentsError;

            // 2. Buscar IDs de alunos com registros nos últimos 7 dias
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: recentRecords, error: recordsError } = await supabase
                .from('registros_alunos')
                .select('aluno_id')
                .gte('created_at', sevenDaysAgo.toISOString());

            if (recordsError) throw recordsError;

            const studentsWithRecords = new Set(recentRecords?.map(r => r.aluno_id));

            // 3. Filtrar alunos SEM registros
            const atRisk = allStudents?.filter(s => !studentsWithRecords.has(s.id)) || [];

            // Limitar a 5 para não poluir o dashboard
            setStudents(atRisk.slice(0, 5));
        } catch (error) {
            console.error("Erro ao buscar alunos em foco:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        Alunos em Foco
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[200px] flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">Carregando...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-l-4 border-l-orange-400">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        Alunos em Foco
                    </div>
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        Sem registros há 7 dias
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                        <CheckCircle2 className="w-10 h-10 text-green-500/50" />
                        <p className="text-sm font-medium">Tudo em dia!</p>
                        <p className="text-xs text-muted-foreground">Todos os alunos têm registros recentes.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {students.map(student => (
                            <div key={student.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={student.foto_url || undefined} />
                                        <AvatarFallback>{student.nome.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium leading-none">{student.nome}</p>
                                        <p className="text-xs text-muted-foreground">{student.turma?.nome}</p>
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                    <Link href={`/alunos/${student.id}`}>
                                        <Plus className="w-4 h-4 text-primary" />
                                        <span className="sr-only">Adicionar Registro</span>
                                    </Link>
                                </Button>
                            </div>
                        ))}
                        {students.length >= 5 && (
                            <div className="pt-2 text-center">
                                <Button variant="link" size="sm" className="text-xs text-muted-foreground h-auto p-0" asChild>
                                    <Link href="/turmas">Ver todos</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
