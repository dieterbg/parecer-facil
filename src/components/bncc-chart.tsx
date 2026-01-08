"use client";

import { CAMPOS_EXPERIENCIA, type CampoExperienciaBncc } from "@/types/database";
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Cell
} from "recharts";

interface BnccData {
    campo: CampoExperienciaBncc;
    sigla: string;
    count: number;
    cor: string;
}

interface BnccChartProps {
    data: BnccData[];
    type?: "radar" | "bar";
    className?: string;
}

/**
 * BNCC Chart Component
 * Displays the distribution of records across BNCC Experience Fields.
 * Supports both Radar and Bar chart types.
 */
export function BnccChart({ data, type = "bar", className = "" }: BnccChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className={`flex items-center justify-center h-48 text-muted-foreground text-sm ${className}`}>
                Nenhum registro com campo da BNCC encontrado.
            </div>
        );
    }

    // Normalize data for radar chart (0-100 scale based on max)
    const maxCount = Math.max(...data.map(d => d.count), 1);
    const normalizedData = data.map(d => ({
        ...d,
        fullMark: 100,
        value: Math.round((d.count / maxCount) * 100)
    }));

    if (type === "radar") {
        return (
            <div className={`w-full h-64 ${className}`}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={normalizedData} cx="50%" cy="50%" outerRadius="80%">
                        <PolarGrid stroke="hsl(var(--muted-foreground) / 0.3)" />
                        <PolarAngleAxis
                            dataKey="sigla"
                            tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 500 }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        />
                        <Radar
                            name="Registros"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.5}
                        />
                        <Tooltip
                            formatter={(value, name, props) => [
                                `${props?.payload?.count ?? 0} registros`,
                                props?.payload?.campo ?? ""
                            ]}
                            contentStyle={{
                                backgroundColor: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px"
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        );
    }

    // Bar Chart (default)
    return (
        <div className={`w-full h-64 ${className}`}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                    <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis
                        type="category"
                        dataKey="sigla"
                        tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 500 }}
                        width={30}
                    />
                    <Tooltip
                        formatter={(value, name, props) => [
                            `${value ?? 0} registros`,
                            props?.payload?.campo ?? ""
                        ]}
                        contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                        }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

/**
 * Helper function to aggregate BNCC tags from records.
 * Call this with the student's registros to prepare data for the chart.
 */
export function aggregateBnccTags(registros: { tags_bncc?: string[] | null }[]): BnccData[] {
    const counts: Record<string, number> = {};

    // Initialize all fields with 0
    Object.entries(CAMPOS_EXPERIENCIA).forEach(([campo, { sigla }]) => {
        counts[sigla] = 0;
    });

    // Count occurrences
    registros.forEach(reg => {
        if (reg.tags_bncc && Array.isArray(reg.tags_bncc)) {
            reg.tags_bncc.forEach(tag => {
                if (counts[tag] !== undefined) {
                    counts[tag]++;
                }
            });
        }
    });

    // Convert to array format
    return Object.entries(CAMPOS_EXPERIENCIA).map(([campo, { sigla, cor }]) => ({
        campo: campo as CampoExperienciaBncc,
        sigla,
        count: counts[sigla] || 0,
        cor
    }));
}
