"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { getSegundaFeira } from "@/types/database";
import Link from "next/link";

export default function TestSetupPage() {
    const [status, setStatus] = useState<"checking" | "ready" | "empty" | "seeding" | "error">("checking");
    const [aliceId, setAliceId] = useState<string | null>(null);
    const [log, setLog] = useState<string[]>([]);
    const [userEmail, setUserEmail] = useState<string>("");

    const addLog = (msg: string) => setLog(prev => [...prev, msg]);

    useEffect(() => {
        checkData();
    }, []);

    const checkData = async () => {
        setStatus("checking");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setStatus("error");
            addLog("Usuário não logado.");
            return;
        }
        setUserEmail(user.email || "Sem email");

        const { data: alice } = await supabase.from("alunos").select("id").ilike("nome", "%Alice Silva%").eq("ativo", true).maybeSingle();

        if (alice) {
            setAliceId(alice.id);
            setStatus("ready");
            addLog(`Alice encontrada: ${alice.id}`);
        } else {
            setStatus("empty");
            addLog("Alice não encontrada. Necessário rodar seed.");
        }
    };

    const runSeed = async () => {
        setStatus("seeding");
        setLog([]);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado.");

            // 1. Turma
            let turmaId;
            const { data: turmas } = await supabase.from("turmas").select("id").eq("user_id", user.id).limit(1);
            if (turmas && turmas.length > 0) {
                turmaId = turmas[0].id;
            } else {
                const { data: newTurma, error } = await supabase.from("turmas").insert({
                    user_id: user.id, nome: "Bebês II - Tarde", ano_letivo: "2024", cor: "#F59E0B", ativa: true
                }).select().single();
                if (error) throw error;
                turmaId = newTurma.id;
            }

            // 2. Alunos
            const novosAlunos = [
                { nome: "Alice Silva", data_nascimento: "2022-03-15", turma_id: turmaId, ativo: true },
                { nome: "Bernardo Costa", data_nascimento: "2022-05-20", turma_id: turmaId, ativo: true }
            ];
            const { data: inserts, error: errAlunos } = await supabase.from("alunos").insert(novosAlunos).select();
            if (errAlunos) throw errAlunos;

            const alice = inserts.find(a => a.nome.includes("Alice"));
            if (alice) setAliceId(alice.id);

            // 3. Planejamento
            const semanaInicio = getSegundaFeira().toISOString().split('T')[0];
            const { data: plan, error: errPlan } = await supabase.from("planejamento_semanal").insert({
                user_id: user.id, turma_id: turmaId, semana_inicio: semanaInicio, status: "ativo",
                tema_semana: "Cores", objetivos: "Explorar cores."
            }).select().single();
            // Ignorar erro se ja existe (unique constraint)

            // 4. Registros para Alice
            if (alice) {
                const { data: reg } = await supabase.from("registros").insert({
                    tipo: "texto", descricao: "Alice adorou misturar as tintas azuis e amarelas.",
                    data_registro: new Date().toISOString(), created_by: user.id, is_evidencia: true
                }).select().single();

                if (reg) {
                    await supabase.from("registros_alunos").insert({ registro_id: reg.id, aluno_id: alice.id });
                }
            }

            setStatus("ready");
            addLog("Seed concluído!");
        } catch (error: any) {
            console.error(error);
            addLog(`Erro: ${error.message}`);
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen p-8 flex flex-col items-center justify-center gap-6">
            <h1 className="text-2xl font-bold">Diagnóstico de Teste</h1>
            <div className="text-sm">Usuário: {userEmail}</div>

            <div className="w-full max-w-md bg-muted p-4 rounded text-xs font-mono h-32 overflow-y-auto">
                {log.map((l, i) => <div key={i}>{l}</div>)}
            </div>

            {status === 'empty' && (
                <Button onClick={runSeed}>Popular Banco de Dados (Seed)</Button>
            )}

            {status === 'ready' && aliceId && (
                <div className="p-4 bg-green-500/10 rounded flex flex-col items-center gap-4">
                    <p className="text-green-600 font-bold flex items-center gap-2">
                        <CheckCircle /> Ambiente Pronto
                    </p>
                    <Link href={`/alunos/${aliceId}`}>
                        <Button size="lg" className="w-full">
                            Ir para Perfil de Alice <ArrowRight className="ml-2" />
                        </Button>
                    </Link>
                </div>
            )}
            {status === 'checking' && <Loader2 className="animate-spin" />}
        </div>
    );
}
