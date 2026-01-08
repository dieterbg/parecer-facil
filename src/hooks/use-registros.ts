'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/components/auth-provider';
import type {
    Registro,
    RegistroInsert,
    RegistroComDetalhes,
    Contexto,
    TipoRegistro
} from '@/types/database';

interface UseRegistrosOptions {
    turmaId?: string;
    alunoId?: string;
    tipo?: TipoRegistro;
    contextoId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
}

export function useRegistros(options: UseRegistrosOptions = {}) {
    const { turmaId, alunoId, tipo, contextoId, startDate, endDate, limit = 50 } = options;

    const [registros, setRegistros] = useState<RegistroComDetalhes[]>([]);
    const [contextos, setContextos] = useState<Contexto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Buscar contextos disponíveis
    const fetchContextos = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('contextos')
                .select('*')
                .order('ordem');

            if (fetchError) throw fetchError;

            setContextos(data || []);
        } catch (err) {
            console.error('Erro ao buscar contextos:', err);
        }
    }, [supabase]);

    // Buscar registros com filtros
    const fetchRegistros = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('registros')
                .select(`
          *,
          contexto:contextos(*),
          registros_alunos(
            aluno:alunos(*)
          )
        `)
                .order('data_registro', { ascending: false })
                .limit(limit);

            // Filtro por tipo
            if (tipo) {
                query = query.eq('tipo', tipo);
            }

            // Filtro por contexto
            if (contextoId) {
                query = query.eq('contexto_id', contextoId);
            }

            // Filtro por período
            if (startDate) {
                query = query.gte('data_registro', startDate);
            }
            if (endDate) {
                query = query.lte('data_registro', endDate);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            let registrosFiltrados = data || [];

            // Filtrar por turma (via alunos)
            if (turmaId) {
                registrosFiltrados = registrosFiltrados.filter(reg =>
                    reg.registros_alunos?.some((ra: { aluno?: { turma_id?: string } }) => ra.aluno?.turma_id === turmaId)
                );
            }

            // Filtrar por aluno específico
            if (alunoId) {
                registrosFiltrados = registrosFiltrados.filter(reg =>
                    reg.registros_alunos?.some((ra: { aluno?: { id?: string } }) => ra.aluno?.id === alunoId)
                );
            }

            setRegistros(registrosFiltrados);
        } catch (err) {
            console.error('Erro ao buscar registros:', err);
            setError('Erro ao carregar registros');
        } finally {
            setLoading(false);
        }
    }, [supabase, turmaId, alunoId, tipo, contextoId, startDate, endDate, limit]);

    // Criar novo registro
    const createRegistro = useCallback(async (
        dados: RegistroInsert,
        alunosIds: string[]
    ): Promise<Registro | null> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            // 1. Criar o registro
            const insertData = {
                ...dados,
                created_by: user.id,
            };
            console.log('Inserindo registro:', insertData);

            const { data: registro, error: insertError } = await supabase
                .from('registros')
                .insert(insertData)
                .select()
                .single();

            if (insertError) {
                console.error('Erro insert Supabase:', insertError);
                throw insertError;
            }

            // 2. Vincular aos alunos
            if (alunosIds.length > 0) {
                const vinculos = alunosIds.map(alunoId => ({
                    registro_id: registro.id,
                    aluno_id: alunoId,
                }));

                const { error: vinculoError } = await supabase
                    .from('registros_alunos')
                    .insert(vinculos);

                if (vinculoError) throw vinculoError;
            }

            await fetchRegistros(); // Recarregar lista
            return registro;
        } catch (err) {
            console.error('Erro ao criar registro:', err);
            throw err;
        }
    }, [supabase, fetchRegistros]);

    // Upload de arquivo
    const uploadArquivo = useCallback(async (
        file: File,
        tipo: TipoRegistro
    ): Promise<string> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
            const filename = `${user.id}/${tipo}/${Date.now()}.${extension}`;

            const { error: uploadError } = await supabase.storage
                .from('registros')
                .upload(filename, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('registros')
                .getPublicUrl(filename);

            return publicUrl;
        } catch (err) {
            console.error('Erro ao fazer upload:', err);
            throw err;
        }
    }, [supabase]);

    // Deletar registro
    const deleteRegistro = useCallback(async (id: string): Promise<boolean> => {
        try {
            const { error: deleteError } = await supabase
                .from('registros')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchRegistros(); // Recarregar lista
            return true;
        } catch (err) {
            console.error('Erro ao excluir registro:', err);
            throw err;
        }
    }, [supabase, fetchRegistros]);

    // Atualizar compartilhamento com família
    const toggleCompartilharFamilia = useCallback(async (
        id: string,
        compartilhar: boolean
    ): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('registros')
                .update({ compartilhar_familia: compartilhar })
                .eq('id', id);

            if (updateError) throw updateError;

            await fetchRegistros();
            return true;
        } catch (err) {
            console.error('Erro ao atualizar compartilhamento:', err);
            throw err;
        }
    }, [supabase, fetchRegistros]);

    useEffect(() => {
        fetchRegistros();
        fetchContextos();
    }, [fetchRegistros, fetchContextos]);

    return {
        registros,
        contextos,
        loading,
        error,
        refetch: fetchRegistros,
        createRegistro,
        uploadArquivo,
        deleteRegistro,
        toggleCompartilharFamilia,
    };
}
