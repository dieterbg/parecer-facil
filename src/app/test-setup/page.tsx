"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, ArrowRight, Trash2, RefreshCw } from "lucide-react";
import { getSegundaFeira, formatarDataISO } from "@/types/database";
import Link from "next/link";


// --- CONSTANTS & CONFIG ---
const ALICE_DATA = {
    nome: "Alice Silva",
    data_nascimento: "2022-03-15", // ~3 anos e 10 meses em jan/2026 -> Crianças Bem Pequenas
};

const TURMA_DATA = {
    nome: "Maternal II - Tarde", // Mais adequado para a faixa etária da Alice
    ano_letivo: "2026",
    cor: "#F472B6", // Rosa
    ativa: true
};

const LOG_COLORS = {
    info: "text-muted-foreground",
    success: "text-green-600 font-medium",
    error: "text-red-500 font-bold",
    warning: "text-amber-600"
};

type LogType = keyof typeof LOG_COLORS;

export default function TestSetupPage() {
    const [status, setStatus] = useState<"checking" | "ready" | "empty" | "seeding" | "error">("checking");
    const [aliceId, setAliceId] = useState<string | null>(null);
    const [log, setLog] = useState<{ msg: string; type: LogType }[]>([]);
    const [userEmail, setUserEmail] = useState<string>("");
    const [isDev, setIsDev] = useState(true);

    const addLog = (msg: string, type: LogType = "info") => setLog(prev => [...prev, { msg, type }]);

    useEffect(() => {
        // Simple check for development environment (localhost)
        if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
            setIsDev(false);
        }
        checkData();
    }, []);

    const checkData = async () => {
        setStatus("checking");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setStatus("error");
            addLog("Usuário não logado. Faça login primeiro.", "error");
            return;
        }
        setUserEmail(user.email || "Sem email");

        const { data: alice } = await supabase.from("alunos").select("id").ilike("nome", `%${ALICE_DATA.nome}%`).eq("ativo", true).maybeSingle();

        if (alice) {
            setAliceId(alice.id);
            setStatus("ready");
            addLog(`Aluno(a) ${ALICE_DATA.nome} encontrada: ${alice.id}`, "success");
        } else {
            setStatus("empty");
            addLog(`${ALICE_DATA.nome} não encontrada. Necessário configurar ambiente.`, "warning");
        }
    };

    const cleanupData = async (userId: string) => {
        addLog("Iniciando limpeza de dados antigos...", "info");

        // 1. Encontrar Alice
        const { data: alice } = await supabase.from("alunos")
            .select("id, turma_id")
            .ilike("nome", `%${ALICE_DATA.nome}%`)
            .maybeSingle();

        if (alice) {
            // Remover registros associados via trigger ou cascade seria o ideal, mas vamos tentar limpar o básico
            // Remover Registros
            // Delete registros_alunos first
            await supabase.from("registros_alunos").delete().eq("aluno_id", alice.id);

            // Delete marcos
            await supabase.from("marcos_desenvolvimento").delete().eq("aluno_id", alice.id);

            // Delete aluno
            const { error: errDel } = await supabase.from("alunos").delete().eq("id", alice.id);
            if (errDel) {
                addLog(`Erro ao deletar Alice: ${errDel.message}`, "error");
                throw errDel;
            }
            addLog("Dados antigos de Alice removidos.", "info");
        }

        // Limpar Turma de Teste se vazia? (Opcional, melhor manter para não bagunçar outros testes)
    };

    const runSeed = async () => {
        setStatus("seeding");
        setLog([]); // Clear log
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado.");

            await cleanupData(user.id);

            // 1. Turma
            addLog("Verificando/Criando Turma...", "info");
            let turmaId;
            // Tenta achar a turma específica de teste primeiro
            const { data: existingTurma } = await supabase.from("turmas")
                .select("id")
                .eq("user_id", user.id)
                .eq("nome", TURMA_DATA.nome)
                .maybeSingle();

            if (existingTurma) {
                turmaId = existingTurma.id;
                addLog(`Turma '${TURMA_DATA.nome}' já existe.`, "info");
            } else {
                // Se não acha a específica, vê se tem alguma para não criar lixo, ou cria a correta
                const { data: turmas } = await supabase.from("turmas").select("id").eq("user_id", user.id).limit(1);

                if (turmas && turmas.length > 0) {
                    // Use existing random class if user prefers, but for consistency lets create the specific one
                    // Actually, better to just create the correct one for the 'Standard' test env
                    const { data: newTurma, error } = await supabase.from("turmas").insert({
                        user_id: user.id, ...TURMA_DATA
                    }).select().single();
                    if (error) throw error;
                    turmaId = newTurma.id;
                    addLog(`Turma '${TURMA_DATA.nome}' criada.`, "success");
                } else {
                    const { data: newTurma, error } = await supabase.from("turmas").insert({
                        user_id: user.id, ...TURMA_DATA
                    }).select().single();
                    if (error) throw error;
                    turmaId = newTurma.id;
                    addLog(`Turma '${TURMA_DATA.nome}' criada.`, "success");
                }
            }

            // 2. Alunos
            addLog("Criando Alunos...", "info");
            const novosAlunos = [
                { nome: ALICE_DATA.nome, data_nascimento: ALICE_DATA.data_nascimento, turma_id: turmaId, ativo: true },
                { nome: "Bernardo Costa", data_nascimento: "2022-05-20", turma_id: turmaId, ativo: true }
            ];
            const { data: inserts, error: errAlunos } = await supabase.from("alunos").insert(novosAlunos).select();
            if (errAlunos) throw errAlunos;

            const alice = inserts.find(a => a.nome.includes("Alice"));
            if (alice) setAliceId(alice.id);
            addLog("Alunos criados com sucesso.", "success");

            // 3. Planejamento
            addLog("Configurando Planejamento Semanal...", "info");
            // Use o helper seguro para data local
            const semanaInicio = formatarDataISO(getSegundaFeira());

            // Check if plan exists
            const { data: existingPlan } = await supabase.from("planejamento_semanal")
                .select("id")
                .eq("turma_id", turmaId)
                .eq("semana_inicio", semanaInicio)
                .maybeSingle();

            if (!existingPlan) {
                const { error: errPlan } = await supabase.from("planejamento_semanal").insert({
                    user_id: user.id, turma_id: turmaId, semana_inicio: semanaInicio, status: "ativo",
                    tema_semana: "Minha Identidade", objetivos: "Reconhecer a si mesmo e aos colegas."
                });
                if (errPlan) console.warn("Aviso ao criar plano (pode já existir):", errPlan.message);
                else addLog("Planejamento semanal criado.", "success");
            } else {
                addLog("Planejamento semanal já existe.", "info");
            }

            // 4. Registros para Alice
            if (alice) {
                addLog("Gerando registros/evidências...", "info");
                const { data: reg, error: errReg } = await supabase.from("registros").insert({
                    tipo: "texto",
                    descricao: "Alice demonstrou grande interesse ao ver sua foto no mural da sala, apontando e dizendo seu nome.",
                    data_registro: new Date().toISOString(),
                    created_by: user.id,
                    is_evidencia: true, // Importante: É uma evidência de identidade/autonomia
                    tags_bncc: ["EO", "CG"] // Campos de Experiência (simulado)
                }).select().single();

                if (errReg) throw errReg;

                if (reg) {
                    await supabase.from("registros_alunos").insert({ registro_id: reg.id, aluno_id: alice.id });
                    addLog("Registro de evidência criado.", "success");
                }
            }

            setStatus("ready");
            addLog("✨ Ambiente configurado com sucesso!", "success");
        } catch (error: any) {
            console.error(error);
            addLog(`Erro crítico: ${error.message}`, "error");
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center justify-center gap-6">
            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <RefreshCw className="w-6 h-6 text-primary" />
                        Configuração do Sistema (Ambiente de Teste)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!isDev && (
                        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex gap-3 items-start">
                            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <h5 className="font-medium text-sm leading-none mb-1">Atenção</h5>
                                <div className="text-sm opacity-90">
                                    Esta página deve ser usada apenas em ambiente de desenvolvimento. O uso em produção pode alterar dados reais.
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <span className="text-sm text-muted-foreground">Usuário Logado: <span className="font-medium text-foreground">{userEmail}</span></span>
                        <span className="text-sm text-muted-foreground">Status: <span className="font-mono uppercase">{status}</span></span>
                    </div>

                    {/* Console Log Area */}
                    <div className="w-full bg-slate-950 rounded-lg border border-slate-800 p-4 h-64 overflow-y-auto font-mono text-xs shadow-inner">
                        {log.length === 0 && <span className="text-slate-500 italic">Aguardando início...</span>}
                        {log.map((l, i) => (
                            <div key={i} className={`mb-1 ${LOG_COLORS[l.type] || "text-slate-300"}`}>
                                <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                {l.msg}
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        {status === 'checking' && <Loader2 className="animate-spin text-primary w-8 h-8" />}

                        {(status === 'empty' || status === 'ready' || status === 'error') && (
                            <Button
                                onClick={runSeed}
                                disabled={false}
                                variant={status === 'ready' ? "outline" : "default"}
                                className="w-full md:w-auto"
                            >
                                {status === 'ready' ? <><RefreshCw className="mr-2 h-4 w-4" /> Resetar / Recriar Dados</> : "Popular Banco de Dados"}
                            </Button>
                        )}
                    </div>

                    {status === 'ready' && aliceId && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                                <div>
                                    <h3 className="font-bold text-green-800">Ambiente Pronto</h3>
                                    <p className="text-green-700 text-sm">Dados de {ALICE_DATA.nome} e turma configurados.</p>
                                </div>
                            </div>
                            <Link href={`/alunos/${aliceId}`} className="w-full md:w-auto">
                                <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">
                                    Ver Perfil Geral <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
