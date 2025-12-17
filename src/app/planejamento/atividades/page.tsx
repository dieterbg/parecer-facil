'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Plus,
    Search,
    Filter,
    Loader2,
    BookOpen,
    Trash2,
    Copy,
    Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAtividades } from '@/hooks/use-atividades';
import { ActivityCardSimple, ActivityForm, BnccBadge } from '@/components/planejamento';
import {
    TIPOS_ATIVIDADE,
    FAIXAS_ETARIAS,
    type TipoAtividade,
    type FaixaEtariaBncc,
    type Atividade
} from '@/types/database';

export default function AtividadesPage() {
    const [showForm, setShowForm] = useState(false);
    const [editingAtividade, setEditingAtividade] = useState<Atividade | undefined>();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState<TipoAtividade | ''>('');
    const [filterFaixa, setFilterFaixa] = useState<FaixaEtariaBncc | ''>('');

    const { atividades, loading, deleteAtividade, duplicateAtividade } = useAtividades();

    // Filtrar atividades
    const atividadesFiltradas = useMemo(() => {
        return atividades.filter(a => {
            // Filtro de busca
            if (searchTerm && !a.titulo.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            // Filtro de tipo
            if (filterTipo && a.tipo !== filterTipo) {
                return false;
            }
            // Filtro de faixa etária
            if (filterFaixa && a.faixa_etaria !== filterFaixa) {
                return false;
            }
            return true;
        });
    }, [atividades, searchTerm, filterTipo, filterFaixa]);

    const handleEdit = (atividade: Atividade) => {
        setEditingAtividade(atividade);
        setShowForm(true);
    };

    const handleDelete = async (id: string, titulo: string) => {
        if (!confirm(`Excluir "${titulo}"?`)) return;
        try {
            await deleteAtividade(id);
        } catch (err) {
            console.error('Erro ao excluir:', err);
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            await duplicateAtividade(id);
        } catch (err) {
            console.error('Erro ao duplicar:', err);
        }
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingAtividade(undefined);
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/planejamento">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <BookOpen className="w-8 h-8 text-primary" />
                            Banco de Atividades
                        </h1>
                        <p className="text-muted-foreground">
                            Crie e gerencie suas atividades para usar no planejamento
                        </p>
                    </div>
                    <Button onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Atividade
                    </Button>
                </div>

                {/* Filtros */}
                <Card>
                    <CardContent className="py-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Busca */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar atividades..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {/* Filtro por tipo */}
                            <select
                                value={filterTipo}
                                onChange={(e) => setFilterTipo(e.target.value as TipoAtividade | '')}
                                className="px-4 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Todos os tipos</option>
                                {(Object.entries(TIPOS_ATIVIDADE) as [TipoAtividade, { label: string; icon: string }][]).map(([t, { label, icon }]) => (
                                    <option key={t} value={t}>{icon} {label}</option>
                                ))}
                            </select>

                            {/* Filtro por faixa etária */}
                            <select
                                value={filterFaixa}
                                onChange={(e) => setFilterFaixa(e.target.value as FaixaEtariaBncc | '')}
                                className="px-4 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Todas as idades</option>
                                {(Object.entries(FAIXAS_ETARIAS) as [FaixaEtariaBncc, { label: string }][]).map(([f, { label }]) => (
                                    <option key={f} value={f}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de atividades */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : atividadesFiltradas.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                                {atividades.length === 0 ? 'Nenhuma atividade ainda' : 'Nenhuma atividade encontrada'}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {atividades.length === 0
                                    ? 'Crie sua primeira atividade para usar no planejamento semanal'
                                    : 'Tente ajustar os filtros de busca'
                                }
                            </p>
                            {atividades.length === 0 && (
                                <Button onClick={() => setShowForm(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Criar Atividade
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {atividadesFiltradas.map(atividade => {
                            const tipoInfo = TIPOS_ATIVIDADE[atividade.tipo];

                            return (
                                <Card key={atividade.id} className="group hover:border-primary/50 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div
                                                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
                                                style={{ backgroundColor: `${atividade.cor}20` }}
                                            >
                                                {tipoInfo?.icon || '📋'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium truncate">{atividade.titulo}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {tipoInfo?.label} • {atividade.duracao_minutos}min
                                                </p>
                                            </div>
                                        </div>

                                        {atividade.descricao && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                {atividade.descricao}
                                            </p>
                                        )}

                                        {atividade.campos_bncc && atividade.campos_bncc.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-3">
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

                                        {/* Ações */}
                                        <div className="flex gap-2 pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleEdit(atividade)}
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                Editar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDuplicate(atividade.id)}
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(atividade.id, atividade.titulo)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Contador */}
                {!loading && atividades.length > 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                        {atividadesFiltradas.length} de {atividades.length} atividades
                    </p>
                )}
            </div>

            {/* Modal de formulário */}
            {showForm && (
                <ActivityForm
                    atividade={editingAtividade}
                    onClose={handleFormClose}
                />
            )}
        </div>
    );
}
