'use client';

import { Check, Clock, Trash2, Grip, Image, FileText, Camera } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    TIPOS_ATIVIDADE,
    type AtividadePlanejada,
    type TipoAtividade
} from '@/types/database';
import { BnccBadge } from './bncc-selector';

interface ActivityCardProps {
    atividade: AtividadePlanejada;
    onToggleRealizada?: () => void;
    onRemove?: () => void;
    onClick?: () => void;
    onAddRegistro?: () => void; // Nova prop para criar registro vinculado
    isDragging?: boolean;
}

export function ActivityCard({
    atividade,
    onToggleRealizada,
    onRemove,
    onClick,
    onAddRegistro,
    isDragging = false
}: ActivityCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: atividade.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const tipo = (atividade.cor ?
        Object.entries(TIPOS_ATIVIDADE).find(([, v]) => v.cor === atividade.cor)?.[0] :
        'livre') as TipoAtividade | undefined;

    const tipoInfo = tipo ? TIPOS_ATIVIDADE[tipo] : null;

    // Contagem de registros vinculados
    const numRegistros = atividade.registros_ids?.length || 0;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
        bg-card border rounded-lg p-3 cursor-pointer
        transition-all hover:border-primary/50 hover:shadow-md
        ${atividade.realizada ? 'border-green-500/30 bg-green-500/10' : ''}
        ${isDragging ? 'shadow-lg ring-2 ring-primary/50' : ''}
      `}
            onClick={onClick}
        >
            <div className="flex items-start gap-2">
                {/* Drag handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-1 p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
                    onClick={e => e.stopPropagation()}
                >
                    <Grip className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-medium text-sm truncate ${atividade.realizada ? 'text-green-700' : ''}`}>
                                {atividade.realizada && '✅ '}
                                {atividade.titulo}
                            </h4>

                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                {tipoInfo && (
                                    <span className="flex items-center gap-1">
                                        <span>{tipoInfo.icon}</span>
                                        <span>{tipoInfo.label}</span>
                                    </span>
                                )}
                                {atividade.duracao_minutos > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {atividade.duracao_minutos}min
                                    </span>
                                )}
                                {/* Indicador de registros */}
                                {numRegistros > 0 && (
                                    <span className="flex items-center gap-1 text-green-600">
                                        <Image className="w-3 h-3" />
                                        {numRegistros}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-1">
                            {onAddRegistro && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAddRegistro();
                                    }}
                                    className="p-1.5 rounded-full bg-muted hover:bg-blue-100 hover:text-blue-600 transition-colors"
                                    title="Registrar esta atividade"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            )}
                            {onToggleRealizada && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleRealizada();
                                    }}
                                    className={`p-1.5 rounded-full transition-colors ${atividade.realizada
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-muted hover:bg-green-100 hover:text-green-600'
                                        }`}
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            )}
                            {onRemove && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove();
                                    }}
                                    className="p-1.5 rounded-full bg-muted hover:bg-red-100 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Observação inline (quando realizada) */}
                    {atividade.realizada && atividade.observacoes && (
                        <div className="mt-2 p-2 bg-green-100/50 rounded text-xs text-green-800 flex items-start gap-1">
                            <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{atividade.observacoes}</span>
                        </div>
                    )}

                    {/* Badges BNCC */}
                    {atividade.campos_bncc && atividade.campos_bncc.length > 0 && !atividade.realizada && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {atividade.campos_bncc.slice(0, 3).map(codigo => (
                                <BnccBadge key={codigo} codigo={codigo} size="sm" />
                            ))}
                            {atividade.campos_bncc.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                    +{atividade.campos_bncc.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Indicador de cor */}
                <div
                    className={`w-1 h-12 rounded-full shrink-0 ${atividade.realizada ? 'bg-green-500' : ''}`}
                    style={!atividade.realizada ? { backgroundColor: atividade.cor } : {}}
                />
            </div>
        </div>
    );
}

// Card simplificado para lista de atividades (banco)
interface ActivityCardSimpleProps {
    titulo: string;
    tipo?: TipoAtividade;
    duracao?: number;
    camposBncc?: string[];
    cor?: string;
    onClick?: () => void;
    onAdd?: () => void;
}

export function ActivityCardSimple({
    titulo,
    tipo,
    duracao,
    camposBncc,
    cor = '#6366F1',
    onClick,
    onAdd
}: ActivityCardSimpleProps) {
    const tipoInfo = tipo ? TIPOS_ATIVIDADE[tipo] : null;

    return (
        <div
            className="bg-card border rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-all"
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${cor}20` }}
                >
                    {tipoInfo?.icon || '📋'}
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{titulo}</h4>

                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {tipoInfo && <span>{tipoInfo.label}</span>}
                        {duracao && duracao > 0 && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {duracao}min
                            </span>
                        )}
                    </div>

                    {camposBncc && camposBncc.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {camposBncc.slice(0, 2).map(codigo => (
                                <BnccBadge key={codigo} codigo={codigo} size="sm" />
                            ))}
                            {camposBncc.length > 2 && (
                                <span className="text-xs text-muted-foreground">+{camposBncc.length - 2}</span>
                            )}
                        </div>
                    )}
                </div>

                {onAdd && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd();
                        }}
                        className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:opacity-90 transition-opacity"
                    >
                        + Adicionar
                    </button>
                )}
            </div>
        </div>
    );
}
