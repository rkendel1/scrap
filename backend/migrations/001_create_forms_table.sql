CREATE TABLE IF NOT EXISTS forms (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    guest_token_id INTEGER REFERENCES guest_tokens(id) ON DELETE SET NULL,
    url VARCHAR(2048) NOT NULL,
    form_name VARCHAR(255),
    form_description TEXT,
    embed_code VARCHAR(255) UNIQUE,
    submissions_count INTEGER DEFAULT 0,
    last_submission_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Extracted Metadata
    title TEXT,
    description TEXT,
    favicon TEXT,

    -- Design Tokens (JSONB for flexibility)
    color_palette JSONB DEFAULT '[]'::jsonb,
    primary_colors JSONB DEFAULT '[]'::jsonb,
    color_usage JSONB DEFAULT '{}'::jsonb,
    font_families JSONB DEFAULT '[]'::jsonb,
    headings JSONB DEFAULT '[]'::jsonb,
    text_samples JSONB DEFAULT '[]'::jsonb,
    margins JSONB DEFAULT '[]'::jsonb,
    paddings JSONB DEFAULT '[]'::jsonb,
    spacing_scale JSONB DEFAULT '[]'::jsonb,
    layout_structure JSONB DEFAULT '{}'::jsonb,
    grid_system JSONB DEFAULT '{}'::jsonb,
    breakpoints JSONB DEFAULT '[]'::jsonb,
    buttons JSONB DEFAULT '[]'::jsonb,
    form_fields JSONB DEFAULT '[]'::jsonb,
    cards JSONB DEFAULT '[]'::jsonb,
    navigation JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    css_variables JSONB DEFAULT '{}'::jsonb,
    raw_css TEXT,
    logo_url TEXT,
    brand_colors JSONB DEFAULT '[]'::jsonb,
    icons JSONB DEFAULT '[]'::jsonb,
    messaging JSONB DEFAULT '[]'::jsonb,
    preview_html TEXT,

    -- Voice Analysis (JSONB for flexibility)
    voice_tone JSONB DEFAULT '{}'::jsonb,
    personality_traits JSONB DEFAULT '[]'::jsonb,
    audience_analysis JSONB DEFAULT '{}'::jsonb,
    
    extracted_at TIMESTAMP WITH TIME ZONE,

    -- Embed Security
    allowed_domains TEXT[] DEFAULT '{}'::TEXT[],
    
    -- Connectors (JSONB array of connector configurations)
    connectors JSONB DEFAULT '[]'::jsonb
);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms (user_id);
CREATE INDEX IF NOT EXISTS idx_forms_embed_code ON forms (embed_code);
CREATE INDEX IF NOT EXISTS idx_forms_created_at ON forms (created_at DESC);

-- Trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_forms_updated_at
BEFORE UPDATE ON forms
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();