'use client';

import { cn } from '@/lib/utils';
import type { Contexto } from '@/types/database';

interface ContextTagsProps {
    contextos: Contexto[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    loading?: boolean;
}

export function ContextTags({
    contextos,
    selectedId,
    onSelect,
    loading = false,
}: ContextTagsProps) {
    if (loading) {
        return (
            <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map(i => (
                    <div
                        key={i}
                        className="h-9 w-28 bg-muted rounded-full animate-pulse"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
                Contexto / Momento
            </label>

            <div className="flex flex-wrap gap-2">
                {/* Opção "Nenhum" */}
                <button
                    type="button"
                    onClick={() => onSelect(null)}
                    className={cn(
                        'px-4 py-2 rounded-full text-sm font-medium transition-all',
                        selectedId === null
                            ? 'bg-muted text-foreground ring-2 ring-primary/50'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                >
                    📍 Geral
                </button>

                {contextos.map(contexto => (
                    <button
                        key={contexto.id}
                        type="button"
                        onClick={() => onSelect(contexto.id)}
                        style={{
                            '--tag-color': contexto.cor,
                        } as React.CSSProperties}
                        className={cn(
                            'px-4 py-2 rounded-full text-sm font-medium transition-all',
                            selectedId === contexto.id
                                ? 'ring-2 ring-offset-1 ring-offset-background'
                                : 'hover:opacity-90'
                        )}
                        // Estilos dinâmicos baseados na cor do contexto
                        data-selected={selectedId === contexto.id}
                    >
                        <span
                            className={cn(
                                'flex items-center gap-1.5',
                                selectedId === contexto.id ? 'text-white' : ''
                            )}
                            style={{
                                ...(selectedId === contexto.id
                                    ? {
                                        backgroundColor: contexto.cor,
                                        padding: '0.5rem 1rem',
                                        margin: '-0.5rem -1rem',
                                        borderRadius: '9999px',
                                    }
                                    : {}
                                )
                            }}
                        >
                            <span>{contexto.icone}</span>
                            <span
                                className={selectedId !== contexto.id ? '' : ''}
                                style={{
                                    color: selectedId === contexto.id ? 'white' : contexto.cor
                                }}
                            >
                                {contexto.nome}
                            </span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

// Versão compacta para exibição em cards
interface ContextBadgeProps {
    contexto: Contexto | null;
    size?: 'sm' | 'md';
}

export function ContextBadge({ contexto, size = 'md' }: ContextBadgeProps) {
    if (!contexto) {
        return (
            <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full text-muted-foreground',
                size === 'sm' ? 'text-xs' : 'text-sm'
            )}>
                📍 Geral
            </span>
        );
    }

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
                size === 'sm' ? 'text-xs' : 'text-sm'
            )}
            style={{
                backgroundColor: `${contexto.cor}20`,
                color: contexto.cor,
            }}
        >
            <span>{contexto.icone}</span>
            <span className="font-medium">{contexto.nome}</span>
        </span>
    );
}
