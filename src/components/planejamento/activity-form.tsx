'use client';

import { useState } from 'react';
import { X, Clock, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAtividades } from '@/hooks/use-atividades';
import { BnccSelector } from './bncc-selector';
import {
    TIPOS_ATIVIDADE,
    FAIXAS_ETARIAS,
    type TipoAtividade,
    type FaixaEtariaBncc,
    type AtividadeInsert,
    type Atividade
} from '@/types/database';

interface ActivityFormProps {
    atividade?: Atividade; // Para edição
    onSave?: (atividade: Atividade) => void;
    onClose: () => void;
}

export function ActivityForm({ atividade, onSave, onClose }: ActivityFormProps) {
    const { createAtividade, updateAtividade } = useAtividades();

    const [titulo, setTitulo] = useState(atividade?.titulo || '');
    const [descricao, setDescricao] = useState(atividade?.descricao || '');
    const [duracao, setDuracao] = useState(atividade?.duracao_minutos || 30);
    const [tipo, setTipo] = useState<TipoAtividade>(atividade?.tipo || 'livre');
    const [faixaEtaria, setFaixaEtaria] = useState<FaixaEtariaBncc | undefined>(atividade?.faixa_etaria || undefined);
    const [camposBncc, setCamposBncc] = useState<string[]>(atividade?.campos_bncc || []);
    const [materiais, setMateriais] = useState(atividade?.materiais?.join(', ') || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!titulo.trim()) return;

        setSaving(true);
        try {
            const dados: AtividadeInsert = {
                titulo: titulo.trim(),
                descricao: descricao.trim() || undefined,
                duracao_minutos: duracao,
                tipo,
                faixa_etaria: faixaEtaria,
                campos_bncc: camposBncc.length > 0 ? camposBncc : undefined,
                materiais: materiais ? materiais.split(',').map(m => m.trim()).filter(Boolean) : undefined,
                cor: TIPOS_ATIVIDADE[tipo].cor,
            };

            let result: Atividade | null;

            if (atividade?.id) {
                result = await updateAtividade(atividade.id, dados);
            } else {
                result = await createAtividade(dados);
            }

            if (result && onSave) {
                onSave(result);
            }
            onClose();
        } catch (err) {
            console.error('Erro ao salvar:', err);
            alert('Erro ao salvar atividade');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-2xl my-8">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{atividade ? 'Editar Atividade' : 'Nova Atividade'}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Título */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Título *</label>
                        <input
                            type="text"
                            placeholder="Nome da atividade"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            className="w-full px-4 py-2 bg-muted rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    {/* Tipo de atividade */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Tipo de Atividade</label>
                        <div className="grid grid-cols-5 gap-2">
                            {(Object.entries(TIPOS_ATIVIDADE) as [TipoAtividade, { label: string; icon: string; cor: string }][]).map(([t, info]) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTipo(t)}
                                    className={`p-2 rounded-lg text-center transition-all ${tipo === t
                                            ? 'ring-2 ring-primary'
                                            : 'bg-muted hover:bg-muted/80'
                                        }`}
                                    style={tipo === t ? { backgroundColor: `${info.cor}20` } : {}}
                                >
                                    <span className="text-xl block mb-1">{info.icon}</span>
                                    <span className="text-[10px] leading-tight block">{info.label.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duração e Faixa Etária */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Duração (minutos)
                            </label>
                            <input
                                type="number"
                                min="5"
                                max="180"
                                step="5"
                                value={duracao}
                                onChange={(e) => setDuracao(parseInt(e.target.value) || 30)}
                                className="w-full px-4 py-2 bg-muted rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Faixa Etária</label>
                            <select
                                value={faixaEtaria || ''}
                                onChange={(e) => setFaixaEtaria(e.target.value as FaixaEtariaBncc || undefined)}
                                className="w-full px-4 py-2 bg-muted rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                <option value="">Todas</option>
                                {(Object.entries(FAIXAS_ETARIAS) as [FaixaEtariaBncc, { label: string }][]).map(([f, { label }]) => (
                                    <option key={f} value={f}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Descrição</label>
                        <textarea
                            placeholder="Descreva a atividade..."
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 bg-muted rounded-lg border resize-none focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    {/* Materiais */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Materiais (separados por vírgula)</label>
                        <input
                            type="text"
                            placeholder="Tinta, papel, pincel..."
                            value={materiais}
                            onChange={(e) => setMateriais(e.target.value)}
                            className="w-full px-4 py-2 bg-muted rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    {/* Campos BNCC */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Campos de Experiência (BNCC)</label>
                        <BnccSelector
                            selectedCodigos={camposBncc}
                            onChange={setCamposBncc}
                            faixaEtaria={faixaEtaria}
                            maxSelections={5}
                        />
                    </div>

                    {/* Botões */}
                    <div className="flex gap-2 pt-4">
                        <Button variant="outline" className="flex-1" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleSave}
                            disabled={!titulo.trim() || saving}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
