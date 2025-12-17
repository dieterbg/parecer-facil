"use client";

import { useState } from "react";
import { supabase } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Database, Trash2 } from "lucide-react";
import { getSegundaFeira } from "@/types/database";

export default function SeedPage() {
    const [status, setStatus] = useState<"idle" | "seeding" | "done" | "error">("idle");
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const runSeed = async () => {
        setStatus("seeding");
        setLogs([]);

        try {
            // 1. Verificar usuário
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado. Faça login primeiro.");
            addLog(`✅ Usuário autenticado: ${user.email}`);

            // 2. Criar Turmas
            const turmasData = [
                { user_id: user.id, nome: "Bebês I - Manhã", ano_letivo: "2024", cor: "#3B82F6", ativa: true },
                { user_id: user.id, nome: "Maternal II - Tarde", ano_letivo: "2024", cor: "#10B981", ativa: true }
            ];
            const { data: turmas, error: errTurmas } = await supabase.from("turmas").insert(turmasData).select();
            if (errTurmas) throw errTurmas;
            addLog(`✅ 2 turmas criadas: ${turmas.map(t => t.nome).join(", ")}`);

            // 3. Criar Alunos (5 por turma)
            const alunosData = [
                // Turma 1
                { turma_id: turmas[0].id, nome: "Alice Fernandes", data_nascimento: "2022-03-15", ativo: true },
                { turma_id: turmas[0].id, nome: "Bernardo Lima", data_nascimento: "2022-05-20", ativo: true },
                { turma_id: turmas[0].id, nome: "Clara Souza", data_nascimento: "2022-01-10", ativo: true },
                { turma_id: turmas[0].id, nome: "Daniel Costa", data_nascimento: "2022-07-25", ativo: true },
                { turma_id: turmas[0].id, nome: "Eva Martins", data_nascimento: "2022-11-08", ativo: true },
                // Turma 2
                { turma_id: turmas[1].id, nome: "Felipe Rocha", data_nascimento: "2021-02-18", ativo: true },
                { turma_id: turmas[1].id, nome: "Gabriela Santos", data_nascimento: "2021-04-22", ativo: true },
                { turma_id: turmas[1].id, nome: "Henrique Alves", data_nascimento: "2021-06-30", ativo: true },
                { turma_id: turmas[1].id, nome: "Isabela Pereira", data_nascimento: "2021-09-14", ativo: true },
                { turma_id: turmas[1].id, nome: "João Pedro Oliveira", data_nascimento: "2021-12-01", ativo: true },
            ];
            const { data: alunos, error: errAlunos } = await supabase.from("alunos").insert(alunosData).select();
            if (errAlunos) throw errAlunos;
            addLog(`✅ ${alunos.length} alunos criados`);

            // 4. Criar Registros (observações de texto)
            const registrosData = [
                { tipo: "texto", descricao: "Alice demonstrou grande interesse pela brincadeira com blocos, empilhando-os e derrubando repetidamente.", data_registro: new Date().toISOString(), created_by: user.id, is_evidencia: true },
                { tipo: "texto", descricao: "Bernardo participou ativamente da roda de música, batendo palmas no ritmo.", data_registro: new Date().toISOString(), created_by: user.id, is_evidencia: false },
                { tipo: "texto", descricao: "Clara conseguiu comer sozinha usando a colher pela primeira vez!", data_registro: new Date().toISOString(), created_by: user.id, is_evidencia: true },
                { tipo: "texto", descricao: "Felipe resolveu um conflito com colega usando palavras em vez de empurrões.", data_registro: new Date().toISOString(), created_by: user.id, is_evidencia: true },
                { tipo: "texto", descricao: "Gabriela explorou as tintas com as mãos, criando padrões coloridos.", data_registro: new Date().toISOString(), created_by: user.id, is_evidencia: true },
                { tipo: "texto", descricao: "João Pedro reconheceu seu nome escrito na ficha de chamada.", data_registro: new Date().toISOString(), created_by: user.id, is_evidencia: true },
            ];
            const { data: registros, error: errRegs } = await supabase.from("registros").insert(registrosData).select();
            if (errRegs) throw errRegs;
            addLog(`✅ ${registros.length} registros criados`);

            // 5. Vincular Registros a Alunos
            const vinculosData = registros.map((r, i) => ({ registro_id: r.id, aluno_id: alunos[i].id }));
            await supabase.from("registros_alunos").insert(vinculosData);
            addLog(`✅ Registros vinculados aos alunos`);

            // 6. Criar Planejamentos Semanais
            const segundaFeira = getSegundaFeira().toISOString().split('T')[0];
            const planejamentosData = turmas.map(t => ({
                user_id: user.id,
                turma_id: t.id,
                semana_inicio: segundaFeira,
                tema_semana: t.nome.includes("Bebês") ? "Descobrindo Texturas" : "Cores e Formas",
                objetivos: "Explorar diferentes materiais sensoriais.",
                status: "ativo"
            }));
            const { data: planejamentos, error: errPlan } = await supabase.from("planejamento_semanal").insert(planejamentosData).select();
            if (errPlan) throw errPlan;
            addLog(`✅ ${planejamentos.length} planejamentos semanais criados`);

            // 7. Criar Atividades Planejadas
            const atividadesData = [
                { planejamento_id: planejamentos[0].id, titulo: "Exploração com Massinha", duracao_minutos: 30, dia_semana: 1, ordem: 0, cor: "#F59E0B", campos_bncc: ["EI02CG01"] },
                { planejamento_id: planejamentos[0].id, titulo: "Música e Movimento", duracao_minutos: 20, dia_semana: 2, ordem: 0, cor: "#EC4899", campos_bncc: ["EI02CG02"] },
                { planejamento_id: planejamentos[0].id, titulo: "Hora da História", duracao_minutos: 15, dia_semana: 3, ordem: 0, cor: "#8B5CF6", campos_bncc: ["EI02EF01"] },
                { planejamento_id: planejamentos[1].id, titulo: "Pintura com Esponjas", duracao_minutos: 40, dia_semana: 1, ordem: 0, cor: "#10B981", campos_bncc: ["EI03TS02"] },
                { planejamento_id: planejamentos[1].id, titulo: "Contagem com Blocos", duracao_minutos: 25, dia_semana: 2, ordem: 0, cor: "#6366F1", campos_bncc: ["EI03ET07"] },
            ];
            const { error: errAtiv } = await supabase.from("atividades_planejadas").insert(atividadesData);
            if (errAtiv) throw errAtiv;
            addLog(`✅ ${atividadesData.length} atividades planejadas criadas`);

            // 8. Criar Marcos de Desenvolvimento
            const marcosData = [
                { aluno_id: alunos[0].id, titulo: "Primeiros Passos", descricao: "Começou a andar sem apoio.", area: "motor_grosso", data_marco: "2024-10-15", created_by: user.id },
                { aluno_id: alunos[2].id, titulo: "Autonomia Alimentar", descricao: "Come sozinha com colher.", area: "autonomia", data_marco: "2024-11-20", created_by: user.id },
                { aluno_id: alunos[5].id, titulo: "Resolução de Conflitos", descricao: "Usou palavras para resolver problema.", area: "social_emocional", data_marco: "2024-12-01", created_by: user.id },
                { aluno_id: alunos[9].id, titulo: "Reconhecimento de Nome", descricao: "Identifica seu nome escrito.", area: "linguagem_escrita", data_marco: "2024-12-10", created_by: user.id },
                { aluno_id: alunos[4].id, titulo: "Exploração Artística", descricao: "Pintura com dedos.", area: "criatividade", data_marco: "2024-11-05", created_by: user.id },
            ];
            const { error: errMarcos } = await supabase.from("marcos").insert(marcosData);
            if (errMarcos) throw errMarcos;
            addLog(`✅ ${marcosData.length} marcos de desenvolvimento criados`);

            // 9. Criar Pareceres (alguns concluídos, outros pendentes)
            const pareceresData = [
                { aluno_id: alunos[0].id, turma_id: turmas[0].id, aluno_nome: alunos[0].nome, aluno_idade: "2 anos e 9 meses", status: "concluído", resultado_texto: "<p>Durante o período avaliado, <strong>Alice Fernandes</strong> demonstrou avanços significativos em seu desenvolvimento motor e cognitivo. Mostrou-se uma criança curiosa e participativa nas atividades propostas.</p>" },
                { aluno_id: alunos[5].id, turma_id: turmas[1].id, aluno_nome: alunos[5].nome, aluno_idade: "3 anos e 10 meses", status: "concluído", resultado_texto: "<p><strong>Felipe Rocha</strong> apresentou evolução notável na área socioemocional, desenvolvendo habilidades de resolver conflitos de forma pacífica.</p>" },
                { aluno_id: alunos[2].id, turma_id: turmas[0].id, aluno_nome: alunos[2].nome, aluno_idade: "2 anos e 11 meses", status: "pendente", resultado_texto: "" },
            ];
            const { error: errPar } = await supabase.from("pareceres").insert(pareceresData);
            if (errPar) throw errPar;
            addLog(`✅ ${pareceresData.length} pareceres criados`);

            setStatus("done");
            addLog("🎉 Seed completo! Recarregue o Dashboard para ver os dados.");

        } catch (error: any) {
            console.error(error);
            addLog(`❌ ERRO: ${error.message}`);
            setStatus("error");
        }
    };

    const clearData = async () => {
        if (!confirm("ATENÇÃO: Isso vai apagar TODOS os dados do seu usuário. Continuar?")) return;
        setStatus("seeding");
        setLogs([]);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            // Ordem inversa de dependências
            await supabase.from("pareceres").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            addLog("🗑️ Pareceres apagados");
            await supabase.from("marcos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            addLog("🗑️ Marcos apagados");
            await supabase.from("atividades_planejadas").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            addLog("🗑️ Atividades apagadas");
            await supabase.from("planejamento_semanal").delete().eq("user_id", user.id);
            addLog("🗑️ Planejamentos apagados");
            await supabase.from("registros_alunos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            addLog("🗑️ Vínculos apagados");
            await supabase.from("registros").delete().eq("created_by", user.id);
            addLog("🗑️ Registros apagados");
            await supabase.from("alunos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            addLog("🗑️ Alunos apagados");
            await supabase.from("turmas").delete().eq("user_id", user.id);
            addLog("🗑️ Turmas apagadas");

            setStatus("done");
            addLog("✅ Limpeza completa!");
        } catch (error: any) {
            addLog(`❌ ERRO: ${error.message}`);
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen p-8 flex flex-col items-center justify-center gap-6">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        Seed de Banco de Dados
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Este utilitário popula o banco com dados de exemplo para testar todas as funcionalidades.
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-sm border rounded-lg p-4 bg-muted/30">
                        <div>✅ 2 Turmas</div>
                        <div>✅ 10 Alunos</div>
                        <div>✅ 6 Registros</div>
                        <div>✅ 2 Planejamentos</div>
                        <div>✅ 5 Atividades</div>
                        <div>✅ 5 Marcos</div>
                        <div>✅ 3 Pareceres</div>
                    </div>

                    <div className="flex gap-4">
                        <Button onClick={runSeed} disabled={status === "seeding"} className="flex-1">
                            {status === "seeding" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                            Popular Banco
                        </Button>
                        <Button onClick={clearData} disabled={status === "seeding"} variant="destructive" className="flex-1">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Limpar Tudo
                        </Button>
                    </div>

                    {logs.length > 0 && (
                        <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-lg max-h-64 overflow-y-auto">
                            {logs.map((log, i) => <div key={i}>{log}</div>)}
                        </div>
                    )}

                    {status === "done" && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                            <CheckCircle className="w-5 h-5" />
                            <span>Operação concluída com sucesso!</span>
                        </div>
                    )}
                    {status === "error" && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                            <XCircle className="w-5 h-5" />
                            <span>Ocorreu um erro. Verifique os logs.</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
