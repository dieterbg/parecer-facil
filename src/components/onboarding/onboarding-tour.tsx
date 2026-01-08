"use client";

import { useEffect, useState, useCallback } from "react";
import { driver, Driver } from "driver.js";
import "driver.js/dist/driver.css";

interface OnboardingTourProps {
    userId: string;
    enabled?: boolean;
    onComplete?: () => void;
    onSkip?: () => void;
}

// Chave para localStorage para controlar se o tour já foi visto
const TOUR_COMPLETED_KEY = "parecer-facil-tour-completed";

export function OnboardingTour({
    userId,
    enabled = true,
    onComplete,
    onSkip
}: OnboardingTourProps) {
    const [driverInstance, setDriverInstance] = useState<Driver | null>(null);
    const [hasCompletedTour, setHasCompletedTour] = useState(true); // Assume true to not show by default

    // Verificar se o tour já foi completado
    useEffect(() => {
        if (typeof window !== "undefined") {
            const completed = localStorage.getItem(`${TOUR_COMPLETED_KEY}-${userId}`);
            setHasCompletedTour(completed === "true");
        }
    }, [userId]);

    // Marcar tour como completado
    const markTourCompleted = useCallback(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(`${TOUR_COMPLETED_KEY}-${userId}`, "true");
            setHasCompletedTour(true);
        }
    }, [userId]);

    // Resetar tour (para permitir ver novamente)
    const resetTour = useCallback(() => {
        if (typeof window !== "undefined") {
            localStorage.removeItem(`${TOUR_COMPLETED_KEY}-${userId}`);
            setHasCompletedTour(false);
        }
    }, [userId]);

    // Inicializar e rodar o tour
    useEffect(() => {
        if (!enabled || hasCompletedTour) return;

        // Aguardar o DOM carregar
        const timer = setTimeout(() => {
            const driverObj = driver({
                showProgress: true,
                animate: true,
                allowClose: true,
                overlayColor: "rgba(0, 0, 0, 0.75)",
                stagePadding: 10,
                stageRadius: 10,
                popoverClass: "parecer-facil-tour",

                // Configurar textos em português
                nextBtnText: "Próximo →",
                prevBtnText: "← Anterior",
                doneBtnText: "Concluir 🎉",
                progressText: "{{current}} de {{total}}",

                // Etapas do tour
                steps: [
                    {
                        popover: {
                            title: "👋 Bem-vindo ao Parecer Fácil!",
                            description: "Vamos fazer um tour rápido pelas principais funcionalidades. Isso leva menos de 1 minuto!",
                            side: "over",
                            align: "center"
                        }
                    },
                    {
                        element: "[data-tour='sidebar']",
                        popover: {
                            title: "📚 Menu Lateral",
                            description: "Aqui você acessa todas as áreas: Dashboard, Turmas, Novo Parecer e seu Perfil.",
                            side: "right",
                            align: "start"
                        }
                    },
                    {
                        element: "[data-tour='turmas']",
                        popover: {
                            title: "🏫 Suas Turmas",
                            description: "Crie turmas para organizar seus alunos. Cada turma tem sua própria timeline de registros.",
                            side: "right",
                            align: "center"
                        }
                    },
                    {
                        element: "[data-tour='fab']",
                        popover: {
                            title: "📷 Captura Rápida",
                            description: "Este botão flutuante permite criar registros rapidamente: fotos, vídeos, áudios ou notas de texto.",
                            side: "left",
                            align: "center"
                        }
                    },
                    {
                        element: "[data-tour='novo-parecer']",
                        popover: {
                            title: "📝 Gerar Parecer com IA",
                            description: "Grave suas observações por áudio e a IA gera um parecer descritivo completo automaticamente!",
                            side: "right",
                            align: "center"
                        }
                    },
                    {
                        element: "[data-tour='perfil']",
                        popover: {
                            title: "⚙️ Seu Perfil",
                            description: "Configure seu estilo de escrita para que os pareceres gerados reflitam sua voz única.",
                            side: "right",
                            align: "center"
                        }
                    },
                    {
                        popover: {
                            title: "🚀 Pronto para começar!",
                            description: "Agora você conhece o básico. Comece criando sua primeira turma e registrando momentos especiais com seus alunos!",
                            side: "over",
                            align: "center"
                        }
                    }
                ],

                // Callbacks
                onDestroyStarted: () => {
                    if (!driverObj.hasNextStep()) {
                        markTourCompleted();
                        onComplete?.();
                    }
                    driverObj.destroy();
                },

                onCloseClick: () => {
                    markTourCompleted();
                    onSkip?.();
                    driverObj.destroy();
                }
            });

            setDriverInstance(driverObj);
            driverObj.drive();
        }, 1000); // Aguardar 1s para o DOM estar pronto

        return () => {
            clearTimeout(timer);
            driverInstance?.destroy();
        };
    }, [enabled, hasCompletedTour, markTourCompleted, onComplete, onSkip]);

    return null; // Componente não renderiza nada visualmente
}

// Botão para refazer o tour (pode ser usado em configurações)
export function RestartTourButton({
    userId,
    onRestart
}: {
    userId: string;
    onRestart?: () => void
}) {
    const handleRestart = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem(`${TOUR_COMPLETED_KEY}-${userId}`);
            onRestart?.();
            window.location.reload(); // Recarrega para iniciar o tour
        }
    };

    return (
        <button
            onClick={handleRestart}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
            🔄 Refazer Tour de Introdução
        </button>
    );
}
