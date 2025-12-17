"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/components/auth-provider";
import { Loader2, ArrowRight, CheckCircle, School, User, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface OnboardingWizardProps {
    userId: string;
    onComplete: () => void;
}

type Step = 'WELCOME' | 'CREATE_TURMA' | 'CREATE_ALUNO' | 'SUCCESS';

export function OnboardingWizard({ userId, onComplete }: OnboardingWizardProps) {
    const [step, setStep] = useState<Step>('WELCOME');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Data State
    const [turmaNome, setTurmaNome] = useState("");
    const [turmaId, setTurmaId] = useState<string | null>(null);
    const [alunoNome, setAlunoNome] = useState("");

    const handleStart = () => setStep('CREATE_TURMA');

    const handleCreateTurma = async () => {
        if (!turmaNome.trim()) return;
        setLoading(true);
        try {
            // Create Turma
            const { data, error } = await supabase
                .from('turmas')
                .insert([{
                    user_id: userId,
                    nome: turmaNome,
                    ano_letivo: new Date().getFullYear().toString(),
                    escola: "Minha Escola" // Default
                }])
                .select()
                .single();

            if (error) throw error;

            setTurmaId(data.id);
            setStep('CREATE_ALUNO');
        } catch (error) {
            console.error("Erro ao criar turma:", error);
            alert("Erro ao criar turma. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAluno = async () => {
        if (!alunoNome.trim() || !turmaId) return;
        setLoading(true);
        try {
            // Create Aluno
            const { error } = await supabase
                .from('alunos')
                .insert([{
                    nome: alunoNome,
                    turma_id: turmaId,
                    data_nascimento: null, // Optional for now
                    ativo: true
                }]);

            if (error) throw error;

            setStep('SUCCESS');
        } catch (error) {
            console.error("Erro ao criar aluno:", error);
            alert("Erro ao criar aluno. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        onComplete();
        router.refresh();
    };

    // Render Steps
    const renderStep = () => {
        switch (step) {
            case 'WELCOME':
                return (
                    <div className="space-y-6 text-center py-4">
                        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Bem-vindo ao Parecer Fácil! 👋</h2>
                            <p className="text-muted-foreground">
                                Vamos configurar sua sala de aula digital em menos de 1 minuto para que você possa começar a gerar relatórios mágicos.
                            </p>
                        </div>
                        <Button size="lg" className="w-full" onClick={handleStart}>
                            Começar Agora <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                );

            case 'CREATE_TURMA':
                return (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <School className="w-5 h-5" />
                                <span>Passo 1 de 2</span>
                            </div>
                            <h2 className="text-xl font-bold">Qual o nome da sua turma?</h2>
                            <p className="text-sm text-muted-foreground">
                                Pode ser "Jardim II", "Berçário", "1º Ano A"...
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Nome da Turma</Label>
                            <Input
                                autoFocus
                                placeholder="Ex: Maternal II B"
                                value={turmaNome}
                                onChange={(e) => setTurmaNome(e.target.value)}
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleCreateTurma}
                            disabled={!turmaNome.trim() || loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Próximo"}
                        </Button>
                    </div>
                );

            case 'CREATE_ALUNO':
                return (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <User className="w-5 h-5" />
                                <span>Passo 2 de 2</span>
                            </div>
                            <h2 className="text-xl font-bold">Adicione seu primeiro aluno</h2>
                            <p className="text-sm text-muted-foreground">
                                Vamos adicionar uma criança para testar o sistema.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Nome do Aluno</Label>
                            <Input
                                autoFocus
                                placeholder="Ex: João Silva"
                                value={alunoNome}
                                onChange={(e) => setAlunoNome(e.target.value)}
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleCreateAluno}
                            disabled={!alunoNome.trim() || loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finalizar Cadastro"}
                        </Button>
                    </div>
                );

            case 'SUCCESS':
                return (
                    <div className="space-y-6 text-center py-6">
                        <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Tudo pronto! 🎉</h2>
                            <p className="text-muted-foreground">
                                Sua turma <strong>{turmaNome}</strong> e seu aluno <strong>{alunoNome}</strong> foram cadastrados com sucesso.
                            </p>
                        </div>
                        <Button size="lg" className="w-full font-bold" onClick={handleFinish}>
                            Ir para o Painel
                        </Button>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md shadow-2xl border-2 border-primary/20 animate-in fade-in zoom-in-95 duration-300">
                <CardContent>
                    {renderStep()}
                </CardContent>
            </Card>
        </div>
    );
}
