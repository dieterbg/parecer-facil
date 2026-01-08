-- Migration: Add AI-related columns to registros table
-- Run this in Supabase SQL Editor

-- Add transcription column for audio recordings
ALTER TABLE registros ADD COLUMN IF NOT EXISTS transcricao_voz TEXT;

-- Add BNCC tags array for automatic categorization
ALTER TABLE registros ADD COLUMN IF NOT EXISTS tags_bncc TEXT[];

-- Add AI metadata for detailed analysis results
ALTER TABLE registros ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}';

-- Add index for faster BNCC tag searches
CREATE INDEX IF NOT EXISTS idx_registros_tags_bncc ON registros USING GIN (tags_bncc);

-- Comment the new columns
COMMENT ON COLUMN registros.transcricao_voz IS 'AI-generated transcription of audio recordings';
COMMENT ON COLUMN registros.tags_bncc IS 'Array of BNCC field tags (e.g., EI-EO, EI-CG, EI-TS, EI-EF, EI-ET)';
COMMENT ON COLUMN registros.ai_metadata IS 'JSON with AI analysis details: confidence scores, detected activities, emotions, etc.';
