'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAIProcessing, BNCC_LABELS, getBnccColor } from '@/hooks/use-ai-processing';

interface StudentInfo {
    id: string;
    nome: string;
}

interface PhotoCaptureProps {
    turmaId?: string;
    students?: StudentInfo[];
    onPhotoAnalyzed: (data: {
        imageFile: File;
        imageUrl: string;
        tags_bncc: string[];
        description: string;
    }) => void;
    onError?: (error: string) => void;
    className?: string;
}

type CaptureState = 'idle' | 'preview' | 'processing' | 'complete' | 'error';

const BNCC_TAG_COLORS: Record<string, string> = {
    "EI-EO": "bg-pink-100 text-pink-700",
    "EI-CG": "bg-blue-100 text-blue-700",
    "EI-TS": "bg-purple-100 text-purple-700",
    "EI-EF": "bg-green-100 text-green-700",
    "EI-ET": "bg-orange-100 text-orange-700"
};

export function PhotoCapture({
    turmaId,
    students = [],
    onPhotoAnalyzed,
    onError,
    className
}: PhotoCaptureProps) {
    const [state, setState] = useState<CaptureState>('idle');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [tagsBncc, setTagsBncc] = useState<string[]>([]);
    const [description, setDescription] = useState<string>('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [detectedActivities, setDetectedActivities] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const { processMedia } = useAIProcessing();

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            onError?.('Por favor, selecione uma imagem');
            return;
        }

        setImageFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
            setState('preview');
        };
        reader.readAsDataURL(file);
    }, [onError]);

    const processImageWithAI = async () => {
        if (!imageFile || !imagePreview) return;

        setState('processing');

        try {
            const result = await processMedia(imagePreview, 'image', {
                turmaId,
                students
            });

            const tags = result.tags_bncc || [];
            setTagsBncc(tags);
            setSelectedTags(tags);
            setDescription(result.description || '');
            setDetectedActivities(result.detected_activities || []);
            setState('complete');

        } catch (err: any) {
            console.error('Error processing image:', err);
            setState('error');
            onError?.(err.message || 'Erro ao processar a imagem');
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const confirmSelection = () => {
        if (!imageFile || !imagePreview) return;

        onPhotoAnalyzed({
            imageFile,
            imageUrl: imagePreview,
            tags_bncc: selectedTags,
            description
        });
    };

    const reset = () => {
        setState('idle');
        setImagePreview(null);
        setImageFile(null);
        setTagsBncc([]);
        setSelectedTags([]);
        setDescription('');
        setDetectedActivities([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Hidden file inputs */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Idle State - Upload Options */}
            {state === 'idle' && (
                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="h-24 flex-col gap-2"
                            onClick={() => cameraInputRef.current?.click()}
                        >
                            <Camera className="w-8 h-8" />
                            <span className="text-sm">Tirar Foto</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-24 flex-col gap-2"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-8 h-8" />
                            <span className="text-sm">Enviar Imagem</span>
                        </Button>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                        A IA irá analisar a foto e sugerir tags BNCC automaticamente
                    </p>
                </div>
            )}

            {/* Preview State - Show image before processing */}
            {state === 'preview' && imagePreview && (
                <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full max-h-64 object-cover"
                        />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={reset}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button className="flex-1" onClick={processImageWithAI}>
                            <Camera className="w-4 h-4 mr-2" />
                            Analisar com IA
                        </Button>
                        <Button variant="outline" onClick={reset}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            )}

            {/* Processing State */}
            {state === 'processing' && (
                <div className="flex flex-col items-center gap-4 py-8">
                    <div className="relative">
                        {imagePreview && (
                            <img
                                src={imagePreview}
                                alt="Processing"
                                className="w-24 h-24 rounded-xl object-cover opacity-50"
                            />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Analisando imagem com IA...</p>
                </div>
            )}

            {/* Complete State - Show results */}
            {state === 'complete' && imagePreview && (
                <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden">
                        <img
                            src={imagePreview}
                            alt="Analyzed"
                            className="w-full max-h-48 object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Analisado
                        </div>
                    </div>

                    {/* AI Description */}
                    {description && (
                        <div className="bg-muted/50 rounded-xl p-4">
                            <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                                <span className="text-lg">🤖</span>
                                Descrição da IA
                            </h4>
                            <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                    )}

                    {/* Detected Activities */}
                    {detectedActivities.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                                <span className="text-lg">🎯</span>
                                Atividades detectadas
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {detectedActivities.map((activity, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-muted rounded-full text-sm"
                                    >
                                        {activity}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* BNCC Tags Selection */}
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                            <span className="text-lg">🏷️</span>
                            Tags BNCC (clique para editar)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(BNCC_LABELS).map(tag => {
                                const isSelected = selectedTags.includes(tag);
                                const isSuggested = tagsBncc.includes(tag);

                                return (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                            isSelected
                                                ? BNCC_TAG_COLORS[tag] || getBnccColor(tag)
                                                : "bg-muted text-muted-foreground hover:bg-muted/80",
                                            isSuggested && !isSelected && "ring-2 ring-primary/30"
                                        )}
                                        title={BNCC_LABELS[tag]}
                                    >
                                        {tag}
                                        {isSuggested && !isSelected && " ✨"}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            ✨ = sugerido pela IA
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button className="flex-1" onClick={confirmSelection}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Confirmar
                        </Button>
                        <Button variant="outline" onClick={reset}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Refazer
                        </Button>
                    </div>
                </div>
            )}

            {/* Error State */}
            {state === 'error' && (
                <div className="flex flex-col items-center gap-4 py-8">
                    <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-sm text-red-600">Erro ao processar a imagem</p>
                    <Button variant="outline" onClick={reset}>
                        Tentar novamente
                    </Button>
                </div>
            )}
        </div>
    );
}
