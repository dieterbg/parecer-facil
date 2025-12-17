'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/components/auth-provider';
import type { Aluno, AlunoInsert, AlunoUpdate } from '@/types/database';

interface UseAlunosOptions {
    turmaId?: string;
    includeInactive?: boolean;
}

export function useAlunos(options: UseAlunosOptions = {}) {
    const { turmaId, includeInactive = false } = options;

    const [alunos, setAlunos] = useState<Aluno[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAlunos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('alunos')
                .select('*')
                .order('nome');

            if (turmaId) {
                query = query.eq('turma_id', turmaId);
            }

            if (!includeInactive) {
                query = query.eq('ativo', true);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            setAlunos(data || []);
        } catch (err) {
            console.error('Erro ao buscar alunos:', err);
            setError('Erro ao carregar alunos');
        } finally {
            setLoading(false);
        }
    }, [supabase, turmaId, includeInactive]);

    const createAluno = useCallback(async (dados: AlunoInsert): Promise<Aluno | null> => {
        try {
            const { data, error: insertError } = await supabase
                .from('alunos')
                .insert(dados)
                .select()
                .single();

            if (insertError) throw insertError;

            await fetchAlunos(); // Recarregar lista
            return data;
        } catch (err) {
            console.error('Erro ao criar aluno:', err);
            throw err;
        }
    }, [supabase, fetchAlunos]);

    const createMultipleAlunos = useCallback(async (dadosList: AlunoInsert[]): Promise<Aluno[]> => {
        try {
            const { data, error: insertError } = await supabase
                .from('alunos')
                .insert(dadosList)
                .select();

            if (insertError) throw insertError;

            await fetchAlunos(); // Recarregar lista
            return data || [];
        } catch (err) {
            console.error('Erro ao criar alunos:', err);
            throw err;
        }
    }, [supabase, fetchAlunos]);

    const updateAluno = useCallback(async (id: string, dados: AlunoUpdate): Promise<Aluno | null> => {
        try {
            const { data, error: updateError } = await supabase
                .from('alunos')
                .update(dados)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            await fetchAlunos(); // Recarregar lista
            return data;
        } catch (err) {
            console.error('Erro ao atualizar aluno:', err);
            throw err;
        }
    }, [supabase, fetchAlunos]);

    const deleteAluno = useCallback(async (id: string): Promise<boolean> => {
        try {
            // Soft delete - apenas marca como inativo
            const { error: updateError } = await supabase
                .from('alunos')
                .update({ ativo: false })
                .eq('id', id);

            if (updateError) throw updateError;

            await fetchAlunos(); // Recarregar lista
            return true;
        } catch (err) {
            console.error('Erro ao excluir aluno:', err);
            throw err;
        }
    }, [supabase, fetchAlunos]);

    const getAlunoById = useCallback(async (id: string): Promise<Aluno | null> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('alunos')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            return data;
        } catch (err) {
            console.error('Erro ao buscar aluno:', err);
            return null;
        }
    }, [supabase]);

    useEffect(() => {
        if (turmaId || !turmaId) { // Sempre buscar (com ou sem turmaId)
            fetchAlunos();
        }
    }, [fetchAlunos, turmaId]);

    return {
        alunos,
        loading,
        error,
        refetch: fetchAlunos,
        createAluno,
        createMultipleAlunos,
        updateAluno,
        deleteAluno,
        getAlunoById,
    };
}
