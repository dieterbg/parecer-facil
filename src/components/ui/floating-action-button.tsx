"use client";

import { useState, useEffect } from "react";
import { Camera, Video, Mic, FileText, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { QuickCapture } from "@/components/captura/quick-capture";

interface FABAction {
    id: string;
    icon: React.ReactNode;
    label: string;
    color: string;
    onClick: () => void;
}

interface FloatingActionButtonProps {
    turmaId?: string;
    onAction?: (tipo: 'foto' | 'video' | 'audio' | 'texto') => void;
    className?: string;
}

export function FloatingActionButton({ turmaId: propTurmaId, onAction, className }: FloatingActionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [showCapture, setShowCapture] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // Extrair turmaId da URL atual se não fornecido via prop
    const turmaId = propTurmaId || (() => {
        const match = pathname.match(/\/turmas\/([a-f0-9-]+)/i);
        return match ? match[1] : undefined;
    })();

    // Esconder FAB ao scrollar para baixo, mostrar ao scrollar para cima
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setIsVisible(currentScrollY < lastScrollY || currentScrollY < 100);
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.fab-container')) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [isOpen]);

    const handleAction = (tipo: 'foto' | 'video' | 'audio' | 'texto') => {
        setIsOpen(false);
        if (onAction) {
            onAction(tipo);
        } else if (turmaId) {
            // Abrir modal de captura diretamente
            setShowCapture(true);
        } else {
            // Navegar para turmas se não estiver em uma turma específica
            router.push('/turmas');
        }
    };

    const actions: FABAction[] = [
        {
            id: 'foto',
            icon: <Camera className="w-5 h-5" />,
            label: 'Foto',
            color: 'bg-blue-500 hover:bg-blue-600',
            onClick: () => handleAction('foto')
        },
        {
            id: 'video',
            icon: <Video className="w-5 h-5" />,
            label: 'Vídeo',
            color: 'bg-purple-500 hover:bg-purple-600',
            onClick: () => handleAction('video')
        },
        {
            id: 'audio',
            icon: <Mic className="w-5 h-5" />,
            label: 'Áudio',
            color: 'bg-orange-500 hover:bg-orange-600',
            onClick: () => handleAction('audio')
        },
        {
            id: 'texto',
            icon: <FileText className="w-5 h-5" />,
            label: 'Nota',
            color: 'bg-green-500 hover:bg-green-600',
            onClick: () => handleAction('texto')
        }
    ];

    // Não mostrar em páginas específicas
    const hiddenPaths = ['/', '/perfil', '/novo'];
    if (hiddenPaths.includes(pathname)) {
        return null;
    }

    return (
        <div
            className={cn(
                "fab-container fixed bottom-6 right-6 z-50 transition-all duration-300",
                !isVisible && "translate-y-24 opacity-0",
                className
            )}
        >
            {/* Backdrop escurecido quando aberto */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Menu de ações - layout radial */}
            <div className={cn(
                "absolute bottom-16 right-0 flex flex-col gap-3 transition-all duration-300",
                isOpen
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4 pointer-events-none"
            )}>
                {actions.map((action, index) => (
                    <button
                        key={action.id}
                        onClick={action.onClick}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-full text-white shadow-lg",
                            "transform transition-all duration-200",
                            "hover:scale-105 active:scale-95",
                            action.color
                        )}
                        style={{
                            transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
                            transform: isOpen ? 'translateX(0)' : 'translateX(20px)'
                        }}
                    >
                        {action.icon}
                        <span className="text-sm font-medium whitespace-nowrap">
                            {action.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Botão FAB principal */}
            <button
                data-tour="fab"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-14 h-14 rounded-full shadow-lg",
                    "flex items-center justify-center",
                    "transition-all duration-300 transform",
                    "hover:scale-110 active:scale-95",
                    isOpen
                        ? "bg-gray-700 rotate-45"
                        : "bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse-subtle"
                )}
                aria-label={isOpen ? "Fechar menu" : "Novo registro"}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <Plus className="w-6 h-6 text-white" />
                )}
            </button>

            {/* Tooltip quando fechado */}
            {!isOpen && (
                <div className="absolute bottom-0 right-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Novo Registro
                </div>
            )}

            {/* Modal de Captura Rápida */}
            {showCapture && turmaId && (
                <QuickCapture
                    turmaId={turmaId}
                    onSuccess={() => {
                        setShowCapture(false);
                        // Force page refresh to update timeline
                        window.location.reload();
                    }}
                    onCancel={() => setShowCapture(false)}
                />
            )}
        </div>
    );
}

