"use client";

import { useState } from "react";
import { supabase } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Database, Loader2, Trash2, Sparkles } from "lucide-react";

// Dados fictícios variados e realistas
const DESCRICOES_REGISTROS = [
    "Participou ativamente da roda de leitura, fazendo perguntas sobre a história.",
    "Demonstrou interesse em ajudar os colegas durante a atividade de pintura.",
    "Conseguiu amarrar o tênis sozinho pela primeira vez!",
    "Brincou de massinha e criou formas geométricas variadas.",
    "Cantou as músicas da rotina com entusiasmo e acertou todas as letras.",
    "Mostrou boa coordenação motora ao recortar formas com a tesoura.",
    "Compartilhou os brinquedos espontaneamente com os amigos.",
    "Expressou suas emoções de forma clara quando ficou frustrado.",
    "Contou até 20 corretamente durante a atividade de matemática.",
    "Identificou todas as cores do arco-íris na atividade de artes.",
    "Demonstrou curiosidade sobre os animais do zoológico visitado.",
    "Organizou os blocos por tamanho e cor sem ajuda.",
    "Relatou o que fez no fim de semana com detalhes e sequência temporal.",
    "Participou do teatro de fantoches criando sua própria história.",
    "Ajudou a regar as plantas da horta escolar com cuidado.",
    "Construiu uma torre alta com blocos e explicou sua técnica.",
    "Reconheceu seu nome escrito e tentou copiar as letras.",
    "Pediu para usar o banheiro de forma independente.",
    "Mostrou empatia ao consolar um colega que estava triste.",
    "Realizou atividade de encaixe com precisão e paciência.",
];

const MARCOS_DESENVOLVIMENTO = [
    { titulo: "Escreveu o próprio nome", area: "linguagem_escrita", desc: "Conseguiu escrever todas as letras do nome corretamente." },
    { titulo: "Conta até 20", area: "matematica", desc: "Demonstra compreensão numérica consistente." },
    { titulo: "Usa tesoura com segurança", area: "motor_fino", desc: "Recorta formas simples seguindo linhas." },
    { titulo: "Expressa emoções verbalmente", area: "social_emocional", desc: "Consegue nomear e explicar como se sente." },
    { titulo: "Participa de brincadeiras em grupo", area: "social_emocional", desc: "Interage bem e respeita regras." },
    { titulo: "Reconhece letras do alfabeto", area: "linguagem_escrita", desc: "Identifica a maioria das letras." },
    { titulo: "Corre e pula com equilíbrio", area: "motor_grosso", desc: "Movimenta-se com confiança no parquinho." },
    { titulo: "Narra experiências em sequência", area: "linguagem_oral", desc: "Conta histórias com começo, meio e fim." },
    { titulo: "Usa o banheiro independentemente", area: "autonomia", desc: "Não precisa de ajuda para ir ao banheiro." },
    { titulo: "Desenha figura humana completa", area: "criatividade", desc: "Inclui cabeça, tronco e membros." },
];

const TAGS_BNCC_SET = [
    ["EI-EO", "EI-EF"],
    ["EI-CG", "EI-TS"],
    ["EI-EF", "EI-ET"],
    ["EI-EO", "EI-CG"],
    ["EI-TS", "EI-EF"],
    ["EI-ET", "EI-EO"],
];

const CONTEXTOS_BASE = [
    { nome: "Roda de Leitura", emoji: "📚", cor: "#3B82F6" },
    { nome: "Parquinho", emoji: "🎢", cor: "#22C55E" },
    { nome: "Artes", emoji: "🎨", cor: "#F59E0B" },
    { nome: "Hora do Lanche", emoji: "🍎", cor: "#EF4444" },
    { nome: "Musicalização", emoji: "🎵", cor: "#8B5CF6" },
];

export function DataSeeder() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    const seedData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !user.id) throw new Error("Usuário não logado ou ID inválido");

            console.log("Seeding com User ID:", user.id);

            setStatus("Criando turmas...");

            // 1. Criar Turmas
            const turmasData = [
                { nome: "Jardim das Borboletas", ano_letivo: "2025", escola: "Floresce Kids", user_id: user.id, cor: "#8B5CF6" },
                { nome: "Maternal Girassol", ano_letivo: "2025", escola: "Floresce Kids", user_id: user.id, cor: "#F59E0B" }
            ];

            const { data: turmas, error: turmasError } = await supabase
                .from('turmas')
                .insert(turmasData)
                .select();

            if (turmasError) throw new Error(`Erro ao criar Turmas: ${turmasError.message}`);
            if (!turmas?.length) throw new Error("Turmas não retornadas");

            const turma1 = turmas[0];

            setStatus("Criando alunos...");

            // 2. Criar Alunos com datas de nascimento
            const hoje = new Date();
            const alunosTurma1 = [
                { nome: "Alice Silva", data_nascimento: new Date(hoje.getFullYear() - 5, 3, 15).toISOString().split('T')[0] },
                { nome: "Miguel Oliveira", data_nascimento: new Date(hoje.getFullYear() - 5, 7, 22).toISOString().split('T')[0] },
                { nome: "Valentina Almeida", data_nascimento: new Date(hoje.getFullYear() - 4, 11, 8).toISOString().split('T')[0] },
                { nome: "Heitor Lima", data_nascimento: new Date(hoje.getFullYear() - 5, 1, 30).toISOString().split('T')[0] },
                { nome: "Laura Gomes", data_nascimento: new Date(hoje.getFullYear() - 4, 6, 12).toISOString().split('T')[0] },
            ].map(a => ({ ...a, turma_id: turma1.id, ativo: true }));

            const { data: alunos, error: alunosError } = await supabase
                .from('alunos')
                .insert(alunosTurma1)
                .select();

            if (alunosError) throw new Error(`Erro ao criar Alunos: ${alunosError.message}`);

            setStatus("Verificando contextos...");

            // 3. Gerenciar Contextos (Tentar criar se não existirem no nível do usuário)
            // Primeiro checar se contexto tabela existe tentando select simples
            // Se falhar, vamos assumir que não podemos usar contexto_id

            let contextosIds: string[] = [];
            try {
                // Tentar inserir contextos novos
                const contextosParaInserir = CONTEXTOS_BASE.map(c => ({
                    ...c,
                    user_id: user.id
                }));

                const { data: contextosCriados, error: ctxError } = await supabase
                    .from('contextos')
                    .insert(contextosParaInserir)
                    .select();

                if (!ctxError && contextosCriados) {
                    contextosIds = contextosCriados.map(c => c.id);
                } else {
                    console.warn("Não foi possível criar contextos (tabela pode não existir ou erro RLS):", ctxError);
                }
            } catch (e) {
                console.warn("Erro ao lidar com contextos, prosseguindo sem eles.", e);
            }

            setStatus("Criando registros...");

            // 4. Criar Registros (muitos!)
            const registrosData = [];
            const tipos: ('texto' | 'foto' | 'audio')[] = ['texto', 'texto', 'texto', 'foto', 'audio'];
            const registrosParaVincular: any[] = []; // Guardar referência para vincular

            // Criar batch de registros
            for (let i = 0; i < 50; i++) {
                const tipo = tipos[Math.floor(Math.random() * tipos.length)];
                const data = new Date();
                data.setDate(data.getDate() - Math.floor(Math.random() * 90)); // Últimos 3 meses

                const descricao = DESCRICOES_REGISTROS[Math.floor(Math.random() * DESCRICOES_REGISTROS.length)];
                const tags = TAGS_BNCC_SET[Math.floor(Math.random() * TAGS_BNCC_SET.length)];

                // Pegar um contexto aleatório se disponíveis
                const contextoId = contextosIds.length > 0
                    ? contextosIds[Math.floor(Math.random() * contextosIds.length)]
                    : null;

                registrosData.push({
                    tipo,
                    descricao,
                    data_registro: data.toISOString(),
                    created_by: user.id,
                    tags_bncc: tags,
                    contexto_id: contextoId,
                    transcricao_voz: tipo === 'audio' ? descricao : null,
                });
            }

            const { data: registros, error: registrosError } = await supabase
                .from('registros')
                .insert(registrosData)
                .select();

            if (registrosError) throw new Error(`Erro Registros: ${registrosError.message}`);

            setStatus("Vinculando registros aos alunos...");

            // 5. Vincular registros a alunos (Garantir que todos alunos tenham registros)
            if (alunos && registros) {
                const alunosIds = alunos.map(a => a.id);
                const vinculos: { registro_id: string; aluno_id: string }[] = [];

                // 1. Garantir que CADA aluno tenha pelo menos 3 registros exclusivos
                alunosIds.forEach((alunoId, index) => {
                    const meusRegistros = registros.slice(index * 3, (index + 1) * 3);
                    meusRegistros.forEach(reg => {
                        vinculos.push({ registro_id: reg.id, aluno_id: alunoId });
                    });
                });

                // 2. Pegar registros restantes e distribuir aleatoriamente (alguns compartilhados)
                const registrosRestantes = registros.slice(alunosIds.length * 3);

                registrosRestantes.forEach(reg => {
                    // Decidir se é individual ou grupo
                    const isGrupo = Math.random() > 0.7; // 30% chance de ser grupo
                    const numAlunos = isGrupo ? Math.floor(Math.random() * 3) + 2 : 1;

                    const alunosSelecionados = new Set<string>();

                    for (let j = 0; j < numAlunos; j++) {
                        const alunoId = alunosIds[Math.floor(Math.random() * alunosIds.length)];
                        if (!alunosSelecionados.has(alunoId)) {
                            alunosSelecionados.add(alunoId);
                            vinculos.push({ registro_id: reg.id, aluno_id: alunoId });
                        }
                    }
                });

                // Remover duplicatas por segurança (embora lógica acima tente evitar)
                const uniqueVinculos = Array.from(new Set(vinculos.map(v => `${v.registro_id}-${v.aluno_id}`)))
                    .map(s => {
                        const [registro_id, aluno_id] = s.split('-');
                        return { registro_id, aluno_id };
                    });

                const { error: vinError } = await supabase.from('registros_alunos').insert(uniqueVinculos);
                if (vinError) console.warn("Erro ao vincular (pode ser duplicata ignorada):", vinError);
            }

            setStatus("Criando marcos de desenvolvimento...");

            // 6. Criar Marcos
            if (alunos) {
                const marcosData = [];

                for (const aluno of alunos) { // Todos alunos
                    const numMarcos = Math.floor(Math.random() * 3) + 1; // 1 a 3 marcos
                    const marcosUsados = new Set<number>();

                    for (let i = 0; i < numMarcos; i++) {
                        let idx;
                        do { idx = Math.floor(Math.random() * MARCOS_DESENVOLVIMENTO.length); } while (marcosUsados.has(idx));
                        marcosUsados.add(idx);

                        const marco = MARCOS_DESENVOLVIMENTO[idx];
                        const dataMostrandoMarco = new Date();
                        dataMostrandoMarco.setDate(dataMostrandoMarco.getDate() - Math.floor(Math.random() * 60));

                        marcosData.push({
                            aluno_id: aluno.id,
                            titulo: marco.titulo,
                            descricao: marco.desc,
                            area: marco.area,
                            data_marco: dataMostrandoMarco.toISOString().split('T')[0],
                        });
                    }
                }

                await supabase.from('marcos_desenvolvimento').insert(marcosData);
            }

            setStatus("Concluído! ✨");
            alert("🎉 Base de dados completa gerada!\n\n• Turma 'Jardim das Borboletas'\n• 5 Alunos com registros garantidos\n• Registros individuais e em grupo\n• Marcos de desenvolvimento\n\nAtualizando página...");
            window.location.reload();

        } catch (error: any) {
            console.error("Erro SEED:", error);
            alert(`Falha: ${error.message}`);
            setStatus("");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg mt-8 bg-card/50">
            <h3 className="text-sm font-medium mb-2 text-muted-foreground">🧪 Dev Tools (Seed)</h3>

            {status && (
                <p className="text-xs text-primary mb-2 animate-pulse">{status}</p>
            )}

            <Button
                variant="secondary"
                onClick={seedData}
                disabled={loading}
                className="w-full gap-2"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Gerar Base Completa (Turma + Alunos + Registros)
            </Button>

            <div className="my-2 border-t border-dashed border-muted-foreground/30" />

            <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={async () => {
                    if (!confirm("Tem certeza? Isso apagará TODAS as suas turmas, alunos e registros.")) return;
                    setLoading(true);
                    setStatus("Limpando dados...");
                    try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;

                        // Apagar registros
                        await supabase.from('registros').delete().eq('created_by', user.id);
                        // Apagar turmas (cascade apaga alunos e contextos)
                        await supabase.from('turmas').delete().eq('user_id', user.id);

                        alert("Dados limpos com sucesso!");
                        window.location.reload();
                    } catch (e: any) {
                        alert("Erro: " + e.message);
                    } finally {
                        setLoading(false);
                        setStatus("");
                    }
                }}
                disabled={loading}
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Resetar Base
            </Button>
        </div>
    );
}
