'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/components/auth-provider';
import type {
    Atividade,
    AtividadeInsert,
    AtividadeUpdate,
    TipoAtividade,
    FaixaEtariaBncc
} from '@/types/database';

interface UseAtividadesOptions {
    tipo?: TipoAtividade;
    faixaEtaria?: FaixaEtariaBncc;
    includeTemplates?: boolean;
}

export function useAtividades(options: UseAtividadesOptions = {}) {
    const { tipo, faixaEtaria, includeTemplates = true } = options;

    const [atividades, setAtividades] = useState<Atividade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAtividades = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            let query = supabase
                .from('atividades')
                .select('*')
                .order('created_at', { ascending: false });

            // Filtrar por tipo
            if (tipo) {
                query = query.eq('tipo', tipo);
            }

            // Filtrar por faixa etária
            if (faixaEtaria) {
                query = query.eq('faixa_etaria', faixaEtaria);
            }

            // Incluir templates ou apenas do usuário
            if (includeTemplates) {
                query = query.or(`user_id.eq.${user.id},is_template.eq.true`);
            } else {
                query = query.eq('user_id', user.id);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            setAtividades(data || []);
        } catch (err) {
            console.error('Erro ao buscar atividades:', err);
            setError('Erro ao carregar atividades');
        } finally {
            setLoading(false);
        }
    }, [tipo, faixaEtaria, includeTemplates]);

    // Criar atividade
    const createAtividade = useCallback(async (dados: AtividadeInsert): Promise<Atividade | null> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data, error: insertError } = await supabase
                .from('atividades')
                .insert({
                    ...dados,
                    user_id: user.id,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            await fetchAtividades();
            return data;
        } catch (err) {
            console.error('Erro ao criar atividade:', err);
            throw err;
        }
    }, [fetchAtividades]);

    // Atualizar atividade
    const updateAtividade = useCallback(async (id: string, dados: AtividadeUpdate): Promise<Atividade | null> => {
        try {
            const { data, error: updateError } = await supabase
                .from('atividades')
                .update({
                    ...dados,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            await fetchAtividades();
            return data;
        } catch (err) {
            console.error('Erro ao atualizar atividade:', err);
            throw err;
        }
    }, [fetchAtividades]);

    // Deletar atividade
    const deleteAtividade = useCallback(async (id: string): Promise<boolean> => {
        try {
            const { error: deleteError } = await supabase
                .from('atividades')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchAtividades();
            return true;
        } catch (err) {
            console.error('Erro ao excluir atividade:', err);
            throw err;
        }
    }, [fetchAtividades]);

    // Duplicar atividade
    const duplicateAtividade = useCallback(async (id: string): Promise<Atividade | null> => {
        try {
            const { data: original, error: fetchError } = await supabase
                .from('atividades')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data, error: insertError } = await supabase
                .from('atividades')
                .insert({
                    titulo: `${original.titulo} (cópia)`,
                    descricao: original.descricao,
                    duracao_minutos: original.duracao_minutos,
                    materiais: original.materiais,
                    campos_bncc: original.campos_bncc,
                    tipo: original.tipo,
                    faixa_etaria: original.faixa_etaria,
                    cor: original.cor,
                    user_id: user.id,
                    is_template: false,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            await fetchAtividades();
            return data;
        } catch (err) {
            console.error('Erro ao duplicar atividade:', err);
            throw err;
        }
    }, [fetchAtividades]);

    // Buscar por texto
    const buscarAtividades = useCallback(async (termo: string): Promise<Atividade[]> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error: fetchError } = await supabase
                .from('atividades')
                .select('*')
                .or(`user_id.eq.${user.id},is_template.eq.true`)
                .or(`titulo.ilike.%${termo}%,descricao.ilike.%${termo}%`)
                .limit(20);

            if (fetchError) throw fetchError;

            return data || [];
        } catch (err) {
            console.error('Erro ao buscar atividades:', err);
            return [];
        }
    }, []);

    useEffect(() => {
        fetchAtividades();
    }, [fetchAtividades]);

    return {
        atividades,
        loading,
        error,
        refetch: fetchAtividades,
        createAtividade,
        updateAtividade,
        deleteAtividade,
        duplicateAtividade,
        buscarAtividades,
    };
}
