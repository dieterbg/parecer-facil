'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/components/auth-provider';
import type {
    PlanejamentoSemanal,
    PlanejamentoComAtividades,
    PlanejamentoInsert,
    PlanejamentoUpdate,
    AtividadePlanejada,
    AtividadePlanejadaInsert
} from '@/types/database';

interface UsePlanejamentoOptions {
    turmaId?: string;
}

export function usePlanejamento(options: UsePlanejamentoOptions = {}) {
    const { turmaId } = options;

    const [planejamentos, setPlanejamentos] = useState<PlanejamentoSemanal[]>([]);
    const [planejamentoAtual, setPlanejamentoAtual] = useState<PlanejamentoComAtividades | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Buscar planejamentos da turma
    const fetchPlanejamentos = useCallback(async () => {
        if (!turmaId) return;

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('planejamento_semanal')
                .select('*')
                .eq('turma_id', turmaId)
                .order('semana_inicio', { ascending: false });

            if (fetchError) throw fetchError;

            setPlanejamentos(data || []);
        } catch (err) {
            console.error('Erro ao buscar planejamentos:', err);
            setError('Erro ao carregar planejamentos');
        } finally {
            setLoading(false);
        }
    }, [turmaId]);

    // Buscar planejamento específico com atividades
    const getPlanejamentoComAtividades = useCallback(async (id: string): Promise<PlanejamentoComAtividades | null> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('planejamento_semanal')
                .select(`
          *,
          turma:turmas(*),
          atividades_planejadas(*)
        `)
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            // Ordenar atividades por dia e ordem
            if (data?.atividades_planejadas) {
                data.atividades_planejadas.sort((a: AtividadePlanejada, b: AtividadePlanejada) => {
                    if (a.dia_semana !== b.dia_semana) return a.dia_semana - b.dia_semana;
                    return a.ordem - b.ordem;
                });
            }

            setPlanejamentoAtual(data);
            return data;
        } catch (err) {
            console.error('Erro ao buscar planejamento:', err);
            return null;
        }
    }, []);

    // Buscar ou criar planejamento da semana
    const getOrCreatePlanejamentoSemana = useCallback(async (
        turmaIdParam: string,
        segundaFeira: Date
    ): Promise<PlanejamentoComAtividades | null> => {
        try {
            const semanaInicio = segundaFeira.toISOString().split('T')[0];

            // Tentar buscar existente
            const { data: existing, error: fetchError } = await supabase
                .from('planejamento_semanal')
                .select(`
          *,
          turma:turmas(*),
          atividades_planejadas(*)
        `)
                .eq('turma_id', turmaIdParam)
                .eq('semana_inicio', semanaInicio)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (existing) {
                // Ordenar atividades
                if (existing.atividades_planejadas) {
                    existing.atividades_planejadas.sort((a: AtividadePlanejada, b: AtividadePlanejada) => {
                        if (a.dia_semana !== b.dia_semana) return a.dia_semana - b.dia_semana;
                        return a.ordem - b.ordem;
                    });
                }
                setPlanejamentoAtual(existing);
                return existing;
            }

            // Criar novo
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data: novo, error: insertError } = await supabase
                .from('planejamento_semanal')
                .insert({
                    turma_id: turmaIdParam,
                    semana_inicio: semanaInicio,
                    user_id: user.id,
                })
                .select(`
          *,
          turma:turmas(*),
          atividades_planejadas(*)
        `)
                .single();

            if (insertError) throw insertError;

            setPlanejamentoAtual(novo);
            await fetchPlanejamentos();
            return novo;
        } catch (err) {
            console.error('Erro ao obter/criar planejamento:', err);
            return null;
        }
    }, [fetchPlanejamentos]);

    // Atualizar planejamento
    const updatePlanejamento = useCallback(async (id: string, dados: PlanejamentoUpdate): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('planejamento_semanal')
                .update({
                    ...dados,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (updateError) throw updateError;

            await fetchPlanejamentos();
            return true;
        } catch (err) {
            console.error('Erro ao atualizar planejamento:', err);
            throw err;
        }
    }, [fetchPlanejamentos]);

    // Adicionar atividade ao dia
    const addAtividadePlanejada = useCallback(async (dados: AtividadePlanejadaInsert): Promise<AtividadePlanejada | null> => {
        try {
            // Contar atividades do dia para definir ordem
            const { count } = await supabase
                .from('atividades_planejadas')
                .select('*', { count: 'exact', head: true })
                .eq('planejamento_id', dados.planejamento_id)
                .eq('dia_semana', dados.dia_semana);

            const { data, error: insertError } = await supabase
                .from('atividades_planejadas')
                .insert({
                    ...dados,
                    ordem: dados.ordem ?? (count || 0),
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Recarregar planejamento atual
            if (planejamentoAtual?.id === dados.planejamento_id) {
                await getPlanejamentoComAtividades(dados.planejamento_id);
            }

            return data;
        } catch (err) {
            console.error('Erro ao adicionar atividade:', err);
            throw err;
        }
    }, [planejamentoAtual, getPlanejamentoComAtividades]);

    // Mover atividade para outro dia
    const moverAtividade = useCallback(async (
        atividadeId: string,
        novoDia: number,
        novaOrdem: number
    ): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('atividades_planejadas')
                .update({
                    dia_semana: novoDia,
                    ordem: novaOrdem,
                })
                .eq('id', atividadeId);

            if (updateError) throw updateError;

            // Recarregar planejamento atual
            if (planejamentoAtual) {
                await getPlanejamentoComAtividades(planejamentoAtual.id);
            }

            return true;
        } catch (err) {
            console.error('Erro ao mover atividade:', err);
            throw err;
        }
    }, [planejamentoAtual, getPlanejamentoComAtividades]);

    // Marcar atividade como realizada
    const toggleRealizada = useCallback(async (atividadeId: string, realizada: boolean): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('atividades_planejadas')
                .update({ realizada })
                .eq('id', atividadeId);

            if (updateError) throw updateError;

            // Recarregar planejamento atual
            if (planejamentoAtual) {
                await getPlanejamentoComAtividades(planejamentoAtual.id);
            }

            return true;
        } catch (err) {
            console.error('Erro ao atualizar atividade:', err);
            throw err;
        }
    }, [planejamentoAtual, getPlanejamentoComAtividades]);

    // Remover atividade planejada
    const removeAtividadePlanejada = useCallback(async (atividadeId: string): Promise<boolean> => {
        try {
            const { error: deleteError } = await supabase
                .from('atividades_planejadas')
                .delete()
                .eq('id', atividadeId);

            if (deleteError) throw deleteError;

            // Recarregar planejamento atual
            if (planejamentoAtual) {
                await getPlanejamentoComAtividades(planejamentoAtual.id);
            }

            return true;
        } catch (err) {
            console.error('Erro ao remover atividade:', err);
            throw err;
        }
    }, [planejamentoAtual, getPlanejamentoComAtividades]);

    // Reordenar atividades no dia
    const reordenarAtividades = useCallback(async (
        planejamentoId: string,
        dia: number,
        atividadesOrdenadas: string[]
    ): Promise<boolean> => {
        try {
            // Atualizar ordem de cada atividade
            const updates = atividadesOrdenadas.map((id, index) =>
                supabase
                    .from('atividades_planejadas')
                    .update({ ordem: index })
                    .eq('id', id)
            );

            await Promise.all(updates);

            // Recarregar
            await getPlanejamentoComAtividades(planejamentoId);

            return true;
        } catch (err) {
            console.error('Erro ao reordenar atividades:', err);
            throw err;
        }
    }, [getPlanejamentoComAtividades]);

    useEffect(() => {
        if (turmaId) {
            fetchPlanejamentos();
        }
    }, [turmaId, fetchPlanejamentos]);

    return {
        planejamentos,
        planejamentoAtual,
        loading,
        error,
        refetch: fetchPlanejamentos,
        getPlanejamentoComAtividades,
        getOrCreatePlanejamentoSemana,
        updatePlanejamento,
        addAtividadePlanejada,
        moverAtividade,
        toggleRealizada,
        removeAtividadePlanejada,
        reordenarAtividades,
    };
}
