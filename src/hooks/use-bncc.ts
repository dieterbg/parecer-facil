'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/components/auth-provider';
import type { BnccCampo, FaixaEtariaBncc, CampoExperienciaBncc } from '@/types/database';

interface UseBnccOptions {
    faixaEtaria?: FaixaEtariaBncc;
    campo?: CampoExperienciaBncc;
}

export function useBncc(options: UseBnccOptions = {}) {
    const { faixaEtaria, campo } = options;

    const [campos, setCampos] = useState<BnccCampo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCampos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('bncc_campos')
                .select('*')
                .order('codigo');

            if (faixaEtaria) {
                query = query.eq('faixa_etaria', faixaEtaria);
            }

            if (campo) {
                query = query.eq('campo', campo);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            setCampos(data || []);
        } catch (err) {
            console.error('Erro ao buscar campos BNCC:', err);
            setError('Erro ao carregar campos BNCC');
        } finally {
            setLoading(false);
        }
    }, [faixaEtaria, campo]);

    // Buscar campo por código
    const getCampoByCodigo = useCallback(async (codigo: string): Promise<BnccCampo | null> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('bncc_campos')
                .select('*')
                .eq('codigo', codigo)
                .single();

            if (fetchError) throw fetchError;

            return data;
        } catch (err) {
            console.error('Erro ao buscar campo BNCC:', err);
            return null;
        }
    }, []);

    // Buscar múltiplos campos por código
    const getCamposByCodigos = useCallback(async (codigos: string[]): Promise<BnccCampo[]> => {
        if (!codigos.length) return [];

        try {
            const { data, error: fetchError } = await supabase
                .from('bncc_campos')
                .select('*')
                .in('codigo', codigos);

            if (fetchError) throw fetchError;

            return data || [];
        } catch (err) {
            console.error('Erro ao buscar campos BNCC:', err);
            return [];
        }
    }, []);

    // Buscar por palavra-chave
    const buscarPorPalavraChave = useCallback(async (termo: string): Promise<BnccCampo[]> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('bncc_campos')
                .select('*')
                .or(`objetivo.ilike.%${termo}%,palavras_chave.cs.{${termo}}`);

            if (fetchError) throw fetchError;

            return data || [];
        } catch (err) {
            console.error('Erro ao buscar campos BNCC:', err);
            return [];
        }
    }, []);

    useEffect(() => {
        fetchCampos();
    }, [fetchCampos]);

    return {
        campos,
        loading,
        error,
        refetch: fetchCampos,
        getCampoByCodigo,
        getCamposByCodigos,
        buscarPorPalavraChave,
    };
}
