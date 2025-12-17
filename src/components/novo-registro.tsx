"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Video, Mic, FileText, Loader2, X, Upload } from "lucide-react";
import { useRegistros } from "@/hooks/use-registros";

interface NovoRegistroProps {
    turmaId: string;
    alunos: { id: string; nome: string }[];
    currentWeek?: Date; // Segunda-feira da semana atual
    atividade?: { id: string; titulo: string; dia_semana: number }; // Atividade vinculada (opcional)
    onSuccess: () => void;
    onCancel: () => void;
}

type TipoRegistro = 'foto' | 'video' | 'audio' | 'texto';

const DIAS_SEMANA_CURTO = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];

export function NovoRegistro({ turmaId, alunos, currentWeek, atividade, onSuccess, onCancel }: NovoRegistroProps) {
    const [tipo, setTipo] = useState<TipoRegistro | null>(null);
    const [arquivo, setArquivo] = useState<File | null>(null);
    const [descricao, setDescricao] = useState("");
    const [isEvidencia, setIsEvidencia] = useState(false);
    const [alunosSelecionados, setAlunosSelecionados] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [dataRegistro, setDataRegistro] = useState(() => new Date().toISOString().split('T')[0]);

    const { createRegistro, uploadArquivo } = useRegistros();

    // Pre-preencher data quando registro é para uma atividade específica
    useEffect(() => {
        if (atividade && currentWeek) {
            const dataDia = new Date(currentWeek);
            dataDia.setDate(dataDia.getDate() + (atividade.dia_semana - 1));
            setDataRegistro(dataDia.toISOString().split('T')[0]);
        }
    }, [atividade, currentWeek]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setArquivo(file);

        // Criar preview para imagens
        if (tipo === 'foto' && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleAluno = (alunoId: string) => {
        setAlunosSelecionados(prev =>
            prev.includes(alunoId)
                ? prev.filter(id => id !== alunoId)
                : [...prev, alunoId]
        );
    };

    const handleSubmit = async () => {
        if (!tipo) return;
        if (tipo !== 'texto' && !arquivo) {
            alert('Por favor, selecione um arquivo.');
            return;
        }
        if (alunosSelecionados.length === 0) {
            alert('Por favor, selecione pelo menos um aluno.');
            return;
        }

        setUploading(true);
        try {
            let urlArquivo: string | undefined = undefined;

            // Upload do arquivo se não for texto
            if (tipo !== 'texto' && arquivo) {
                try {
                    urlArquivo = await uploadArquivo(arquivo, tipo);
                } catch (error) {
                    console.error('Erro no upload:', error);
                    alert('Erro ao fazer upload do arquivo. Verifique se é uma imagem/vídeo válido.');
                    setUploading(false);
                    return;
                }
            }

            // Criar registro usando o hook
            await createRegistro({
                tipo,
                url_arquivo: urlArquivo ?? undefined,
                descricao: descricao || null,
                is_evidencia: isEvidencia,
                data_registro: dataRegistro,
            }, alunosSelecionados);

            alert('Registro criado com sucesso!');
            onSuccess();
        } catch (error) {
            console.error('Erro ao criar registro:', error);
            alert('Erro ao criar registro. Tente novamente.');
        } finally {
            setUploading(false);
        }
    };

    const getAcceptedTypes = () => {
        switch (tipo) {
            case 'foto': return 'image/*';
            case 'video': return 'video/*';
            case 'audio': return 'audio/*';
            default: return '';
        }
    };

    if (!tipo) {
        return (
            <Card className="bg-muted/50">
                <CardContent className="pt-6">
                    {/* Banner de atividade vinculada */}
                    {atividade && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                            <span className="text-blue-600">📋</span>
                            <div className="text-sm">
                                <span className="text-blue-800 font-medium">Registro para: </span>
                                <span className="text-blue-700">{atividade.titulo}</span>
                            </div>
                        </div>
                    )}
                    <p className="text-sm text-muted-foreground mb-4">Escolha o tipo de registro:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setTipo('foto')}>
                            <Camera className="w-6 h-6" />
                            <span className="text-sm">Foto</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setTipo('video')}>
                            <Video className="w-6 h-6" />
                            <span className="text-sm">Vídeo</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setTipo('audio')}>
                            <Mic className="w-6 h-6" />
                            <span className="text-sm">Áudio</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setTipo('texto')}>
                            <FileText className="w-6 h-6" />
                            <span className="text-sm">Nota</span>
                        </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={onCancel}>
                        Cancelar
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-muted/50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        {tipo === 'foto' && <Camera className="w-5 h-5" />}
                        {tipo === 'video' && <Video className="w-5 h-5" />}
                        {tipo === 'audio' && <Mic className="w-5 h-5" />}
                        {tipo === 'texto' && <FileText className="w-5 h-5" />}
                        Novo Registro - {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setTipo(null)}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Upload de arquivo */}
                {tipo !== 'texto' && (
                    <div>
                        <label className="text-sm font-medium mb-2 block">Arquivo *</label>
                        <label className="block">
                            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors">
                                {previewUrl && tipo === 'foto' ? (
                                    <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded mb-2" />
                                ) : (
                                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                )}
                                <p className="text-sm font-medium">
                                    {arquivo ? arquivo.name : `Clique para selecionar ${tipo}`}
                                </p>
                            </div>
                            <input
                                type="file"
                                accept={getAcceptedTypes()}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                )}

                {/* Data do Registro - Botões da semana */}
                <div>
                    <label className="text-sm font-medium mb-2 block">📅 Dia do Registro</label>
                    {currentWeek ? (
                        <div className="grid grid-cols-5 gap-2">
                            {DIAS_SEMANA_CURTO.map((dia, index) => {
                                const data = new Date(currentWeek);
                                data.setDate(data.getDate() + index);
                                const dataStr = data.toISOString().split('T')[0];
                                const diaFormatado = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                                return (
                                    <button
                                        key={dia}
                                        type="button"
                                        onClick={() => setDataRegistro(dataStr)}
                                        className={`p-2 rounded-lg border text-center transition-all ${dataRegistro === dataStr
                                            ? 'ring-2 ring-primary bg-primary text-primary-foreground'
                                            : 'hover:bg-accent/50'
                                            }`}
                                    >
                                        <div className="font-medium text-sm">{dia}</div>
                                        <div className="text-xs opacity-80">{diaFormatado}</div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <Input
                            type="date"
                            value={dataRegistro}
                            onChange={(e) => setDataRegistro(e.target.value)}
                            className="w-full"
                        />
                    )}
                </div>

                {/* Descrição */}
                <div>
                    <label className="text-sm font-medium mb-2 block">
                        {tipo === 'texto' ? 'Nota *' : 'Descrição (opcional)'}
                    </label>
                    <Textarea
                        placeholder={tipo === 'texto' ? 'Escreva sua observação...' : 'Adicione uma descrição...'}
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        rows={tipo === 'texto' ? 6 : 3}
                        required={tipo === 'texto'}
                    />

                    <div className="flex items-center space-x-2 mt-2">
                        <input
                            type="checkbox"
                            id="isEvidencia"
                            checked={isEvidencia}
                            onChange={(e) => setIsEvidencia(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                            htmlFor="isEvidencia"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Marcar como evidência de desenvolvimento 🌟
                        </label>
                    </div>
                </div>

                {/* Seleção de alunos */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Alunos envolvidos *</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setAlunosSelecionados(alunos.map(a => a.id))}
                                className="text-xs text-primary hover:underline"
                            >
                                Selecionar Todos
                            </button>
                            <span className="text-muted-foreground">|</span>
                            <button
                                type="button"
                                onClick={() => setAlunosSelecionados([])}
                                className="text-xs text-muted-foreground hover:underline"
                            >
                                Limpar
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                        {alunos.map((aluno) => (
                            <label
                                key={aluno.id}
                                className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-2 rounded"
                            >
                                <input
                                    type="checkbox"
                                    checked={alunosSelecionados.includes(aluno.id)}
                                    onChange={() => toggleAluno(aluno.id)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">{aluno.nome}</span>
                            </label>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {alunosSelecionados.length} aluno(s) selecionado(s)
                    </p>
                </div>

                {/* Botões */}
                <div className="flex gap-2 pt-2">
                    <Button onClick={handleSubmit} disabled={uploading} className="gap-2">
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            'Salvar Registro'
                        )}
                    </Button>
                    <Button variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
