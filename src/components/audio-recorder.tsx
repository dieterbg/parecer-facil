"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioRecorderProps {
    onAudioReady: (blob: Blob) => void;
}

const MAX_RECORDING_TIME = 600; // 10 minutos em segundos

export function AudioRecorder({ onAudioReady }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Seu navegador não suporta gravação de áudio. Por favor, use a opção de upload.");
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            setRecordingTime(0);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);
                onAudioReady(blob);
                stream.getTracks().forEach((track) => track.stop());
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);

            // Inicia o timer
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    const newTime = prev + 1;
                    // Para automaticamente ao atingir 10 minutos
                    if (newTime >= MAX_RECORDING_TIME) {
                        stopRecording();
                        alert("Tempo máximo de gravação atingido (10 minutos).");
                    }
                    return newTime;
                });
            }, 1000);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Não foi possível acessar o microfone. Verifique as permissões.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAudioBlob(file);
            onAudioReady(file);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimeColor = () => {
        if (recordingTime >= MAX_RECORDING_TIME - 30) return "text-red-500";
        if (recordingTime >= MAX_RECORDING_TIME - 60) return "text-yellow-500";
        return "text-muted-foreground";
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg bg-muted/50">
                {!isRecording && !audioBlob && (
                    <>
                        <Button
                            type="button"
                            size="lg"
                            onClick={startRecording}
                            className="h-24 w-24 rounded-full"
                        >
                            <Mic className="h-8 w-8" />
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            Clique para gravar áudio (máx. 10 minutos)
                        </p>
                        <div className="relative">
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                id="audio-upload"
                            />
                            <Button type="button" variant="outline" asChild>
                                <label htmlFor="audio-upload" className="cursor-pointer">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Ou envie um arquivo
                                </label>
                            </Button>
                        </div>
                    </>
                )}

                {isRecording && (
                    <>
                        <Button
                            type="button"
                            size="lg"
                            onClick={stopRecording}
                            variant="destructive"
                            className="h-24 w-24 rounded-full animate-pulse"
                        >
                            <Square className="h-8 w-8" />
                        </Button>
                        <div className="flex flex-col items-center gap-1">
                            <p className="text-sm text-muted-foreground">
                                Gravando... Clique para parar
                            </p>
                            <p className={`text-2xl font-mono font-bold ${getTimeColor()}`}>
                                {formatTime(recordingTime)} / 10:00
                            </p>
                        </div>
                    </>
                )}

                {audioBlob && !isRecording && (
                    <div className="flex flex-col items-center gap-2">
                        <audio controls src={URL.createObjectURL(audioBlob)} className="w-full max-w-md" />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setAudioBlob(null);
                                setRecordingTime(0);
                                onAudioReady(null as any);
                            }}
                        >
                            Gravar novamente
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
