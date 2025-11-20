"use client";

import { useAuth, supabase } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Save, User, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PerfilPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [estilo, setEstilo] = useState("");
    const [paginasEsperadas, setPaginasEsperadas] = useState("1");

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        const { data, error } = await supabase
            .from('professores')
            .select('nome, email, estilo_escrita, paginas_esperadas')
            .eq('uid', user?.id)
            .single();

        if (data) {
            setNome(data.nome || "");
            setEmail(data.email || user?.email || "");
            setEstilo(data.estilo_escrita || "");
            setPaginasEsperadas(data.paginas_esperadas?.toString() || "1");
        } else if (user?.email) {
            // Se não encontrou registro, preenche com o email do auth
            setEmail(user.email);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const { error } = await supabase
                .from('professores')
                .upsert({
                    uid: user.id,
                    nome: nome,
                    email: email,
                    estilo_escrita: estilo,
                    paginas_esperadas: parseInt(paginasEsperadas) || 1,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'uid' });

            if (error) throw error;
            alert('Perfil salvo com sucesso!');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Erro ao salvar perfil.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Meu Perfil</h1>
                </div>

                <Card className="border-border/50 bg-card/40 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle>Informações Pessoais</CardTitle>
                        <CardDescription>
                            Atualize seus dados pessoais
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Nome Completo
                            </label>
                            <Input
                                placeholder="Ex: Maria Silva"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="bg-background/50 border-border/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                E-mail
                            </label>
                            <Input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-background/50 border-border/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Número de Páginas Esperado
                            </label>
                            <Input
                                type="number"
                                min="1"
                                max="10"
                                placeholder="1"
                                value={paginasEsperadas}
                                onChange={(e) => setPaginasEsperadas(e.target.value)}
                                className="bg-background/50 border-border/50"
                            />
                            <p className="text-xs text-muted-foreground">
                                Quantidade aproximada de páginas que o parecer deve ter (1-10)
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/40 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle>Estilo de Escrita</CardTitle>
                        <CardDescription>
                            Cole aqui um exemplo de um parecer que você já escreveu. A IA usará este texto como base para aprender seu tom de voz e vocabulário.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            className="min-h-[300px] text-base leading-relaxed bg-background/50 border-border/50"
                            placeholder="Exemplo: O aluno João demonstrou grande evolução nas atividades motoras..."
                            value={estilo}
                            onChange={(e) => setEstilo(e.target.value)}
                        />
                    </CardContent>
                </Card>

                <Button
                    className="w-full h-12 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/25"
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-5 w-5" />
                    )}
                    Salvar Perfil
                </Button>
            </div>
        </div>
    );
}
