"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";
import { AREAS_DESENVOLVIMENTO, AREAS_CORES, AreaDesenvolvimento } from "@/types/database";
import { Loader2, Target } from "lucide-react";

export function BnccRadar() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBnccData();
    }, []);

    const fetchBnccData = async () => {
        try {
            // Buscar contagem de marcos por área
            const { data: marcos, error } = await supabase
                .from('marcos')
                .select('area');

            if (error) throw error;

            // Inicializar contadores
            const counts: Record<string, number> = {};
            Object.keys(AREAS_DESENVOLVIMENTO).forEach(key => {
                counts[key] = 0;
            });

            // Contar
            marcos?.forEach(m => {
                if (counts[m.area] !== undefined) {
                    counts[m.area]++;
                }
            });

            // Formatar para Recharts
            const chartData = Object.entries(AREAS_DESENVOLVIMENTO).map(([key, label]) => ({
                subject: label.split(' ')[0], // Pegar primeira palavra para o eixo (ex: "Coordenação")
                fullLabel: label,
                A: counts[key] || 0,
                fullMark: 10, // Escala fictícia por enquanto
                color: AREAS_CORES[key as AreaDesenvolvimento]
            }));

            setData(chartData);
        } catch (error) {
            console.error("Erro ao carregar dados BNCC:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        Cobertura BNCC
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-500" />
                        Cobertura BNCC
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                            <Radar
                                name="Marcos Registrados"
                                dataKey="A"
                                stroke="#8b5cf6"
                                fill="#8b5cf6"
                                fillOpacity={0.3}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                    Distribuição dos marcos de desenvolvimento registrados.
                </p>
            </CardContent>
        </Card>
    );
}
