-- ============================================
-- MIGRAÇÃO 004: Storage Bucket para Registros
-- Data: 2024-12
-- Descrição: Cria bucket 'registros' para fotos, vídeos e áudios
-- ============================================

-- Criar bucket 'registros' (público para leitura)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'registros',
    'registros',
    true, -- Público para visualização
    52428800, -- 50MB limite
    ARRAY[
        -- Imagens
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/heic',
        'image/heif',
        -- Vídeos
        'video/mp4',
        'video/quicktime',
        'video/webm',
        'video/3gpp',
        -- Áudios
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/webm',
        'audio/m4a',
        'audio/aac'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- POLÍTICAS DE STORAGE
-- ============================================

-- Policy: Usuários autenticados podem fazer upload
CREATE POLICY "registros_insert_policy" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'registros');

-- Policy: Usuários podem ver seus próprios arquivos e arquivos públicos
CREATE POLICY "registros_select_policy" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'registros');

-- Policy: Usuários podem atualizar seus próprios arquivos
CREATE POLICY "registros_update_policy" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'registros' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Usuários podem deletar seus próprios arquivos
CREATE POLICY "registros_delete_policy" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'registros' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- NOTA: A estrutura de pastas será:
-- registros/{user_id}/{tipo}/{timestamp}.{ext}
-- Exemplo: registros/abc123/foto/1702123456789.jpg
-- ============================================
