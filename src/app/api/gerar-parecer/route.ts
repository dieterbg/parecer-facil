
import { getModel } from "@/lib/gemini";
import { supabase } from "@/components/auth-provider"; // Using the client for now, but should ideally use service role if RLS prevents server-side fetch without session
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Lazy initialization for admin client
let supabaseAdmin: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient {
    if (!supabaseAdmin) {
        supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }
    return supabaseAdmin;
}

export async function POST(req: Request) {
    try {
        const { aluno_id, turma_id, periodo_inicio, periodo_fim, professor_instrucoes, audio_url } = await req.json();

        // 1. Fetch Student Data (Aggregation)
        const { data: aluno } = await getSupabaseAdmin()
            .from("alunos")
            .select("*")
            .eq("id", aluno_id)
            .single();

        if (!aluno) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

        // 2. Fetch Registros (Observations, Photos, etc.)
        const { data: registros } = await getSupabaseAdmin()
            .from("registros_alunos")
            .select(`
                registro:registros (
                    id, tipo, descricao, transcricao_voz, data_registro, is_evidencia,
                    contexto:contextos(nome)
                )
            `)
            .eq("aluno_id", aluno_id)
            .gte("registro.data_registro", periodo_inicio)
            .lte("registro.data_registro", periodo_fim);

        // 3. Fetch Marcos (Milestones)
        const { data: marcos } = await getSupabaseAdmin()
            .from("marcos")
            .select("*")
            .eq("aluno_id", aluno_id);

        // 4. Fetch Professor Preferences (Style & Length)
        // Assuming current user is the professor or we have the professor_id in the request. 
        // For now, we'll try to find the professor profile linked to the auth user.
        // Since we are in an API route without easy auth context access unless passed, 
        // we might rely on the client passing the uid or fetching it based on the authenticated session if configured.
        // Let's assume we can query 'professores' by the 'created_by' of the student or explicit param.
        // For simplicity and robustness, let's fetch based on the supabase auth user who made the request (if we had the session). 
        // As a fallback/parity with n8n (which received professorUid), let's expect it or look up "created_by" from the student.

        let perfilProfessor = { estilo_escrita: "Formal e acolhedor", paginas_esperadas: 1 };

        // Try to fetch professor profile using the user who created the student/class
        const { data: professorData } = await getSupabaseAdmin()
            .from("professores")
            .select("estilo_escrita, paginas_esperadas")
            .eq("uid", aluno.turma_id ? (await getSupabaseAdmin().from("turmas").select("user_id").eq("id", turma_id).single()).data?.user_id : null)
            .single();

        if (professorData) {
            perfilProfessor = { ...perfilProfessor, ...professorData };
        }

        // 5. Prepare Context for Gemini
        const registrosTexto = registros
            ?.filter((r: any) => r.registro != null) // Filtrar registros nulos
            ?.map((r: any) => {
                const reg = r.registro;
                return `- [${new Date(reg.data_registro).toLocaleDateString()}] (${reg.contexto?.nome || 'Geral'}) ${reg.tipo}: ${reg.descricao || ''} ${reg.is_evidencia ? '[EVIDÊNCIA]' : ''}`;
            }).join("\n") || "Nenhum registro no período.";

        const marcosTexto = marcos?.map((m: any) => {
            return `- ${m.titulo} (${m.area}): ${m.descricao || 'Atingido'}`;
        }).join("\n");

        // 6. Construct Prompt
        const prompt = `
        Você é um especialista pedagógico em Educação Infantil. Sua tarefa é escrever um PARECER DESCRITIVO para um aluno.
        
        DADOS DO ALUNO:
        Nome: ${aluno.nome}
        Idade: (Calcular baseada na data de nascimento: ${aluno.data_nascimento})
        
        ESTILO DE ESCRITA (CRITICO):
        Você DEVE adotar o seguinte estilo de escrita: "${perfilProfessor.estilo_escrita}".
        Isso é fundamental. Se o estilo for formal, seja formal. Se for afetivo, seja afetivo.
        
        TAMANHO ESTIMADO:
        O texto final deve ter aproximadamente ${perfilProfessor.paginas_esperadas} página(s) de extensão.
        
        REGISTROS DE OBSERVAÇÃO DO PERÍODO:
        ${registrosTexto}

        MARCOS DE DESENVOLVIMENTO:
        ${marcosTexto}

        INSTRUÇÕES EXTRAS DO PROFESSOR (Áudio/Texto):
        ${professor_instrucoes || "Nenhuma instrução específica."}

        DIRETRIZES DE ESCRITA:
        1. **Literalidade e Exemplos**: Ao analisar o áudio ou instruções do professor, preserve expressões chave e exemplos práticos citados. Se o professor contou uma história específica sobre o aluno, ela deve aparecer no parecer.
        2. **Foco nas Conquistas**: Destaque o que a criança já consegue fazer.
        3. **Evidências**: Use os [REGISTROS] e [MARCOS] como provas do desenvolvimento.
        4. **Sem Rótulos**: Evite julgamentos negativos.
        5. **CITAÇÃO OBRIGATÓRIA (MUITO IMPORTANTE)**: Sempre que fizer uma afirmação sobre o desenvolvimento da criança, CITE A DATA e a ATIVIDADE específica que embasa essa afirmação. Exemplos:
           - "Conforme observado na atividade de pintura do dia 15/03..."
           - "Durante a roda de conversa registrada em 22/04, [nome] demonstrou..."
           - "A foto do dia 10/05 evidencia que [nome] já consegue..."
           Isso é ESSENCIAL para que o parecer seja verificável e baseado em evidências concretas.
        
        Gere o parecer em formato Markdown HTML-friendly (pode usar <b>, <br>, etc).
        `;

        let result;

        // 6. Multimodal Processing (if audio exists)
        if (audio_url) {
            // Fetch audio blob
            const audioResponse = await fetch(audio_url);
            const audioArrayBuffer = await audioResponse.arrayBuffer();
            const audioBytes = Buffer.from(audioArrayBuffer).toString("base64");

            const audioPart = {
                inlineData: {
                    data: audioBytes,
                    mimeType: "audio/webm", // Assuming webm from recorder, ideally detect extension
                },
            };

            result = await getModel().generateContent([prompt, audioPart]);
        } else {
            result = await getModel().generateContent(prompt);
        }

        const responseText = result.response.text();

        // 7. Save Draft
        // Calcular idade do aluno
        const idade = aluno.data_nascimento
            ? Math.floor((new Date().getTime() - new Date(aluno.data_nascimento).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
            : null;

        // Buscar uid do professor (dono da turma)
        const { data: turmaData } = await getSupabaseAdmin()
            .from("turmas")
            .select("user_id")
            .eq("id", turma_id)
            .single();

        const { data: parecer, error: dbError } = await getSupabaseAdmin()
            .from("pareceres")
            .insert({
                aluno_id,
                turma_id,
                aluno_nome: aluno.nome,
                aluno_idade: idade ? `${idade} anos` : "Idade não informada",
                uid_professor: turmaData?.user_id,
                resultado_texto: responseText,
                conteudo_editado: responseText,
                status: "rascunho"
            })
            .select()
            .single();

        if (dbError) throw dbError;

        return NextResponse.json({ success: true, parecer });

    } catch (error: any) {
        console.error("Erro na geração:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
