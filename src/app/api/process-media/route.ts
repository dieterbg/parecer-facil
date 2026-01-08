import { NextResponse } from "next/server";
import { getModel } from "@/lib/gemini";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

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

// BNCC Fields for Early Childhood Education
const BNCC_FIELDS = {
    "EI-EO": "Eu, o outro e o nós",
    "EI-CG": "Corpo, gestos e movimentos",
    "EI-TS": "Traços, sons, cores e formas",
    "EI-EF": "Escuta, fala, pensamento e imaginação",
    "EI-ET": "Espaços, tempos, quantidades, relações e transformações"
};

/**
 * Extract base64 bytes from a URL (supports both regular URLs and data URLs)
 */
async function getMediaBytes(url: string): Promise<{ base64: string; mimeType: string }> {
    // Check if it's a data URL
    if (url.startsWith('data:')) {
        const matches = url.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
            return {
                base64: matches[2],
                mimeType: matches[1]
            };
        }
        throw new Error('Invalid data URL format');
    }

    // Regular URL - fetch and convert
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return {
        base64,
        mimeType: contentType
    };
}

interface StudentInfo {
    id: string;
    nome: string;
}

interface ProcessMediaRequest {
    registro_id?: string;
    media_url: string;
    media_type: "audio" | "image" | "video";
    turma_id?: string;
    students?: StudentInfo[]; // List of students in the class for AI detection
}

interface AIAnalysisResult {
    transcription?: string;
    tags_bncc: string[];
    suggested_students: string[]; // Array of student IDs suggested by AI
    ai_metadata: {
        confidence: number;
        detected_activities?: string[];
        detected_emotions?: string[];
        detected_student_names?: string[]; // Names mentioned/detected
        description?: string;
        processed_at: string;
    };
}

export async function POST(req: Request) {
    try {
        const { registro_id, media_url, media_type, turma_id, students }: ProcessMediaRequest = await req.json();

        if (!media_url || !media_type) {
            return NextResponse.json(
                { error: "Missing required fields: media_url, media_type" },
                { status: 400 }
            );
        }

        // Get students list if turma_id provided but students not passed
        let studentList = students || [];
        if (!studentList.length && turma_id) {
            const { data: alunosData } = await getSupabaseAdmin()
                .from("alunos")
                .select("id, nome")
                .eq("turma_id", turma_id)
                .eq("ativo", true);

            if (alunosData) {
                studentList = alunosData;
            }
        }

        let result: AIAnalysisResult;

        switch (media_type) {
            case "audio":
                result = await processAudio(media_url, studentList);
                break;
            case "image":
                result = await processImage(media_url, studentList);
                break;
            case "video":
                result = await processVideo(media_url, studentList);
                break;
            default:
                return NextResponse.json(
                    { error: "Invalid media_type. Must be: audio, image, or video" },
                    { status: 400 }
                );
        }

        // Update the registro with AI analysis if registro_id provided
        if (registro_id) {
            const { error: updateError } = await getSupabaseAdmin()
                .from("registros")
                .update({
                    transcricao_voz: result.transcription,
                    tags_bncc: result.tags_bncc,
                    ai_metadata: result.ai_metadata
                })
                .eq("id", registro_id);

            if (updateError) {
                console.error("Error updating registro:", updateError);
            }
        }

        return NextResponse.json({
            success: true,
            analysis: result
        });

    } catch (error: any) {
        console.error("Error processing media:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process media" },
            { status: 500 }
        );
    }
}

/**
 * Process audio file - transcribe, extract BNCC tags, and detect students
 */
async function processAudio(audioUrl: string, students: StudentInfo[]): Promise<AIAnalysisResult> {
    const model = getModel();

    // Get audio bytes (supports both data URLs and regular URLs)
    const { base64: audioBytes, mimeType } = await getMediaBytes(audioUrl);

    const studentNames = students.map(s => s.nome).join(", ");
    const studentContext = students.length > 0
        ? `\n\nALUNOS DA TURMA (identifique se algum nome é mencionado):\n${studentNames}`
        : "";

    const prompt = `Você é um assistente especializado em Educação Infantil.

Analise este áudio de uma professora falando sobre atividades ou observações de alunos.

Sua tarefa:
1. TRANSCREVA o áudio completo em português brasileiro
2. IDENTIFIQUE quais campos da BNCC estão relacionados ao conteúdo:
   - EI-EO: Eu, o outro e o nós (interações sociais, emoções, identidade)
   - EI-CG: Corpo, gestos e movimentos (atividades físicas, coordenação)
   - EI-TS: Traços, sons, cores e formas (arte, música, criatividade)
   - EI-EF: Escuta, fala, pensamento e imaginação (linguagem, histórias)
   - EI-ET: Espaços, tempos, quantidades, relações (matemática, ciências)
3. IDENTIFIQUE quais alunos são MENCIONADOS pelo nome no áudio${studentContext}

Responda APENAS em JSON válido:
{
  "transcription": "texto transcrito completo",
  "tags_bncc": ["EI-XX", "EI-YY"],
  "detected_student_names": ["Nome do Aluno 1", "Nome do Aluno 2"],
  "detected_activities": ["atividade1", "atividade2"],
  "detected_emotions": ["emoção1"],
  "confidence": 0.95
}`;

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: audioBytes,
                mimeType: mimeType || "audio/webm"
            }
        }
    ]);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
        throw new Error("Failed to parse AI response as JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Match detected names to student IDs
    const detectedNames = parsed.detected_student_names || [];
    const suggestedStudents = matchStudentsByName(detectedNames, students);

    return {
        transcription: parsed.transcription || "",
        tags_bncc: parsed.tags_bncc || [],
        suggested_students: suggestedStudents,
        ai_metadata: {
            confidence: parsed.confidence || 0.8,
            detected_activities: parsed.detected_activities || [],
            detected_emotions: parsed.detected_emotions || [],
            detected_student_names: detectedNames,
            processed_at: new Date().toISOString()
        }
    };
}

/**
 * Process image - analyze, extract BNCC tags, and estimate number of children
 */
async function processImage(imageUrl: string, students: StudentInfo[]): Promise<AIAnalysisResult> {
    const model = getModel();

    // Get image bytes (supports both data URLs and regular URLs)
    const { base64: imageBytes, mimeType } = await getMediaBytes(imageUrl);

    const studentCount = students.length;
    const studentContext = studentCount > 0
        ? `\n\nINFORMAÇÕES DA TURMA:\n- Total de alunos: ${studentCount}\n- Nomes: ${students.map(s => s.nome.split(' ')[0]).join(", ")}`
        : "";

    const prompt = `Você é um assistente especializado em Educação Infantil.

Analise esta foto tirada em uma sala de aula de educação infantil.

Sua tarefa:
1. DESCREVA brevemente o que você vê na imagem
2. CONTE quantas crianças aparecem na foto
3. IDENTIFIQUE quais campos da BNCC estão relacionados:
   - EI-EO: Eu, o outro e o nós (interações sociais, emoções, identidade)
   - EI-CG: Corpo, gestos e movimentos (atividades físicas, coordenação)
   - EI-TS: Traços, sons, cores e formas (arte, música, criatividade)
   - EI-EF: Escuta, fala, pensamento e imaginação (linguagem, histórias)
   - EI-ET: Espaços, tempos, quantidades, relações (matemática, ciências)
4. IDENTIFIQUE atividades visíveis (desenho, brincadeira, leitura, etc.)${studentContext}

Responda APENAS em JSON válido:
{
  "description": "descrição breve da imagem",
  "children_count": 3,
  "tags_bncc": ["EI-XX", "EI-YY"],
  "detected_activities": ["atividade1", "atividade2"],
  "confidence": 0.95
}`;

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: imageBytes,
                mimeType
            }
        }
    ]);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
        throw new Error("Failed to parse AI response as JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
        tags_bncc: parsed.tags_bncc || [],
        suggested_students: [], // For images, we can't identify specific students
        ai_metadata: {
            confidence: parsed.confidence || 0.8,
            detected_activities: parsed.detected_activities || [],
            description: parsed.description || "",
            processed_at: new Date().toISOString()
        }
    };
}

/**
 * Process video - extract frames and analyze
 */
async function processVideo(videoUrl: string, students: StudentInfo[]): Promise<AIAnalysisResult> {
    const model = getModel();

    // Get video bytes (supports both data URLs and regular URLs)
    const { base64: videoBytes, mimeType } = await getMediaBytes(videoUrl);

    const studentNames = students.map(s => s.nome).join(", ");
    const studentContext = students.length > 0
        ? `\n\nALUNOS DA TURMA (identifique se algum nome é mencionado no áudio do vídeo):\n${studentNames}`
        : "";

    const prompt = `Você é um assistente especializado em Educação Infantil.

Analise este vídeo gravado em uma sala de aula de educação infantil.

Sua tarefa:
1. DESCREVA brevemente o que acontece no vídeo
2. Se houver ÁUDIO, identifique nomes de alunos mencionados
3. IDENTIFIQUE quais campos da BNCC estão relacionados:
   - EI-EO: Eu, o outro e o nós (interações sociais, emoções, identidade)
   - EI-CG: Corpo, gestos e movimentos (atividades físicas, coordenação)
   - EI-TS: Traços, sons, cores e formas (arte, música, criatividade)
   - EI-EF: Escuta, fala, pensamento e imaginação (linguagem, histórias)
   - EI-ET: Espaços, tempos, quantidades, relações (matemática, ciências)
4. IDENTIFIQUE atividades e emoções visíveis${studentContext}

Responda APENAS em JSON válido:
{
  "description": "descrição breve do vídeo",
  "detected_student_names": ["Nome do Aluno 1"],
  "tags_bncc": ["EI-XX", "EI-YY"],
  "detected_activities": ["atividade1"],
  "detected_emotions": ["emoção1"],
  "confidence": 0.9
}`;

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: videoBytes,
                mimeType: mimeType || "video/mp4"
            }
        }
    ]);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
        throw new Error("Failed to parse AI response as JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Match detected names to student IDs
    const detectedNames = parsed.detected_student_names || [];
    const suggestedStudents = matchStudentsByName(detectedNames, students);

    return {
        tags_bncc: parsed.tags_bncc || [],
        suggested_students: suggestedStudents,
        ai_metadata: {
            confidence: parsed.confidence || 0.8,
            detected_activities: parsed.detected_activities || [],
            detected_emotions: parsed.detected_emotions || [],
            detected_student_names: detectedNames,
            description: parsed.description || "",
            processed_at: new Date().toISOString()
        }
    };
}

/**
 * Match detected student names to their IDs using fuzzy matching
 */
function matchStudentsByName(detectedNames: string[], students: StudentInfo[]): string[] {
    if (!detectedNames.length || !students.length) return [];

    const matchedIds: string[] = [];

    for (const detectedName of detectedNames) {
        const normalizedDetected = normalizeName(detectedName);

        for (const student of students) {
            const studentFirstName = normalizeName(student.nome.split(' ')[0]);
            const studentFullName = normalizeName(student.nome);

            // Check if the detected name matches first name or is contained in full name
            if (
                normalizedDetected === studentFirstName ||
                studentFullName.includes(normalizedDetected) ||
                normalizedDetected.includes(studentFirstName)
            ) {
                if (!matchedIds.includes(student.id)) {
                    matchedIds.push(student.id);
                }
                break;
            }
        }
    }

    return matchedIds;
}

/**
 * Normalize name for comparison (remove accents, lowercase)
 */
function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}
