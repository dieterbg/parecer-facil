'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAIProcessing, BNCC_LABELS, getBnccColor } from '@/hooks/use-ai-processing';

interface StudentInfo {
    id: string;
    nome: string;
}

interface VoiceCaptureProps {
    turmaId?: string;
    students?: StudentInfo[];
    onTranscriptionComplete: (data: {
        audioBlob: Blob;
        audioUrl?: string;
        transcription: string;
        tags_bncc: string[];
        suggested_students: string[];
    }) => void;
    onError?: (error: string) => void;
    className?: string;
}

type RecordingState = 'idle' | 'recording' | 'uploading' | 'processing' | 'complete' | 'error';

export function VoiceCapture({
    turmaId,
    students = [],
    onTranscriptionComplete,
    onError,
    className
}: VoiceCaptureProps) {
    const [state, setState] = useState<RecordingState>('idle');
    const [transcription, setTranscription] = useState<string>('');
    const [tagsBncc, setTagsBncc] = useState<string[]>([]);
    const [suggestedStudents, setSuggestedStudents] = useState<string[]>([]);
    const [detectedNames, setDetectedNames] = useState<string[]>([]);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const { processMedia } = useAIProcessing();

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                setAudioBlob(blob);

                // Process with AI
                await processAudioWithAI(blob);
            };

            mediaRecorder.start(1000);
            setState('recording');
            setRecordingTime(0);
            setTranscription('');
            setTagsBncc([]);
            setSuggestedStudents([]);
            setDetectedNames([]);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Error starting recording:', err);
            setState('error');
            onError?.('Não foi possível acessar o microfone');
        }
    }, [onError]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && state === 'recording') {
            mediaRecorderRef.current.stop();
            setState('uploading');

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [state]);

    const processAudioWithAI = async (blob: Blob) => {
        setState('processing');

        try {
            // Convert blob to base64 data URL for API
            const reader = new FileReader();

            reader.onloadend = async () => {
                const base64Audio = reader.result as string;

                try {
                    const result = await processMedia(base64Audio, 'audio', {
                        turmaId,
                        students
                    });

                    setTranscription(result.transcription || '');
                    setTagsBncc(result.tags_bncc || []);
                    setSuggestedStudents(result.suggested_students || []);
                    setDetectedNames(result.detected_student_names || []);
                    setState('complete');

                    onTranscriptionComplete({
                        audioBlob: blob,
                        audioUrl: base64Audio,
                        transcription: result.transcription || '',
                        tags_bncc: result.tags_bncc || [],
                        suggested_students: result.suggested_students || []
                    });
                } catch (err: any) {
                    console.error('Error processing audio:', err);
                    setState('error');
                    onError?.(err.message || 'Erro ao processar o áudio');
                }
            };

            reader.readAsDataURL(blob);

        } catch (err: any) {
            console.error('Error processing audio:', err);
            setState('error');
            onError?.(err.message || 'Erro ao processar o áudio');
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const reset = () => {
        setState('idle');
        setTranscription('');
        setTagsBncc([]);
        setSuggestedStudents([]);
        setDetectedNames([]);
        setRecordingTime(0);
        setAudioBlob(null);
    };

    // Get student names from IDs
    const getSuggestedStudentNames = () => {
        return suggestedStudents
            .map(id => students.find(s => s.id === id)?.nome)
            .filter(Boolean) as string[];
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Recording Button */}
            <div className="flex flex-col items-center gap-4">
                {state === 'idle' && (
                    <Button
                        size="lg"
                        onClick={startRecording}
                        className="h-20 w-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg"
                    >
                        <Mic className="w-8 h-8" />
                    </Button>
                )}

                {state === 'recording' && (
                    <div className="flex flex-col items-center gap-3">
                        <Button
                            size="lg"
                            onClick={stopRecording}
                            className="h-20 w-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 animate-pulse shadow-lg"
                        >
                            <MicOff className="w-8 h-8" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Clique para parar</p>
                    </div>
                )}

                {(state === 'uploading' || state === 'processing') && (
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {state === 'uploading' ? 'Enviando áudio...' : 'Transcrevendo com IA...'}
                        </p>
                    </div>
                )}

                {state === 'complete' && (
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-sm text-green-600 font-medium">Transcrição completa!</p>
                    </div>
                )}

                {state === 'error' && (
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <p className="text-sm text-red-600">Erro no processamento</p>
                        <Button variant="outline" size="sm" onClick={reset}>
                            Tentar novamente
                        </Button>
                    </div>
                )}
            </div>

            {/* Transcription Preview */}
            {transcription && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                        <span className="text-lg">📝</span>
                        Transcrição
                    </h4>
                    <p className="text-sm text-muted-foreground italic">
                        "{transcription}"
                    </p>
                </div>
            )}

            {/* Detected Students */}
            {detectedNames.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2 text-blue-800">
                        <Users className="w-4 h-4" />
                        Alunos mencionados
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {detectedNames.map((name, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                            >
                                {name}
                            </span>
                        ))}
                    </div>
                    {suggestedStudents.length > 0 && (
                        <p className="text-xs text-blue-600">
                            ✓ {suggestedStudents.length} aluno(s) identificado(s) na turma
                        </p>
                    )}
                </div>
            )}

            {/* BNCC Tags */}
            {tagsBncc.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                        <span className="text-lg">🏷️</span>
                        Tags BNCC identificadas
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

            {/* Reset button when complete */}
            {state === 'complete' && (
                <div className="flex justify-center">
                    <Button variant="outline" onClick={reset}>
                        Gravar novo áudio
                    </Button>
                </div>
            )}
        </div>
    );
}
