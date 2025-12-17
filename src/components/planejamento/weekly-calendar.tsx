'use client';

import { useMemo } from 'react';
import { Camera, Video, Mic, FileText } from 'lucide-react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ActivityCard } from './activity-card';
import {
    DIAS_SEMANA,
    type AtividadePlanejada,
    type PlanejamentoComAtividades,
} from '@/types/database';

interface WeeklyCalendarProps {
    planejamento: PlanejamentoComAtividades;
    currentWeek?: Date;
    registros?: { id: string; tipo: string; descricao: string | null; data_registro: string; created_at: string }[];
    onMoveActivity: (atividadeId: string, novoDia: number, novaOrdem: number) => void;
    onToggleRealizada: (atividadeId: string, realizada: boolean) => void;
    onRemoveActivity: (atividadeId: string) => void;
    onAddActivity: (dia: number) => void;
    onActivityClick?: (atividade: AtividadePlanejada) => void;
    onDayClick?: (dia: number) => void;
    onRegistroClick?: (registro: { id: string; tipo: string; descricao: string | null }) => void;
    onAddRegistro?: (atividade: AtividadePlanejada) => void;
}

// Componente de coluna dropável para um dia
function DayColumn({
    dia,
    dataDia,
    atividades,
    registrosDoDia,
    onAddActivity,
    onToggleRealizada,
    onRemoveActivity,
    onActivityClick,
    onDayClick,
    onRegistroClick,
    onAddRegistro,
}: {
    dia: number;
    dataDia?: Date;
    atividades: AtividadePlanejada[];
    registrosDoDia?: { id: string; tipo: string; descricao: string | null }[];
    onAddActivity: () => void;
    onToggleRealizada: (id: string, realizada: boolean) => void;
    onRemoveActivity: (id: string) => void;
    onActivityClick?: (atividade: AtividadePlanejada) => void;
    onDayClick?: () => void;
    onRegistroClick?: (registro: { id: string; tipo: string; descricao: string | null }) => void;
    onAddRegistro?: (atividade: AtividadePlanejada) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: `day-${dia}`,
        data: { type: 'day', dia },
    });

    // Só mostrar dias úteis (seg-sex = 1-5)
    if (dia < 1 || dia > 5) return null;

    return (
        <div className="flex-1 min-w-[300px]">
            {/* Cabeçalho do dia - clicável */}
            <button
                onClick={onDayClick}
                className="w-full text-center py-2 border-b mb-2 hover:bg-primary/5 transition-colors cursor-pointer"
            >
                <span className="font-medium text-sm">{DIAS_SEMANA[dia]}</span>
                {dataDia && (
                    <span className="text-xs text-muted-foreground ml-1">
                        {dataDia.getDate().toString().padStart(2, '0')}
                    </span>
                )}
                <span className="text-xs text-muted-foreground ml-1">▼</span>
            </button>

            {/* Área droppable */}
            <div
                ref={setNodeRef}
                className={`
          min-h-[200px] p-3 rounded-xl transition-colors space-y-3
          ${isOver ? 'bg-primary/10 ring-2 ring-primary/30' : 'bg-muted/30'}
        `}
            >
                <SortableContext
                    items={atividades.map(a => a.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {atividades.map(atividade => (
                        <ActivityCard
                            key={atividade.id}
                            atividade={atividade}
                            onToggleRealizada={() => onToggleRealizada(atividade.id, !atividade.realizada)}
                            onRemove={() => onRemoveActivity(atividade.id)}
                            onClick={() => onActivityClick?.(atividade)}
                            onAddRegistro={() => onAddRegistro?.(atividade)}
                        />
                    ))}
                </SortableContext>

                {/* Registros do dia - cards compactos */}
                {registrosDoDia && registrosDoDia.length > 0 && (
                    <div className="space-y-2 mb-3">
                        {registrosDoDia.map(reg => (
                            <div
                                key={reg.id}
                                onClick={() => onRegistroClick?.(reg)}
                                className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 cursor-pointer transition-colors border border-transparent hover:border-primary/20"
                            >
                                <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center shrink-0">
                                    {reg.tipo === 'foto' && <Camera className="w-4 h-4 text-primary" />}
                                    {reg.tipo === 'video' && <Video className="w-4 h-4 text-primary" />}
                                    {reg.tipo === 'audio' && <Mic className="w-4 h-4 text-primary" />}
                                    {reg.tipo === 'texto' && <FileText className="w-4 h-4 text-primary" />}
                                </div>
                                <span className="text-sm line-clamp-1 flex-1 font-medium text-foreground/80">
                                    {reg.descricao || `${reg.tipo === 'foto' ? 'Foto' : reg.tipo === 'video' ? 'Vídeo' : 'Nota'}`}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Botão adicionar */}
                <button
                    onClick={onAddActivity}
                    className="w-full py-3 px-4 mt-2 border-2 border-dashed border-muted-foreground/20 rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all group"
                >
                    <div className="w-6 h-6 rounded-full bg-muted group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Adicionar</span>
                </button>
            </div>
        </div>
    );
}

export function WeeklyCalendar({
    planejamento,
    currentWeek,
    registros,
    onMoveActivity,
    onToggleRealizada,
    onRemoveActivity,
    onAddActivity,
    onActivityClick,
    onDayClick,
    onRegistroClick,
    onAddRegistro,
}: WeeklyCalendarProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Agrupar atividades por dia
    const atividadesPorDia = useMemo(() => {
        const result: Record<number, AtividadePlanejada[]> = {
            1: [], 2: [], 3: [], 4: [], 5: [],
        };

        planejamento.atividades_planejadas?.forEach(atividade => {
            if (atividade.dia_semana >= 1 && atividade.dia_semana <= 5) {
                result[atividade.dia_semana].push(atividade);
            }
        });

        // Ordenar por ordem dentro de cada dia
        Object.keys(result).forEach(dia => {
            result[Number(dia)].sort((a, b) => a.ordem - b.ordem);
        });

        return result;
    }, [planejamento.atividades_planejadas]);

    // Encontrar atividade ativa para drag overlay
    const activeActivity = useMemo(() => {
        if (!activeId) return null;
        return planejamento.atividades_planejadas?.find(a => a.id === activeId);
    }, [activeId, planejamento.atividades_planejadas]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeAtividade = planejamento.atividades_planejadas?.find(
            a => a.id === active.id
        );

        if (!activeAtividade) return;

        // Verificar se foi dropado em um dia
        const overId = over.id as string;
        let novoDia = activeAtividade.dia_semana;
        let novaOrdem = activeAtividade.ordem;

        if (overId.startsWith('day-')) {
            // Dropado em um dia
            novoDia = parseInt(overId.replace('day-', ''));
            novaOrdem = atividadesPorDia[novoDia]?.length || 0;
        } else {
            // Dropado sobre outra atividade
            const overAtividade = planejamento.atividades_planejadas?.find(
                a => a.id === overId
            );
            if (overAtividade) {
                novoDia = overAtividade.dia_semana;
                novaOrdem = overAtividade.ordem;
            }
        }

        // Só atualizar se mudou
        if (novoDia !== activeAtividade.dia_semana || novaOrdem !== activeAtividade.ordem) {
            onMoveActivity(activeAtividade.id, novoDia, novaOrdem);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-10 overflow-x-auto pb-4 px-2">
                {[1, 2, 3, 4, 5].map(dia => {
                    // Calcular a data deste dia na semana atual
                    // currentWeek já é segunda-feira, então basta adicionar (dia - 1) dias
                    const dataDia = currentWeek ? (() => {
                        const d = new Date(currentWeek);
                        d.setDate(d.getDate() + (dia - 1));
                        return d;
                    })() : undefined;

                    // Filtrar registros para este dia usando formato local (evita problemas de fuso)
                    const registrosDoDia = dataDia && registros ? registros.filter(r => {
                        const regDate = new Date(r.data_registro || r.created_at);
                        // Comparar ano, mês e dia locais
                        return regDate.getFullYear() === dataDia.getFullYear() &&
                            regDate.getMonth() === dataDia.getMonth() &&
                            regDate.getDate() === dataDia.getDate();
                    }) : [];

                    return (
                        <DayColumn
                            key={dia}
                            dia={dia}
                            dataDia={dataDia}
                            atividades={atividadesPorDia[dia] || []}
                            registrosDoDia={registrosDoDia}
                            onAddActivity={() => onAddActivity(dia)}
                            onToggleRealizada={onToggleRealizada}
                            onRemoveActivity={onRemoveActivity}
                            onActivityClick={onActivityClick}
                            onRegistroClick={onRegistroClick}
                            onAddRegistro={onAddRegistro}
                            onDayClick={() => onDayClick?.(dia)}
                        />
                    );
                })}
            </div>

            {/* Drag overlay */}
            <DragOverlay>
                {activeActivity && (
                    <div className="w-[180px]">
                        <ActivityCard atividade={activeActivity} isDragging />
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
