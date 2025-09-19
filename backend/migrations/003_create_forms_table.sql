CREATE TABLE IF NOT EXISTS forms (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    guest_token_id INTEGER REFERENCES guest_tokens(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    form_name VARCHAR(255) NOT NULL,
    form_description TEXT,
    embed_code VARCHAR(255) UNIQUE NOT NULL,
    submissions_count INTEGER DEFAULT 0,
    last_submission_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Design token and voice analysis fields (from ExtractedData)
    title TEXT,
    description TEXT,
    favicon TEXT,
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
    form_schema JSONB DEFAULT '[]'::jsonb, -- Added form_schema column
    logo_url TEXT,
    brand_colors JSONB DEFAULT '[]'::jsonb,
    icons JSONB DEFAULT '[]'::jsonb,
    messaging JSONB DEFAULT '[]'::jsonb,
    preview_html TEXT,
    voice_tone JSONB DEFAULT '{}'::jsonb,
    personality_traits JSONB DEFAULT '[]'::jsonb,
    audience_analysis JSONB DEFAULT '{}'::jsonb,
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- SaaS specific fields
    live_version_id INTEGER, -- References form_versions(id)
    draft_version_id INTEGER, -- References form_versions(id)
    allowed_domains TEXT[] DEFAULT '{}',
    connectors JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
CREATE INDEX IF NOT EXISTS idx_forms_guest_token_id ON forms(guest_token_id);
CREATE INDEX IF NOT EXISTS idx_forms_embed_code ON forms(embed_code);

-- Add trigger to update 'updated_at' timestamp
CREATE OR REPLACE TRIGGER update_forms_updated_at
BEFORE UPDATE ON forms
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();