-- Create form_versions table
CREATE TABLE IF NOT EXISTS form_versions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    generated_form JSONB NOT NULL, -- Stores the full generated form config (fields, styling, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_live BOOLEAN DEFAULT FALSE, -- Is this version currently live?
    is_draft BOOLEAN DEFAULT TRUE, -- Is this version the current draft?
    UNIQUE (form_id, version_number)
);

-- Add columns to forms table to reference live and draft versions
ALTER TABLE forms
ADD COLUMN IF NOT EXISTS live_version_id INTEGER REFERENCES form_versions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS draft_version_id INTEGER REFERENCES form_versions(id) ON DELETE SET NULL;

-- Remove old columns if they exist (e.g., 'is_live', 'generated_form')
-- These ALTER TABLE statements are idempotent, meaning they won't error if the column doesn't exist.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='forms' AND column_name='is_live') THEN
        ALTER TABLE forms DROP COLUMN is_live;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='forms' AND column_name='generated_form') THEN
        ALTER TABLE forms DROP COLUMN generated_form;
    END IF;
END $$;

-- Create embed_codes table (if not already created by 001, ensure it exists and links to forms)
CREATE TABLE IF NOT EXISTS embed_codes (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    code VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    submission_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE
);

-- Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    embed_code_id INTEGER REFERENCES embed_codes(id) ON DELETE SET NULL,
    submission_data JSONB NOT NULL,
    submitted_from_url TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create form_submission_rate_limits table
CREATE TABLE IF NOT EXISTS form_submission_rate_limits (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    domain VARCHAR(255),
    submission_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(form_id, ip_address, domain)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_form_versions_form_id ON form_versions (form_id);
CREATE INDEX IF NOT EXISTS idx_embed_codes_form_id ON embed_codes (form_id);
CREATE INDEX IF NOT EXISTS idx_embed_codes_code ON embed_codes (code);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions (form_id);
CREATE INDEX IF NOT EXISTS idx_form_submission_rate_limits_form_id_ip_domain ON form_submission_rate_limits (form_id, ip_address, domain);