import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Esta rota cria um usuário de demonstração com dados de exemplo para testes
// Criar: usuário admin + turma + alunos + registros

export async function POST() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('=== Setup Demo API ===');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Key presente:', !!supabaseServiceKey);

    if (!supabaseServiceKey) {
        return NextResponse.json({
            error: 'SUPABASE_SERVICE_ROLE_KEY não configurada',
            details: 'Configure a variável de ambiente e reinicie o servidor'
        }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const email = 'demo@floresce.ai';
    const password = 'demo123';
    const nome = 'Professora Demo';

    try {
        // 1. Tentar login primeiro - se funcionar, usuário já existe
        let userId: string | null = null;

        console.log('Tentando login como usuário demo...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (signInData?.user?.id) {
            // Login bem-sucedido - usuário já existe
            userId = signInData.user.id;
            console.log('Login bem-sucedido! Usuário demo existe, ID:', userId);
        } else {
            // Login falhou - verificar se é credenciais inválidas (usuário não existe) ou outro erro
            console.log('Login falhou:', signInError?.message);

            // Tentar criar usuário via Admin API
            console.log('Criando novo usuário demo via admin API...');
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: nome }
            });

            if (createError) {
                // Se falhou porque usuário já existe, tentar buscar via listUsers
                if (createError.message?.includes('already exists') || createError.message?.includes('already registered')) {
                    console.log('Usuário já existe, buscando via listUsers...');
                    const { data: usersData } = await supabase.auth.admin.listUsers();
                    const existing = usersData?.users?.find(u => u.email === email);
                    if (existing) {
                        userId = existing.id;
                        console.log('Usuário encontrado via listUsers, ID:', userId);
                    }
                }

                if (!userId) {
                    console.error('Erro ao criar usuário:', createError);
                    return NextResponse.json({
                        error: 'Erro ao criar usuário demo',
                        details: createError.message
                    }, { status: 500 });
                }
            } else {
                userId = newUser.user?.id || null;
                console.log('Novo usuário criado, ID:', userId);
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Não foi possível obter o ID do usuário' }, { status: 500 });
        }

        // 2. Criar/atualizar perfil do professor
        await supabase.from('professores').upsert({
            uid: userId,
            nome: nome,
            email: email,
            estilo_escrita: 'Sou uma professora dedicada à educação infantil, com uma abordagem acolhedora e observadora. Valorizo o desenvolvimento integral das crianças e busco sempre destacar suas conquistas únicas.'
        }, { onConflict: 'uid' });

        // 3. Verificar se já existe turma demo
        const { data: existingTurmas } = await supabase
            .from('turmas')
            .select('id')
            .eq('user_id', userId)
            .eq('nome', 'Turma Jardim II - Demo')
            .limit(1);

        if (existingTurmas && existingTurmas.length > 0) {
            return NextResponse.json({
                success: true,
                message: 'Usuário demo e dados de exemplo já existem!',
                email,
                password,
                turmaId: existingTurmas[0].id
            });
        }

        // 4. Criar turma demo
        const { data: novaTurma, error: turmaError } = await supabase
            .from('turmas')
            .insert({
                user_id: userId,
                nome: 'Turma Jardim II - Demo',
                ano_letivo: '2025',
                escola: 'Escola Demonstração'
            })
            .select()
            .single();

        if (turmaError) throw turmaError;

        const turmaId = novaTurma.id;

        // 5. Criar alunos demo
        const alunosDemo = [
            { nome: 'Ana Beatriz Silva', data_nascimento: '2020-03-15', turma_id: turmaId },
            { nome: 'Pedro Henrique Costa', data_nascimento: '2020-06-22', turma_id: turmaId },
            { nome: 'Maria Eduarda Santos', data_nascimento: '2020-01-08', turma_id: turmaId },
            { nome: 'Lucas Gabriel Oliveira', data_nascimento: '2020-09-30', turma_id: turmaId },
            { nome: 'Sophia Fernandes', data_nascimento: '2020-11-12', turma_id: turmaId }
        ];

        const { data: alunos, error: alunosError } = await supabase
            .from('alunos')
            .insert(alunosDemo)
            .select();

        if (alunosError) throw alunosError;

        // 6. Criar registros demo
        const hoje = new Date();
        const registrosDemo = [
            {
                tipo: 'texto',
                descricao: 'Ana Beatriz mostrou grande interesse na atividade de pintura hoje. Ela explorou diferentes cores e texturas, demonstrando criatividade ao misturar as tintas.',
                data_registro: new Date(hoje.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tags_bncc: ['EI-TS', 'EI-EF'],
                created_by: userId,
                is_evidencia: true
            },
            {
                tipo: 'texto',
                descricao: 'Pedro conseguiu empilhar 8 blocos pela primeira vez! Ficou muito orgulhoso e quis mostrar para todos os amigos.',
                data_registro: new Date(hoje.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tags_bncc: ['EI-CG', 'EI-ET'],
                created_by: userId,
                is_evidencia: true
            },
            {
                tipo: 'texto',
                descricao: 'Roda de história: as crianças participaram ativamente, fazendo perguntas sobre os personagens. Maria foi a primeira a identificar a moral da história.',
                data_registro: new Date(hoje.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tags_bncc: ['EI-EO', 'EI-EF'],
                created_by: userId,
                is_evidencia: false
            },
            {
                tipo: 'texto',
                descricao: 'Lucas demonstrou liderança durante a brincadeira no parque, organizando os colegas para uma brincadeira de faz de conta.',
                data_registro: hoje.toISOString().split('T')[0],
                tags_bncc: ['EI-EO', 'EI-CG'],
                created_by: userId,
                is_evidencia: true
            },
            {
                tipo: 'texto',
                descricao: 'Sophia ajudou uma colega que estava triste, mostrando empatia e cuidado. Momento muito bonito de desenvolvimento socioemocional.',
                data_registro: hoje.toISOString().split('T')[0],
                tags_bncc: ['EI-EO'],
                created_by: userId,
                is_evidencia: true
            }
        ];

        const { data: registros, error: registrosError } = await supabase
            .from('registros')
            .insert(registrosDemo)
            .select();

        if (registrosError) {
            console.error('Erro ao criar registros:', registrosError);
            // Continua mesmo se falhar registros
        }

        // 7. Vincular registros aos alunos
        if (registros && registros.length > 0 && alunos && alunos.length > 0) {
            const vinculos = [
                { registro_id: registros[0].id, aluno_id: alunos[0].id }, // Ana
                { registro_id: registros[1].id, aluno_id: alunos[1].id }, // Pedro
                { registro_id: registros[2].id, aluno_id: alunos[0].id }, // Roda - Ana
                { registro_id: registros[2].id, aluno_id: alunos[1].id }, // Roda - Pedro
                { registro_id: registros[2].id, aluno_id: alunos[2].id }, // Roda - Maria
                { registro_id: registros[3].id, aluno_id: alunos[3].id }, // Lucas
                { registro_id: registros[4].id, aluno_id: alunos[4].id }, // Sophia
            ];

            await supabase.from('registros_alunos').insert(vinculos);
        }

        return NextResponse.json({
            success: true,
            message: 'Usuário demo e dados de exemplo criados com sucesso!',
            email,
            password,
            turmaId,
            stats: {
                alunos: alunos?.length || 0,
                registros: registros?.length || 0
            }
        });

    } catch (error: any) {
        console.error('Erro ao criar dados demo:', error);
        return NextResponse.json({
            error: error.message || 'Erro ao criar dados demo',
            hint: 'Verifique as permissões do Supabase e se todas as tabelas existem'
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Para criar o usuário demo com dados de exemplo, faça um POST para esta rota.',
        credentials: {
            email: 'demo@floresce.ai',
            password: 'demo123'
        },
        willCreate: {
            user: 'Professor Demo',
            turma: 'Turma Jardim II - Demo com 5 alunos',
            registros: '5 registros de exemplo com tags BNCC'
        }
    });
}
