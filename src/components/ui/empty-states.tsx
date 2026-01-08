"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
    title: string;
    description: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
    className?: string;
    children?: React.ReactNode;
}

// Ilustração: Sala de aula vazia (para turmas)
function ClassroomIllustration({ className }: { className?: string }) {
    return (
        <svg
            className={cn("w-48 h-48", className)}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Mesa */}
            <rect x="30" y="130" width="140" height="10" rx="2" className="fill-muted-foreground/20" />
            <rect x="40" y="140" width="6" height="30" rx="1" className="fill-muted-foreground/30" />
            <rect x="154" y="140" width="6" height="30" rx="1" className="fill-muted-foreground/30" />

            {/* Cadeiras vazias */}
            <circle cx="60" cy="110" r="12" className="fill-primary/10 stroke-primary/30" strokeWidth="2" strokeDasharray="4 4" />
            <circle cx="100" cy="110" r="12" className="fill-primary/10 stroke-primary/30" strokeWidth="2" strokeDasharray="4 4" />
            <circle cx="140" cy="110" r="12" className="fill-primary/10 stroke-primary/30" strokeWidth="2" strokeDasharray="4 4" />

            {/* Quadro */}
            <rect x="50" y="40" width="100" height="50" rx="4" className="fill-muted stroke-muted-foreground/20" strokeWidth="2" />
            <text x="100" y="70" textAnchor="middle" className="fill-muted-foreground/40 text-xs">ABC</text>

            {/* Estrelas decorativas */}
            <path d="M170 50 L172 55 L178 55 L173 59 L175 65 L170 61 L165 65 L167 59 L162 55 L168 55 Z" className="fill-yellow-400/50" />
            <path d="M35 60 L36.5 64 L41 64 L37 67 L38.5 71 L35 68 L31.5 71 L33 67 L29 64 L33.5 64 Z" className="fill-yellow-400/40" />
        </svg>
    );
}

// Ilustração: Crianças (para alunos)
function ChildrenIllustration({ className }: { className?: string }) {
    return (
        <svg
            className={cn("w-48 h-48", className)}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Criança 1 (contorno) */}
            <circle cx="70" cy="80" r="20" className="stroke-primary/40" strokeWidth="3" strokeDasharray="6 6" fill="none" />
            <path d="M70 100 L70 140 M55 115 L85 115 M70 140 L55 170 M70 140 L85 170" className="stroke-primary/30" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 6" />

            {/* Criança 2 (contorno) */}
            <circle cx="130" cy="80" r="20" className="stroke-secondary/40" strokeWidth="3" strokeDasharray="6 6" fill="none" />
            <path d="M130 100 L130 140 M115 115 L145 115 M130 140 L115 170 M130 140 L145 170" className="stroke-secondary/30" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 6" />

            {/* + no centro */}
            <circle cx="100" cy="120" r="15" className="fill-primary/10 stroke-primary" strokeWidth="2" />
            <path d="M100 112 L100 128 M92 120 L108 120" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />

            {/* Decoração */}
            <circle cx="40" cy="50" r="4" className="fill-yellow-400/60" />
            <circle cx="160" cy="45" r="3" className="fill-pink-400/60" />
            <circle cx="180" cy="100" r="5" className="fill-blue-400/40" />
        </svg>
    );
}

// Ilustração: Câmera (para registros)
function CameraIllustration({ className }: { className?: string }) {
    return (
        <svg
            className={cn("w-48 h-48", className)}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Corpo da câmera */}
            <rect x="40" y="70" width="120" height="80" rx="12" className="fill-muted stroke-muted-foreground/30" strokeWidth="2" />

            {/* Lente */}
            <circle cx="100" cy="110" r="30" className="fill-background stroke-primary/40" strokeWidth="3" />
            <circle cx="100" cy="110" r="20" className="fill-primary/10 stroke-primary/60" strokeWidth="2" />
            <circle cx="100" cy="110" r="8" className="fill-primary/20" />

            {/* Flash */}
            <rect x="130" y="80" width="15" height="10" rx="2" className="fill-yellow-400/60" />

            {/* Visor */}
            <rect x="70" y="55" width="30" height="20" rx="4" className="fill-muted-foreground/20" />

            {/* Raios de flash */}
            <path d="M100 160 L100 175" className="stroke-yellow-400/40" strokeWidth="2" strokeLinecap="round" />
            <path d="M70 155 L55 170" className="stroke-yellow-400/30" strokeWidth="2" strokeLinecap="round" />
            <path d="M130 155 L145 170" className="stroke-yellow-400/30" strokeWidth="2" strokeLinecap="round" />

            {/* Estrelas */}
            <circle cx="170" cy="55" r="4" className="fill-yellow-400/60" />
            <circle cx="35" cy="80" r="3" className="fill-pink-400/50" />
        </svg>
    );
}

// Ilustração: Documento (para pareceres)
function DocumentIllustration({ className }: { className?: string }) {
    return (
        <svg
            className={cn("w-48 h-48", className)}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Papel 1 (fundo) */}
            <rect x="55" y="35" width="100" height="130" rx="6" className="fill-muted-foreground/10" transform="rotate(5 105 100)" />

            {/* Papel 2 (frente) */}
            <rect x="50" y="40" width="100" height="130" rx="6" className="fill-background stroke-muted-foreground/30" strokeWidth="2" />

            {/* Linhas de texto */}
            <rect x="65" y="60" width="60" height="4" rx="2" className="fill-primary/30" />
            <rect x="65" y="75" width="70" height="3" rx="1.5" className="fill-muted-foreground/20" />
            <rect x="65" y="85" width="55" height="3" rx="1.5" className="fill-muted-foreground/20" />
            <rect x="65" y="95" width="65" height="3" rx="1.5" className="fill-muted-foreground/20" />
            <rect x="65" y="105" width="45" height="3" rx="1.5" className="fill-muted-foreground/20" />

            {/* Caneta */}
            <rect x="130" y="130" width="40" height="8" rx="2" className="fill-primary/60" transform="rotate(-30 150 134)" />
            <path d="M123 155 L130 150" className="stroke-primary/60" strokeWidth="3" strokeLinecap="round" />

            {/* Decoração */}
            <circle cx="165" cy="50" r="5" className="fill-green-400/50" />
            <circle cx="40" cy="90" r="4" className="fill-blue-400/40" />
        </svg>
    );
}

// Componente base de Empty State
function EmptyStateBase({
    title,
    description,
    action,
    className,
    children
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-12 px-6 text-center",
            "animate-in fade-in-50 duration-500",
            className
        )}>
            {children}
            <h3 className="text-lg font-semibold mt-4 mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">{description}</p>
            {action && (
                action.href ? (
                    <Button asChild className="gap-2">
                        <Link href={action.href}>{action.label}</Link>
                    </Button>
                ) : (
                    <Button onClick={action.onClick} className="gap-2">
                        {action.label}
                    </Button>
                )
            )}
        </div>
    );
}

// Empty States específicos
export function EmptyTurmas({ onCreateClick }: { onCreateClick?: () => void }) {
    return (
        <EmptyStateBase
            title="Nenhuma turma ainda"
            description="Crie sua primeira turma para começar a registrar o dia a dia com seus alunos."
            action={onCreateClick ? { label: "🏫 Criar Turma", onClick: onCreateClick } : { label: "🏫 Criar Turma", href: "/turmas" }}
        >
            <ClassroomIllustration />
        </EmptyStateBase>
    );
}

export function EmptyAlunos({ onAddClick }: { onAddClick?: () => void }) {
    return (
        <EmptyStateBase
            title="Turma sem alunos"
            description="Adicione seus alunos para começar a criar registros e acompanhar o desenvolvimento."
            action={{ label: "➕ Adicionar Alunos", onClick: onAddClick }}
        >
            <ChildrenIllustration />
        </EmptyStateBase>
    );
}

export function EmptyRegistros({ onCaptureClick }: { onCaptureClick?: () => void }) {
    return (
        <EmptyStateBase
            title="Nenhum registro ainda"
            description="Capture fotos, grave áudios ou faça anotações sobre atividades com seus alunos."
            action={{ label: "📷 Criar Registro", onClick: onCaptureClick }}
        >
            <CameraIllustration />
        </EmptyStateBase>
    );
}

export function EmptyPareceres() {
    return (
        <EmptyStateBase
            title="Nenhum parecer criado"
            description="Gere pareceres descritivos automaticamente baseados nas suas observações do dia a dia."
            action={{ label: "📝 Gerar Parecer", href: "/novo" }}
        >
            <DocumentIllustration />
        </EmptyStateBase>
    );
}
