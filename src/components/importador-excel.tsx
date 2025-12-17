"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';

interface AlunoImportado {
    nome: string;
    data_nascimento?: string;
    observacoes?: string;
}

interface ImportadorExcelProps {
    onImport: (alunos: AlunoImportado[]) => Promise<void>;
    onClose: () => void;
}

export function ImportadorExcel({ onImport, onClose }: ImportadorExcelProps) {
    const [arquivo, setArquivo] = useState<File | null>(null);
    const [preview, setPreview] = useState<AlunoImportado[]>([]);
    const [erro, setErro] = useState<string | null>(null);
    const [importando, setImportando] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setArquivo(file);
        setErro(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet) as any[];

                // Mapear colunas (aceita variações de nomes)
                const alunosImportados: AlunoImportado[] = json.map((row) => {
                    const nome = row['Nome'] || row['nome'] || row['NOME'] || row['Aluno'] || row['aluno'];
                    const dataNascimento = row['Data de Nascimento'] || row['data_nascimento'] || row['Nascimento'] || row['nascimento'];
                    const observacoes = row['Observações'] || row['observacoes'] || row['Obs'] || row['obs'];

                    if (!nome) {
                        throw new Error('Coluna "Nome" não encontrada. Certifique-se de que a planilha tem uma coluna chamada "Nome".');
                    }

                    return {
                        nome: String(nome).trim(),
                        data_nascimento: dataNascimento ? formatarData(dataNascimento) : undefined,
                        observacoes: observacoes ? String(observacoes).trim() : undefined
                    };
                }).filter(aluno => aluno.nome); // Remove linhas vazias

                if (alunosImportados.length === 0) {
                    throw new Error('Nenhum aluno encontrado no arquivo. Verifique se há dados na planilha.');
                }

                setPreview(alunosImportados);
            } catch (err: any) {
                setErro(err.message || 'Erro ao ler o arquivo. Verifique se é um arquivo Excel válido.');
                setPreview([]);
            }
        };

        reader.readAsBinaryString(file);
    };

    const formatarData = (data: any): string | undefined => {
        if (!data) return undefined;

        // Se já é uma string no formato YYYY-MM-DD
        if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
            return data;
        }

        // Se é um número (data do Excel)
        if (typeof data === 'number') {
            const date = XLSX.SSF.parse_date_code(data);
            return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
        }

        // Tentar converter string para data
        try {
            const date = new Date(data);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        } catch {
            return undefined;
        }

        return undefined;
    };

    const handleImport = async () => {
        setImportando(true);
        try {
            await onImport(preview);
            onClose();
        } catch (err) {
            setErro('Erro ao importar alunos. Tente novamente.');
        } finally {
            setImportando(false);
        }
    };

    const downloadModelo = () => {
        const link = document.createElement('a');
        link.href = '/modelo_importacao_alunos.xlsx';
        link.download = 'modelo_importacao_alunos.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className="bg-muted/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Importar Alunos via Excel
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Faça upload de um arquivo Excel (.xlsx, .xls) ou CSV com a lista de alunos.
                    </p>
                    <Button variant="outline" size="sm" onClick={downloadModelo} className="gap-2">
                        <Upload className="w-4 h-4" />
                        Baixar Modelo de Planilha
                    </Button>
                </div>

                <div>
                    <label className="block">
                        <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">
                                {arquivo ? arquivo.name : 'Clique para selecionar um arquivo'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Formatos aceitos: .xlsx, .xls, .csv
                            </p>
                        </div>
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>
                </div>

                {erro && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">{erro}</p>
                    </div>
                )}

                {preview.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>{preview.length} aluno(s) encontrado(s)</span>
                        </div>

                        <div className="max-h-48 overflow-y-auto border rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="bg-muted sticky top-0">
                                    <tr>
                                        <th className="text-left p-2 font-medium">Nome</th>
                                        <th className="text-left p-2 font-medium">Data Nasc.</th>
                                        <th className="text-left p-2 font-medium">Observações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.map((aluno, index) => (
                                        <tr key={index} className="border-t">
                                            <td className="p-2">{aluno.nome}</td>
                                            <td className="p-2 text-muted-foreground">
                                                {aluno.data_nascimento || '-'}
                                            </td>
                                            <td className="p-2 text-muted-foreground text-xs">
                                                {aluno.observacoes || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="flex gap-2 pt-2">
                    <Button
                        onClick={handleImport}
                        disabled={preview.length === 0 || importando}
                        className="gap-2"
                    >
                        {importando ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Importando...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Importar {preview.length} Aluno(s)
                            </>
                        )}
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
