'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/components/auth-provider';
import type { Turma, TurmaInsert, TurmaUpdate, TurmaComAlunos } from '@/types/database';

export function useTurmas() {
    const [turmas, setTurmas] = useState<TurmaComAlunos[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const fetchTurmas = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('turmas')
                .select(`
          *,
          alunos:alunos(count)
        `)
                .eq('ativa', true)
                .order('nome');

            if (fetchError) throw fetchError;

            // Formatar contagem de alunos
            const turmasFormatadas = (data || []).map(turma => ({
                ...turma,
                _count: {
                    alunos: turma.alunos?.[0]?.count || 0
                }
            }));

            setTurmas(turmasFormatadas);
        } catch (err) {
            console.error('Erro ao buscar turmas:', err);
            setError('Erro ao carregar turmas');
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    const createTurma = useCallback(async (dados: TurmaInsert): Promise<Turma | null> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data, error: insertError } = await supabase
                .from('turmas')
                .insert({
                    ...dados,
                    user_id: user.id,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            await fetchTurmas(); // Recarregar lista
            return data;
        } catch (err) {
            console.error('Erro ao criar turma:', err);
            throw err;
        }
    }, [supabase, fetchTurmas]);

    const updateTurma = useCallback(async (id: string, dados: TurmaUpdate): Promise<Turma | null> => {
        try {
            const { data, error: updateError } = await supabase
                .from('turmas')
                .update(dados)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            await fetchTurmas(); // Recarregar lista
            return data;
        } catch (err) {
            console.error('Erro ao atualizar turma:', err);
            throw err;
        }
    }, [supabase, fetchTurmas]);

    const deleteTurma = useCallback(async (id: string): Promise<boolean> => {
        try {
            const { error: deleteError } = await supabase
                .from('turmas')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchTurmas(); // Recarregar lista
            return true;
        } catch (err) {
            console.error('Erro ao excluir turma:', err);
            throw err;
        }
    }, [supabase, fetchTurmas]);

    const getTurmaById = useCallback(async (id: string): Promise<TurmaComAlunos | null> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('turmas')
                .select(`
          *,
          alunos:alunos(*)
        `)
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            return data;
        } catch (err) {
            console.error('Erro ao buscar turma:', err);
            return null;
        }
    }, [supabase]);

    useEffect(() => {
        fetchTurmas();
    }, [fetchTurmas]);

    return {
        turmas,
        loading,
        error,
        refetch: fetchTurmas,
        createTurma,
        updateTurma,
        deleteTurma,
        getTurmaById,
    };
}
