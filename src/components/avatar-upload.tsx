"use client";

import { useState, useRef } from "react";
import { supabase } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Upload } from "lucide-react";

interface AvatarUploadProps {
    uid: string;
    url: string | null;
    onUpload: (url: string) => void;
    editable?: boolean;
}

export function AvatarUpload({ uid, url, onUpload, editable = true }: AvatarUploadProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${uid}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("Arquivo muito grande. Máximo 5MB.");
                return;
            }

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            onUpload(publicUrl);

        } catch (error: any) {
            console.error("Erro no upload:", error);
            alert("Erro ao fazer upload da imagem.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                    <AvatarImage src={url || ""} alt="Avatar" className="object-cover" />
                    <AvatarFallback className="text-4xl bg-muted">
                        {/* Fallback icon or initial */}
                        <Camera className="w-12 h-12 text-muted-foreground opacity-50" />
                    </AvatarFallback>
                </Avatar>

                {editable && (
                    <div className="absolute bottom-0 right-0">
                        <Button
                            size="icon"
                            variant="secondary"
                            className="rounded-full shadow-lg h-10 w-10 border border-border"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Camera className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                )}
            </div>

            <input
                type="file"
                className="hidden"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={uploading}
            />
            {editable && (
                <p className="text-xs text-muted-foreground">
                    Clique para alterar a foto
                </p>
            )}
        </div>
    );
}
