'use client';

import { useState, useEffect, useMemo } from 'react';
import { Camera, FileText, X, Loader2, Check, Link2, Video, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRegistros } from '@/hooks/use-registros';
import { supabase } from '@/components/auth-provider';
import type { AtividadePlanejada, RegistroComDetalhes } from '@/types/database';

interface MarkRealizadaModalProps {
    atividade: AtividadePlanejada;
    currentWeek?: Date; // Para filtrar registros da semana
    onClose: () => void;
    onSuccess: () => void;
}

export function MarkRealizadaModal({
    atividade,
    currentWeek,
    onClose,
    onSuccess
}: MarkRealizadaModalProps) {
    const [mode, setMode] = useState<'choice' | 'text' | 'photo' | 'link'>('choice');
    const [observacao, setObservacao] = useState('');
    const [saving, setSaving] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [selectedRegistroIds, setSelectedRegistroIds] = useState<string[]>([]);

    const { registros, createRegistro } = useRegistros({});

    // Filtrar registros do dia da atividade
    const registrosDoDia = useMemo(() => {
        if (!currentWeek || !registros) return [];

        const dataDia = new Date(currentWeek);
        dataDia.setDate(dataDia.getDate() + (atividade.dia_semana - 1)); // 1=seg
        const dataStr = dataDia.toISOString().split('T')[0];

        return registros.filter(r => {
            const regDate = new Date(r.data_registro || r.created_at).toISOString().split('T')[0];
            return regDate === dataStr;
        });
    }, [registros, currentWeek, atividade.dia_semana]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleMarkRealizada = async (withRegistro: boolean) => {
        setSaving(true);
        try {
            // 1. Marcar como realizada
            await supabase
                .from('atividades_planejadas')
                .update({
                    realizada: true,
                    observacoes: observacao || null
                })
                .eq('id', atividade.id);

            // 2. Se tiver registro de texto, criar
            if (withRegistro && mode === 'text' && observacao) {
                const registro = await createRegistro({
                    tipo: 'texto',
                    descricao: `📋 ${atividade.titulo}\n\n${observacao}`,
                }, []);

                if (registro) {
                    // Vincular registro à atividade
                    const currentIds = atividade.registros_ids || [];
                    await supabase
                        .from('atividades_planejadas')
                        .update({
                            registros_ids: [...currentIds, registro.id]
                        })
                        .eq('id', atividade.id);
                }
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Erro ao marcar realizada:', err);
            alert('Erro ao salvar. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg">✅ Marcar Realizada</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Info da atividade */}
                    <div
                        className="p-3 rounded-lg border-l-4"
                        style={{ borderColor: atividade.cor, backgroundColor: `${atividade.cor}10` }}
                    >
                        <h3 className="font-medium">{atividade.titulo}</h3>
                        {atividade.descricao && (
                            <p className="text-sm text-muted-foreground mt-1">{atividade.descricao}</p>
                        )}
                    </div>

                    {mode === 'choice' && (
                        <>
                            <p className="text-sm text-muted-foreground text-center">
                                Deseja adicionar um registro como evidência?
                            </p>

                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setMode('photo')}
                                    className="p-4 rounded-xl border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all text-center"
                                >
                                    <Camera className="w-6 h-6 mx-auto mb-2 text-primary" />
                                    <span className="text-xs font-medium">Foto</span>
                                </button>

                                <button
                                    onClick={() => setMode('text')}
                                    className="p-4 rounded-xl border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all text-center"
                                >
                                    <FileText className="w-6 h-6 mx-auto mb-2 text-primary" />
                                    <span className="text-xs font-medium">Observação</span>
                                </button>

                                <button
                                    onClick={() => setMode('link')}
                                    disabled={registrosDoDia.length === 0}
                                    className={`p-4 rounded-xl border-2 border-dashed transition-all text-center ${registrosDoDia.length > 0
                                        ? 'hover:border-primary hover:bg-primary/5'
                                        : 'opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    <Link2 className="w-6 h-6 mx-auto mb-2 text-primary" />
                                    <span className="text-xs font-medium">
                                        Vincular ({registrosDoDia.length})
                                    </span>
                                </button>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleMarkRealizada(false)}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Apenas marcar realizada
                            </Button>
                        </>
                    )}

                    {mode === 'photo' && (
                        <>
                            {photoPreview ? (
                                <div className="relative">
                                    <img
                                        src={photoPreview}
                                        alt="Preview"
                                        className="w-full rounded-lg"
                                    />
                                    <button
                                        onClick={() => setPhotoPreview(null)}
                                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="block p-8 border-2 border-dashed rounded-xl text-center cursor-pointer hover:border-primary transition-colors">
                                    <Camera className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Clique para tirar foto ou selecionar</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                </label>
                            )}

                            <textarea
                                placeholder="Adicionar observação (opcional)..."
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 bg-muted rounded-lg border-0 resize-none focus:ring-2 focus:ring-primary"
                            />

                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setMode('choice')}>
                                    Voltar
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => handleMarkRealizada(true)}
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                    Salvar
                                </Button>
                            </div>
                        </>
                    )}

                    {mode === 'text' && (
                        <>
                            <textarea
                                placeholder="Como foi a atividade? O que as crianças fizeram? Observações importantes..."
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 bg-muted rounded-lg border-0 resize-none focus:ring-2 focus:ring-primary"
                                autoFocus
                            />

                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setMode('choice')}>
                                    Voltar
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => handleMarkRealizada(true)}
                                    disabled={!observacao.trim() || saving}
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                    Salvar
                                </Button>
                            </div>
                        </>
                    )}

                    {mode === 'link' && (
                        <>
                            <p className="text-sm text-muted-foreground text-center mb-2">
                                Selecione os registros para vincular:
                            </p>

                            <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
                                {registrosDoDia.map(reg => (
                                    <label
                                        key={reg.id}
                                        className="flex items-center gap-3 p-2 rounded hover:bg-accent/50 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedRegistroIds.includes(reg.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedRegistroIds([...selectedRegistroIds, reg.id]);
                                                } else {
                                                    setSelectedRegistroIds(selectedRegistroIds.filter(id => id !== reg.id));
                                                }
                                            }}
                                            className="w-4 h-4"
                                        />
                                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                            {reg.tipo === 'foto' && <Camera className="w-4 h-4 text-primary" />}
                                            {reg.tipo === 'video' && <Video className="w-4 h-4 text-primary" />}
                                            {reg.tipo === 'audio' && <Mic className="w-4 h-4 text-primary" />}
                                            {reg.tipo === 'texto' && <FileText className="w-4 h-4 text-primary" />}
                                        </div>
                                        <span className="text-sm line-clamp-1">
                                            {reg.descricao || `Registro de ${reg.tipo}`}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setMode('choice')}>
                                    Voltar
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={async () => {
                                        setSaving(true);
                                        try {
                                            // Marcar como realizada e vincular registros
                                            const currentIds = atividade.registros_ids || [];
                                            const newIds = [...new Set([...currentIds, ...selectedRegistroIds])];

                                            await supabase
                                                .from('atividades_planejadas')
                                                .update({
                                                    realizada: true,
                                                    registros_ids: newIds
                                                })
                                                .eq('id', atividade.id);

                                            onSuccess();
                                            onClose();
                                        } catch (err) {
                                            console.error('Erro:', err);
                                        } finally {
                                            setSaving(false);
                                        }
                                    }}
                                    disabled={selectedRegistroIds.length === 0 || saving}
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                    Vincular ({selectedRegistroIds.length})
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
