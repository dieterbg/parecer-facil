'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/components/auth-provider';
import type {
    Marco,
    MarcoInsert,
    MarcoUpdate,
    AreaDesenvolvimento,
    DesenvolvimentoTracking
} from '@/types/database';

interface UseMarcosoptions {
    alunoId?: string;
    area?: AreaDesenvolvimento;
}

export function useMarcos(options: UseMarcosoptions = {}) {
    const { alunoId, area } = options;

    const [marcos, setMarcos] = useState<Marco[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMarcos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('marcos')
                .select('*')
                .order('data_marco', { ascending: false });

            if (alunoId) {
                query = query.eq('aluno_id', alunoId);
            }

            if (area) {
                query = query.eq('area', area);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            setMarcos(data || []);
        } catch (err) {
            console.error('Erro ao buscar marcos:', err);
            setError('Erro ao carregar marcos');
        } finally {
            setLoading(false);
        }
    }, [supabase, alunoId, area]);

    const createMarco = useCallback(async (dados: MarcoInsert): Promise<Marco | null> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data, error: insertError } = await supabase
                .from('marcos')
                .insert({
                    ...dados,
                    created_by: user.id,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            await fetchMarcos(); // Recarregar lista
            return data;
        } catch (err) {
            console.error('Erro ao criar marco:', err);
            throw err;
        }
    }, [supabase, fetchMarcos]);

    const updateMarco = useCallback(async (id: string, dados: MarcoUpdate): Promise<Marco | null> => {
        try {
            const { data, error: updateError } = await supabase
                .from('marcos')
                .update(dados)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            await fetchMarcos(); // Recarregar lista
            return data;
        } catch (err) {
            console.error('Erro ao atualizar marco:', err);
            throw err;
        }
    }, [supabase, fetchMarcos]);

    const deleteMarco = useCallback(async (id: string): Promise<boolean> => {
        try {
            const { error: deleteError } = await supabase
                .from('marcos')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchMarcos(); // Recarregar lista
            return true;
        } catch (err) {
            console.error('Erro ao excluir marco:', err);
            throw err;
        }
    }, [supabase, fetchMarcos]);

    // Adicionar evidência (registro) a um marco
    const addEvidencia = useCallback(async (marcoId: string, registroId: string): Promise<boolean> => {
        try {
            // Buscar marco atual
            const { data: marco, error: fetchError } = await supabase
                .from('marcos')
                .select('evidencias_ids')
                .eq('id', marcoId)
                .single();

            if (fetchError) throw fetchError;

            const evidenciasAtuais = marco?.evidencias_ids || [];

            if (evidenciasAtuais.includes(registroId)) {
                return true; // Já existe
            }

            const { error: updateError } = await supabase
                .from('marcos')
                .update({
                    evidencias_ids: [...evidenciasAtuais, registroId]
                })
                .eq('id', marcoId);

            if (updateError) throw updateError;

            await fetchMarcos();
            return true;
        } catch (err) {
            console.error('Erro ao adicionar evidência:', err);
            throw err;
        }
    }, [supabase, fetchMarcos]);

    // Remover evidência de um marco
    const removeEvidencia = useCallback(async (marcoId: string, registroId: string): Promise<boolean> => {
        try {
            const { data: marco, error: fetchError } = await supabase
                .from('marcos')
                .select('evidencias_ids')
                .eq('id', marcoId)
                .single();

            if (fetchError) throw fetchError;

            const evidenciasAtuais = marco?.evidencias_ids || [];
            const novasEvidencias = evidenciasAtuais.filter((id: string) => id !== registroId);

            const { error: updateError } = await supabase
                .from('marcos')
                .update({ evidencias_ids: novasEvidencias })
                .eq('id', marcoId);

            if (updateError) throw updateError;

            await fetchMarcos();
            return true;
        } catch (err) {
            console.error('Erro ao remover evidência:', err);
            throw err;
        }
    }, [supabase, fetchMarcos]);

    // Obter contagem de marcos por área para um aluno
    const getContagemorArea = useCallback(async (alunoIdParam: string) => {
        try {
            const { data, error: fetchError } = await supabase
                .from('marcos')
                .select('area')
                .eq('aluno_id', alunoIdParam);

            if (fetchError) throw fetchError;

            const contagem: Record<AreaDesenvolvimento, number> = {
                motor_fino: 0,
                motor_grosso: 0,
                linguagem_oral: 0,
                linguagem_escrita: 0,
                matematica: 0,
                social_emocional: 0,
                autonomia: 0,
                criatividade: 0,
                cognitivo: 0,
            };

            (data || []).forEach(m => {
                if (m.area in contagem) {
                    contagem[m.area as AreaDesenvolvimento]++;
                }
            });

            return contagem;
        } catch (err) {
            console.error('Erro ao contar marcos por área:', err);
            return null;
        }
    }, [supabase]);

    useEffect(() => {
        fetchMarcos();
    }, [fetchMarcos]);

    return {
        marcos,
        loading,
        error,
        refetch: fetchMarcos,
        createMarco,
        updateMarco,
        deleteMarco,
        addEvidencia,
        removeEvidencia,
        getContagemorArea,
    };
}

// Hook separado para tracking de desenvolvimento
export function useDesenvolvimento(alunoId: string) {
    const [tracking, setTracking] = useState<DesenvolvimentoTracking[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTracking = useCallback(async () => {
        try {
            setLoading(true);

            const { data, error: fetchError } = await supabase
                .from('desenvolvimento_tracking')
                .select('*')
                .eq('aluno_id', alunoId)
                .order('periodo', { ascending: false });

            if (fetchError) throw fetchError;

            setTracking(data || []);
        } catch (err) {
            console.error('Erro ao buscar tracking:', err);
        } finally {
            setLoading(false);
        }
    }, [supabase, alunoId]);

    const updateNivel = useCallback(async (
        area: AreaDesenvolvimento,
        nivel: number,
        periodo: string
    ): Promise<boolean> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { error: upsertError } = await supabase
                .from('desenvolvimento_tracking')
                .upsert({
                    aluno_id: alunoId,
                    area,
                    nivel,
                    periodo,
                    created_by: user.id,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'aluno_id,area,periodo'
                });

            if (upsertError) throw upsertError;

            await fetchTracking();
            return true;
        } catch (err) {
            console.error('Erro ao atualizar nível:', err);
            throw err;
        }
    }, [supabase, alunoId, fetchTracking]);

    // Obter níveis atuais (último período)
    const getNiveisAtuais = useCallback(() => {
        const resultado: Record<AreaDesenvolvimento, number> = {
            motor_fino: 0,
            motor_grosso: 0,
            linguagem_oral: 0,
            linguagem_escrita: 0,
            matematica: 0,
            social_emocional: 0,
            autonomia: 0,
            criatividade: 0,
            cognitivo: 0,
        };

        // Agrupar por área e pegar o mais recente
        tracking.forEach(t => {
            if (t.area in resultado) {
                // Se ainda não tem valor, ou se é mais recente
                resultado[t.area as AreaDesenvolvimento] = t.nivel;
            }
        });

        return resultado;
    }, [tracking]);

    useEffect(() => {
        if (alunoId) {
            fetchTracking();
        }
    }, [fetchTracking, alunoId]);

    return {
        tracking,
        loading,
        refetch: fetchTracking,
        updateNivel,
        getNiveisAtuais,
    };
}
