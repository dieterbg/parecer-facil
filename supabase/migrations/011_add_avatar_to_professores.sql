-- Adiciona coluna avatar_url na tabela professores
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professores' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.professores ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Criar bucket 'avatars' (público para leitura)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true, -- Público para visualização
    5242880, -- 5MB limite
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas de Storage para Avatars

-- Policy: Select público
DROP POLICY IF EXISTS "avatars_select_policy" ON storage.objects;
CREATE POLICY "avatars_select_policy" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'avatars');

-- Policy: Insert (Upload) autenticado
DROP POLICY IF EXISTS "avatars_insert_policy" ON storage.objects;
CREATE POLICY "avatars_insert_policy" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

-- Policy: Update (Atualizar próprio avatar)
DROP POLICY IF EXISTS "avatars_update_policy" ON storage.objects;
CREATE POLICY "avatars_update_policy" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

-- Policy: Delete (Deletar próprio avatar)
DROP POLICY IF EXISTS "avatars_delete_policy" ON storage.objects;
CREATE POLICY "avatars_delete_policy" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'avatars');
