'use client';

import {
    Camera,
    Video,
    Mic,
    FileText,
    Trash2,
    Share2,
    MoreVertical,
    Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RegistroComDetalhes, TipoRegistro } from '@/types/database';
import { formatarDataHora, TIPOS_REGISTRO } from '@/types/database';
import { ContextBadge } from '@/components/captura/context-tags';

interface TimelineItemProps {
    registro: RegistroComDetalhes;
    onDelete?: (id: string) => void;
    onToggleShare?: (id: string, share: boolean) => void;
    onView?: (id: string) => void;
}

const tipoIconMap: Record<TipoRegistro, typeof Camera> = {
    foto: Camera,
    video: Video,
    audio: Mic,
    texto: FileText,
};

const tipoColorMap: Record<TipoRegistro, string> = {
    foto: '#3B82F6',
    video: '#EF4444',
    audio: '#22C55E',
    texto: '#F59E0B',
};

export function TimelineItem({
    registro,
    onDelete,
    onToggleShare,
    onView
}: TimelineItemProps) {
    const Icon = tipoIconMap[registro.tipo];
    const color = tipoColorMap[registro.tipo];
    const alunos = registro.registros_alunos?.map(ra => ra.aluno).filter(Boolean) || [];

    return (
        <div className="relative flex gap-4 pb-6 group">
            {/* Linha vertical */}
            <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />

            {/* Ícone do tipo */}
            <div
                className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${color}20` }}
            >
                <Icon className="w-5 h-5" style={{ color }} />
            </div>

            {/* Card do registro */}
            <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-colors">
                {/* Preview de mídia */}
                {registro.tipo === 'foto' && registro.url_arquivo && (
                    <div
                        className="h-48 bg-muted cursor-pointer"
                        onClick={() => onView?.(registro.id)}
                    >
                        <img
                            src={registro.url_arquivo}
                            alt="Registro"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {registro.tipo === 'video' && registro.url_arquivo && (
                    <div className="h-48 bg-black">
                        <video
                            src={registro.url_arquivo}
                            controls
                            className="w-full h-full object-contain"
                        />
                    </div>
                )}

                {registro.tipo === 'audio' && registro.url_arquivo && (
                    <div className="p-4 bg-muted/30">
                        <audio
                            src={registro.url_arquivo}
                            controls
                            className="w-full"
                        />
                    </div>
                )}

                {/* Conteúdo de texto */}
                {registro.tipo === 'texto' && registro.descricao && (
                    <div className="p-4 bg-muted/30">
                        <p className="text-foreground whitespace-pre-wrap">{registro.descricao}</p>
                    </div>
                )}

                {/* Informações */}
                <div className="p-4">
                    {/* Descrição (para mídias) */}
                    {registro.tipo !== 'texto' && registro.descricao && (
                        <p className="text-foreground mb-3">{registro.descricao}</p>
                    )}

                    {/* Transcrição de voz */}
                    {registro.transcricao_voz && (
                        <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Transcrição:</p>
                            <p className="text-sm text-foreground">{registro.transcricao_voz}</p>
                        </div>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        {/* Data/hora */}
                        <span className="text-muted-foreground">
                            {formatarDataHora(registro.data_registro)}
                        </span>

                        <span className="text-muted-foreground">•</span>

                        {/* Contexto */}
                        <ContextBadge contexto={registro.contexto || null} size="sm" />

                        {/* Compartilhamento */}
                        {registro.compartilhar_familia && (
                            <>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-xs text-green-500 flex items-center gap-1">
                                    <Share2 className="w-3 h-3" />
                                    Família
                                </span>
                            </>
                        )}
                    </div>

                    {/* Alunos */}
                    {alunos.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {alunos.map(aluno => (
                                <span
                                    key={aluno.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
                                >
                                    {aluno.foto_url ? (
                                        <img
                                            src={aluno.foto_url}
                                            alt={aluno.nome}
                                            className="w-4 h-4 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">
                                            {aluno.nome.charAt(0)}
                                        </span>
                                    )}
                                    {aluno.nome.split(' ')[0]}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Ações */}
                <div className="px-4 py-3 bg-muted/30 border-t border-border flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Ver */}
                    <button
                        onClick={() => onView?.(registro.id)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Ver detalhes"
                    >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {/* Compartilhar */}
                    <button
                        onClick={() => onToggleShare?.(registro.id, !registro.compartilhar_familia)}
                        className={cn(
                            'p-2 hover:bg-muted rounded-lg transition-colors',
                            registro.compartilhar_familia && 'text-green-500'
                        )}
                        title={registro.compartilhar_familia ? 'Remover compartilhamento' : 'Compartilhar com família'}
                    >
                        <Share2 className="w-4 h-4" />
                    </button>

                    {/* Excluir */}
                    <button
                        onClick={() => onDelete?.(registro.id)}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                        title="Excluir registro"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
