-- Adicionar coluna updated_at se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pareceres' AND column_name = 'updated_at') THEN
        ALTER TABLE public.pareceres ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;
