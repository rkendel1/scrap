CREATE TABLE IF NOT EXISTS forms (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    guest_token_id INTEGER REFERENCES guest_tokens(id) ON DELETE SET NULL,
    url VARCHAR(2048) NOT NULL,
    form_name VARCHAR(255),
    form_description TEXT,
    is_live BOOLEAN DEFAULT FALSE,
    embed_code VARCHAR(255) UNIQUE,
    submissions_count INTEGER DEFAULT 0,
    last_submission_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Extracted Design Tokens
    title VARCHAR(255),
    description TEXT,
    favicon VARCHAR(2048),
    color_palette JSONB DEFAULT '[]',
    primary_colors JSONB DEFAULT '[]',
    color_usage JSONB DEFAULT '{}',
    font_families JSONB DEFAULT '[]',
    headings JSONB DEFAULT '[]',
    text_samples JSONB DEFAULT '[]',
    margins JSONB DEFAULT '[]',
    paddings JSONB DEFAULT '[]',
    spacing_scale JSONB DEFAULT '[]',
    layout_structure JSONB DEFAULT '{}',
    grid_system JSONB DEFAULT '{}',
    breakpoints JSONB DEFAULT '[]',
    buttons JSONB DEFAULT '[]',
    form_fields JSONB DEFAULT '[]',
    cards JSONB DEFAULT '[]',
    navigation JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]',
    css_variables JSONB DEFAULT '{}',
    raw_css TEXT,
    form_schema JSONB DEFAULT '[]', -- Stores the generated form structure
    logo_url VARCHAR(2048),
    brand_colors JSONB DEFAULT '[]',
    icons JSONB DEFAULT '[]',
    messaging JSONB DEFAULT '[]',
    preview_html TEXT,
    -- Voice Analysis
    voice_tone JSONB DEFAULT '{}',
    personality_traits JSONB DEFAULT '[]',
    audience_analysis JSONB DEFAULT '{}',
    extracted_at TIMESTAMP WITH TIME ZONE,
    -- SaaS specific fields
    allowed_domains TEXT[] DEFAULT '{}', -- Domains allowed to embed this form
    connectors JSONB DEFAULT '[]' -- Stores configured connectors for this form
);

-- Add a trigger to update the updated_at column automatically for the forms table
CREATE OR REPLACE TRIGGER update_forms_updated_at
BEFORE UPDATE ON forms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();