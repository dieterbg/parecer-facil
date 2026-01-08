'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    Camera,
    Mic,
    Type,
    Video,
    X,
    Loader2,
    Check,
    Upload,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StudentSelector } from './student-selector';
import { ContextTags } from './context-tags';
import { CameraCapture } from './camera-capture';
import { VoiceCapture } from './voice-capture';
import { PhotoCapture } from './photo-capture';
import { useAlunos, useRegistros } from '@/hooks';
import { getBnccColor, BNCC_LABELS } from '@/hooks/use-ai-processing';
import type { TipoRegistro } from '@/types/database';

interface QuickCaptureProps {
    turmaId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

type CaptureMode = TipoRegistro | 'foto-ai' | 'audio-ai' | null;

export function QuickCapture({ turmaId, onSuccess, onCancel }: QuickCaptureProps) {
    const [mode, setMode] = useState<CaptureMode>(null);
    const [selectedAlunos, setSelectedAlunos] = useState<string[]>([]);
    const [selectedContexto, setSelectedContexto] = useState<string | null>(null);
    const [descricao, setDescricao] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tagsBncc, setTagsBncc] = useState<string[]>([]);
    const [transcription, setTranscription] = useState('');

    const { alunos, loading: loadingAlunos } = useAlunos({ turmaId });
    const { contextos, createRegistro, uploadArquivo } = useRegistros({ turmaId });

    // Opções de captura com IA
    const captureOptions = [
        { type: 'foto-ai' as CaptureMode, icon: Camera, label: 'Foto', color: '#3B82F6', ai: true },
        { type: 'audio-ai' as CaptureMode, icon: Mic, label: 'Áudio', color: '#22C55E', ai: true },
        { type: 'video' as TipoRegistro, icon: Video, label: 'Vídeo', color: '#EF4444', ai: false },
        { type: 'texto' as TipoRegistro, icon: Type, label: 'Texto', color: '#F59E0B', ai: false },
    ];

    // Voltar para seleção de modo
    const handleBack = () => {
        setMode(null);
        setFile(null);
        setError(null);
        setTagsBncc([]);
        setTranscription('');
    };

    // Callback quando foto é capturada pelo componente de IA
    const handleAIPhotoComplete = (data: {
        imageFile: File;
        imageUrl: string;
        tags_bncc: string[];
        description: string;
    }) => {
        setFile(data.imageFile);
        setTagsBncc(data.tags_bncc);
        setDescricao(data.description);
        setMode('foto'); // Switch to normal mode for saving
    };

    // Callback quando áudio é transcrito pelo componente de IA
    const handleAIAudioComplete = (data: {
        audioBlob: Blob;
        transcription: string;
        tags_bncc: string[];
        suggested_students: string[];
    }) => {
        // Convert blob to file
        const audioFile = new File([data.audioBlob], 'recording.webm', { type: 'audio/webm' });
        setFile(audioFile);
        setTagsBncc(data.tags_bncc);
        setTranscription(data.transcription);
        setDescricao(data.transcription); // Use transcription as description

        // Auto-select suggested students
        if (data.suggested_students.length > 0) {
            setSelectedAlunos(prev => {
                const newSelection = [...new Set([...prev, ...data.suggested_students])];
                return newSelection;
            });
        }

        setMode('audio'); // Switch to normal mode for saving
    };

    // Callback para upload de arquivo
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    // Salvar registro
    const handleSave = async () => {
        if (selectedAlunos.length === 0) {
            setError('Selecione pelo menos um aluno');
            return;
        }

        if ((mode === 'foto' || mode === 'video' || mode === 'audio') && !file) {
            setError('Nenhum arquivo selecionado');
            return;
        }

        if (mode === 'texto' && !descricao.trim()) {
            setError('Digite uma observação');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            let url_arquivo: string | undefined;

            // Upload do arquivo se houver
            if (file && mode && mode !== 'foto-ai' && mode !== 'audio-ai') {
                url_arquivo = await uploadArquivo(file, mode as TipoRegistro);
            }

            // Criar registro com tags BNCC
            await createRegistro(
                {
                    tipo: (mode === 'foto-ai' ? 'foto' : mode === 'audio-ai' ? 'audio' : mode) as TipoRegistro,
                    url_arquivo,
                    descricao: descricao.trim() || undefined,
                    transcricao_voz: transcription || undefined,
                    contexto_id: selectedContexto || undefined,
                    tags_bncc: tagsBncc.length > 0 ? tagsBncc : undefined,
                },
                selectedAlunos
            );

            // Sucesso!
            if (onSuccess) {
                onSuccess();
            }

            // Limpar estado
            setMode(null);
            setSelectedAlunos([]);
            setSelectedContexto(null);
            setDescricao('');
            setFile(null);
            setTagsBncc([]);
            setTranscription('');
        } catch (err) {
            console.error('Erro ao salvar registro:', err);
            setError('Erro ao salvar registro. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    // Tela de seleção de modo
    if (!mode) {
        return (
            <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-xl font-bold">Novo Registro</h2>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Opções de captura */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="grid grid-cols-2 gap-4 max-w-sm w-full">
                        {captureOptions.map(option => (
                            <button
                                key={option.type}
                                onClick={() => setMode(option.type)}
                                className="relative flex flex-col items-center gap-3 p-6 bg-card rounded-2xl border border-border hover:border-primary/50 hover:shadow-lg transition-all"
                            >
                                {option.ai && (
                                    <span className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                        <Sparkles className="w-3 h-3" />
                                        IA
                                    </span>
                                )}
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                    style={{ backgroundColor: `${option.color}20` }}
                                >
                                    <option.icon
                                        className="w-8 h-8"
                                        style={{ color: option.color }}
                                    />
                                </div>
                                <span className="font-medium">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Tela de captura de foto com IA
    if (mode === 'foto-ai') {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col">
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={handleBack}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Foto com IA
                    </h2>
                    <div className="w-9" />
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <PhotoCapture
                        turmaId={turmaId}
                        students={alunos.map(a => ({ id: a.id, nome: a.nome }))}
                        onPhotoAnalyzed={handleAIPhotoComplete}
                        onError={setError}
                    />
                </div>
            </div>
        );
    }

    // Tela de captura de áudio com IA
    if (mode === 'audio-ai') {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col">
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={handleBack}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Áudio com IA
                    </h2>
                    <div className="w-9" />
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <VoiceCapture
                        turmaId={turmaId}
                        students={alunos.map(a => ({ id: a.id, nome: a.nome }))}
                        onTranscriptionComplete={handleAIAudioComplete}
                        onError={setError}
                    />
                </div>
            </div>
        );
    }

    // Tela de captura de foto tradicional
    if (mode === 'foto' && !file) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col">
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={handleBack}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-medium">Tirar Foto</h2>
                    <div className="w-9" />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <CameraCapture
                        onCapture={(capturedFile) => setFile(capturedFile)}
                        onCancel={handleBack}
                    />

                    <div className="mt-4">
                        <label className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                            <Upload className="w-5 h-5" />
                            <span className="text-sm">Escolher da galeria</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>
            </div>
        );
    }

    // Formulário de detalhes (após captura ou para texto)
    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background border-b border-border">
                <button
                    onClick={handleBack}
                    disabled={saving}
                    className="p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-50"
                >
                    <X className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-medium">
                    {mode === 'texto' ? 'Nova Observação' : 'Detalhes do Registro'}
                </h2>
                <button
                    onClick={handleSave}
                    disabled={saving || selectedAlunos.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Check className="w-4 h-4" />
                    )}
                    Salvar
                </button>
            </div>

            <div className="flex-1 p-4 space-y-6">
                {/* Preview do arquivo */}
                {file && mode === 'foto' && (
                    <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden">
                        <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={() => setFile(null)}
                            className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                )}

                {/* Upload para vídeo/áudio */}
                {(mode === 'video' || mode === 'audio') && !file && (
                    <div className="aspect-video bg-card rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center">
                        <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                            {mode === 'video' ? 'Selecione um vídeo' : 'Selecione um áudio'}
                        </p>
                        <label className="px-6 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors">
                            Escolher arquivo
                            <input
                                type="file"
                                accept={mode === 'video' ? 'video/*' : 'audio/*'}
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                )}

                {/* Preview do arquivo de vídeo/áudio */}
                {file && (mode === 'video' || mode === 'audio') && (
                    <div className="relative bg-card rounded-2xl overflow-hidden p-4">
                        <div className="flex items-center gap-3">
                            {mode === 'video' ? (
                                <Video className="w-10 h-10 text-red-500" />
                            ) : (
                                <Mic className="w-10 h-10 text-green-500" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{file.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            <button
                                onClick={() => setFile(null)}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* BNCC Tags (se processado por IA) */}
                {tagsBncc.length > 0 && (
                    <div className="bg-primary/5 rounded-xl p-4 space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            Tags BNCC (IA)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {tagsBncc.map(tag => (
                                <span
                                    key={tag}
                                    className={cn("px-3 py-1 rounded-full text-sm font-medium", getBnccColor(tag))}
                                    title={BNCC_LABELS[tag]}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Seleção de alunos */}
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Quem está neste registro? *
                        {selectedAlunos.length > 0 && (
                            <span className="ml-2 text-primary">
                                ({selectedAlunos.length} selecionado{selectedAlunos.length > 1 ? 's' : ''})
                            </span>
                        )}
                    </label>
                    <StudentSelector
                        alunos={alunos}
                        selectedIds={selectedAlunos}
                        onSelectionChange={setSelectedAlunos}
                        loading={loadingAlunos}
                    />
                </div>

                {/* Tags de contexto */}
                <ContextTags
                    contextos={contextos}
                    selectedId={selectedContexto}
                    onSelect={setSelectedContexto}
                />

                {/* Descrição */}
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                        {mode === 'texto' ? 'Observação *' : 'Descrição (opcional)'}
                    </label>
                    <textarea
                        value={descricao}
                        onChange={e => setDescricao(e.target.value)}
                        placeholder={
                            mode === 'texto'
                                ? 'Escreva sua observação sobre o momento...'
                                : 'Adicione uma descrição para este registro...'
                        }
                        rows={mode === 'texto' ? 6 : 3}
                        className="w-full px-4 py-3 bg-card rounded-xl border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>

                {/* Erro */}
                {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
