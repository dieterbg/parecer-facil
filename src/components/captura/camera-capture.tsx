'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, RotateCcw, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onCancel: () => void;
    disabled?: boolean;
}

export function CameraCapture({ onCapture, onCancel, disabled = false }: CameraCaptureProps) {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Inicializar câmera
    useEffect(() => {
        let currentStream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                setLoading(true);
                setError(null);

                // Parar stream anterior se existir
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }

                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode,
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                    },
                    audio: false,
                });

                currentStream = newStream;
                setStream(newStream);

                if (videoRef.current) {
                    videoRef.current.srcObject = newStream;
                }
            } catch (err) {
                console.error('Erro ao acessar câmera:', err);
                setError('Não foi possível acessar a câmera. Verifique as permissões.');
            } finally {
                setLoading(false);
            }
        };

        if (!capturedImage) {
            startCamera();
        }

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode, capturedImage]);

    // Capturar foto
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Espelhar se for câmera frontal
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);

        // Parar stream após captura
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    // Confirmar e enviar
    const confirmPhoto = async () => {
        if (!capturedImage) return;

        // Converter data URL para File
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });

        onCapture(file);
    };

    // Refazer foto
    const retakePhoto = () => {
        setCapturedImage(null);
    };

    // Trocar câmera
    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    if (error) {
        return (
            <div className="relative w-full aspect-[4/3] bg-card rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6">
                <Camera className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground mb-4">{error}</p>
                <button
                    onClick={onCancel}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                    Voltar
                </button>
            </div>
        );
    }

    return (
        <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden">
            {/* Canvas oculto para captura */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Preview da foto capturada */}
            {capturedImage ? (
                <>
                    <img
                        src={capturedImage}
                        alt="Foto capturada"
                        className="w-full h-full object-cover"
                    />

                    {/* Ações após captura */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={retakePhoto}
                                disabled={disabled}
                                className="flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-full hover:bg-muted/80 transition-colors disabled:opacity-50"
                            >
                                <RotateCcw className="w-5 h-5" />
                                Refazer
                            </button>
                            <button
                                onClick={confirmPhoto}
                                disabled={disabled}
                                className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                <Check className="w-5 h-5" />
                                Usar foto
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Loading */}
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                    )}

                    {/* Video preview */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={cn(
                            'w-full h-full object-cover',
                            facingMode === 'user' && 'scale-x-[-1]', // Espelhar câmera frontal
                            loading && 'opacity-0'
                        )}
                    />

                    {/* Controles */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center justify-between">
                            {/* Cancelar */}
                            <button
                                onClick={onCancel}
                                className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>

                            {/* Capturar */}
                            <button
                                onClick={capturePhoto}
                                disabled={loading || disabled}
                                className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                            >
                                <div className="w-14 h-14 border-4 border-black rounded-full" />
                            </button>

                            {/* Trocar câmera */}
                            <button
                                onClick={toggleCamera}
                                className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
                            >
                                <RotateCcw className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
