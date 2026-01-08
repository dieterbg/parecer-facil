'use client';

import { useState, useCallback } from 'react';

interface StudentInfo {
    id: string;
    nome: string;
}

interface AIProcessingResult {
    transcription?: string;
    tags_bncc: string[];
    suggested_students: string[];
    description?: string;
    confidence?: number;
    detected_activities?: string[];
    detected_student_names?: string[];
}

interface UseAIProcessingOptions {
    onSuccess?: (result: AIProcessingResult) => void;
    onError?: (error: string) => void;
}

export function useAIProcessing(options: UseAIProcessingOptions = {}) {
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<AIProcessingResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const processMedia = useCallback(async (
        mediaUrl: string,
        mediaType: 'audio' | 'image' | 'video',
        opts?: {
            registroId?: string;
            turmaId?: string;
            students?: StudentInfo[];
        }
    ) => {
        setProcessing(true);
        setError(null);

        try {
            const response = await fetch('/api/process-media', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    registro_id: opts?.registroId,
                    media_url: mediaUrl,
                    media_type: mediaType,
                    turma_id: opts?.turmaId,
                    students: opts?.students,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to process media');
            }

            const data = await response.json();
            const analysisResult: AIProcessingResult = {
                transcription: data.analysis.transcription,
                tags_bncc: data.analysis.tags_bncc,
                suggested_students: data.analysis.suggested_students || [],
                description: data.analysis.ai_metadata?.description,
                confidence: data.analysis.ai_metadata?.confidence,
                detected_activities: data.analysis.ai_metadata?.detected_activities,
                detected_student_names: data.analysis.ai_metadata?.detected_student_names,
            };

            setResult(analysisResult);
            options.onSuccess?.(analysisResult);
            return analysisResult;

        } catch (err: any) {
            const errorMessage = err.message || 'Error processing media';
            setError(errorMessage);
            options.onError?.(errorMessage);
            throw err;
        } finally {
            setProcessing(false);
        }
    }, [options]);

    const reset = useCallback(() => {
        setResult(null);
        setError(null);
        setProcessing(false);
    }, []);

    return {
        processing,
        result,
        error,
        processMedia,
        reset,
    };
}

// BNCC Field labels for display
export const BNCC_LABELS: Record<string, string> = {
    "EI-EO": "Eu, o outro e o nós",
    "EI-CG": "Corpo, gestos e movimentos",
    "EI-TS": "Traços, sons, cores e formas",
    "EI-EF": "Escuta, fala, pensamento e imaginação",
    "EI-ET": "Espaços, tempos, quantidades, relações"
};

// BNCC Field colors for UI
export const BNCC_COLORS: Record<string, string> = {
    "EI-EO": "bg-pink-100 text-pink-700 border-pink-200",
    "EI-CG": "bg-blue-100 text-blue-700 border-blue-200",
    "EI-TS": "bg-purple-100 text-purple-700 border-purple-200",
    "EI-EF": "bg-green-100 text-green-700 border-green-200",
    "EI-ET": "bg-orange-100 text-orange-700 border-orange-200"
};

// Get BNCC color class
export function getBnccColor(tag: string): string {
    return BNCC_COLORS[tag] || 'bg-gray-100 text-gray-700 border-gray-200';
}

// Get BNCC label
export function getBnccLabel(tag: string): string {
    return BNCC_LABELS[tag] || tag;
}
