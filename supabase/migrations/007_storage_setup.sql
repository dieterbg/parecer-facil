-- ============================================
-- MIGRAÇÃO 007: Setup Completo Storage Bucket
-- Data: 2024-12
-- Descrição: Garante criação e segurança do bucket 'registros'
-- ============================================

-- 1. Criar bucket 'registros' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'registros',
    'registros',
    true, -- Público para visualização
    52428800, -- 50MB limite
    ARRAY[
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
        'video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp',
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/aac'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Habilitar RLS (Geralmente já habilitado no Supabase, removendo para evitar erro de permissão)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas para evitar conflitos/duplicatas
DROP POLICY IF EXISTS "registros_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "registros_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "registros_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "registros_delete_policy" ON storage.objects;

-- 4. Criar novas políticas de segurança

-- Policy: Usuários autenticados podem fazer upload
-- Caminho deve ser: userId/tipo/arquivo.ext
CREATE POLICY "registros_insert_policy" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'registros' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy: Qualquer um pode ver arquivos (bucket público)
CREATE POLICY "registros_select_policy" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'registros');

-- Policy: Usuários podem atualizar seus próprios arquivos
CREATE POLICY "registros_update_policy" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'registros' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'registros' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Usuários podem deletar seus próprios arquivos
CREATE POLICY "registros_delete_policy" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'registros' AND (storage.foldername(name))[1] = auth.uid()::text);
