'use client';

import { useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBncc } from '@/hooks/use-bncc';
import {
    CAMPOS_EXPERIENCIA,
    FAIXAS_ETARIAS,
    type BnccCampo,
    type FaixaEtariaBncc,
    type CampoExperienciaBncc
} from '@/types/database';

interface BnccSelectorProps {
    selectedCodigos: string[];
    onChange: (codigos: string[]) => void;
    faixaEtaria?: FaixaEtariaBncc;
    maxSelections?: number;
}

export function BnccSelector({
    selectedCodigos,
    onChange,
    faixaEtaria,
    maxSelections = 5
}: BnccSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFaixa, setSelectedFaixa] = useState<FaixaEtariaBncc | undefined>(faixaEtaria);
    const [selectedCampo, setSelectedCampo] = useState<CampoExperienciaBncc | null>(null);

    const { campos, loading } = useBncc({
        faixaEtaria: selectedFaixa,
        campo: selectedCampo || undefined
    });

    const handleToggleCodigo = (codigo: string) => {
        if (selectedCodigos.includes(codigo)) {
            onChange(selectedCodigos.filter(c => c !== codigo));
        } else if (selectedCodigos.length < maxSelections) {
            onChange([...selectedCodigos, codigo]);
        }
    };

    const handleRemoveCodigo = (codigo: string) => {
        onChange(selectedCodigos.filter(c => c !== codigo));
    };

    // Agrupar campos por campo de experiência
    const camposAgrupados = campos.reduce((acc, campo) => {
        if (!acc[campo.campo]) {
            acc[campo.campo] = [];
        }
        acc[campo.campo].push(campo);
        return acc;
    }, {} as Record<CampoExperienciaBncc, BnccCampo[]>);

    return (
        <div className="relative">
            {/* Badges selecionados */}
            {selectedCodigos.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {selectedCodigos.map(codigo => (
                        <span
                            key={codigo}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                        >
                            {codigo}
                            <button
                                type="button"
                                onClick={() => handleRemoveCodigo(codigo)}
                                className="hover:bg-primary/20 rounded-full p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Botão para abrir seletor */}
            <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full justify-between"
            >
                <span className="flex items-center gap-2">
                    📚 Campos BNCC
                    {selectedCodigos.length > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                            {selectedCodigos.length}
                        </span>
                    )}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-card border rounded-xl shadow-xl max-h-[400px] overflow-hidden">
                    {/* Filtros */}
                    <div className="p-3 border-b bg-muted/50 space-y-2">
                        {/* Faixa etária */}
                        <div className="flex gap-1">
                            {(Object.entries(FAIXAS_ETARIAS) as [FaixaEtariaBncc, { label: string }][]).map(([faixa, { label }]) => (
                                <button
                                    key={faixa}
                                    type="button"
                                    onClick={() => setSelectedFaixa(selectedFaixa === faixa ? undefined : faixa)}
                                    className={`px-2 py-1 text-xs rounded-lg transition-colors ${selectedFaixa === faixa
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-muted/80'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Campos de experiência */}
                        <div className="flex gap-1 flex-wrap">
                            {(Object.entries(CAMPOS_EXPERIENCIA) as [CampoExperienciaBncc, { sigla: string; cor: string }][]).map(([campo, { sigla, cor }]) => (
                                <button
                                    key={campo}
                                    type="button"
                                    onClick={() => setSelectedCampo(selectedCampo === campo ? null : campo)}
                                    className={`px-2 py-1 text-xs rounded-lg transition-colors font-medium ${selectedCampo === campo
                                        ? 'text-white'
                                        : 'bg-muted hover:bg-muted/80'
                                        }`}
                                    style={selectedCampo === campo ? { backgroundColor: cor } : {}}
                                >
                                    {sigla}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lista de campos */}
                    <div className="overflow-y-auto max-h-[280px] p-2">
                        {loading ? (
                            <div className="text-center py-4 text-muted-foreground">Carregando...</div>
                        ) : campos.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">Nenhum campo encontrado</div>
                        ) : (
                            <div className="space-y-1">
                                {campos.map(campo => {
                                    const isSelected = selectedCodigos.includes(campo.codigo);
                                    const campoInfo = CAMPOS_EXPERIENCIA[campo.campo];

                                    return (
                                        <button
                                            key={campo.codigo}
                                            type="button"
                                            onClick={() => handleToggleCodigo(campo.codigo)}
                                            disabled={!isSelected && selectedCodigos.length >= maxSelections}
                                            className={`w-full text-left p-2 rounded-lg transition-colors flex gap-2 ${isSelected
                                                ? 'bg-primary/10 border border-primary/30'
                                                : 'hover:bg-muted disabled:opacity-50'
                                                }`}
                                        >
                                            <div
                                                className="w-1 shrink-0 rounded-full"
                                                style={{ backgroundColor: campoInfo?.cor }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-medium text-primary">
                                                        {campo.codigo}
                                                    </span>
                                                    {isSelected && <Check className="w-3 h-3 text-primary" />}
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                    {campo.objetivo}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Rodapé */}
                    <div className="p-2 border-t bg-muted/50 flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                            {selectedCodigos.length}/{maxSelections} selecionados
                        </span>
                        <Button type="button" size="sm" onClick={() => setIsOpen(false)}>
                            Fechar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Badge simples para exibir código BNCC
interface BnccBadgeProps {
    codigo: string;
    onRemove?: () => void;
    size?: 'sm' | 'md';
}

export function BnccBadge({ codigo, onRemove, size = 'sm' }: BnccBadgeProps) {
    // Extrair sigla do campo (EI01EO01 -> EO)
    const siglaMatch = codigo.match(/EI\d{2}(\w{2})\d{2}/);
    const sigla = siglaMatch ? siglaMatch[1] : '';

    const fieldMap: Record<string, CampoExperienciaBncc> = {
        'EO': 'O eu, o outro e o nós',
        'CG': 'Corpo, gestos e movimentos',
        'TS': 'Traços, sons, cores e formas',
        'EF': 'Escuta, fala, pensamento e imaginação',
        'ET': 'Espaços, tempos, quantidades, relações e transformações',
    };

    const campo = fieldMap[sigla];
    const cor = campo ? CAMPOS_EXPERIENCIA[campo]?.cor : '#6366F1';

    return (
        <span
            className={`inline-flex items-center gap-1 rounded font-mono font-medium ${size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'
                }`}
            style={{ backgroundColor: `${cor}20`, color: cor }}
        >
            {codigo}
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="hover:opacity-70 transition-opacity"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </span>
    );
}
