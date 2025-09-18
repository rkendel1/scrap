-- Migration: Create forms table for storing extracted website data
-- Created: 2024-01-01

CREATE TABLE IF NOT EXISTS forms (
    id SERIAL PRIMARY KEY,
    url VARCHAR(2048) NOT NULL,
    title VARCHAR(512),
    description TEXT,
    favicon VARCHAR(512),
    
    -- Design Tokens
    color_palette JSONB DEFAULT '[]'::jsonb,
    primary_colors JSONB DEFAULT '[]'::jsonb,
    color_usage JSONB DEFAULT '{}'::jsonb,
    
    -- Typography
    font_families JSONB DEFAULT '[]'::jsonb,
    headings JSONB DEFAULT '[]'::jsonb,
    text_samples JSONB DEFAULT '[]'::jsonb,
    
    -- Spacing & Layout
    margins JSONB DEFAULT '[]'::jsonb,
    paddings JSONB DEFAULT '[]'::jsonb,
    spacing_scale JSONB DEFAULT '[]'::jsonb,
    layout_structure JSONB DEFAULT '{}'::jsonb,
    grid_system JSONB DEFAULT '{}'::jsonb,
    breakpoints JSONB DEFAULT '[]'::jsonb,
    
    -- Components
    buttons JSONB DEFAULT '[]'::jsonb,
    form_fields JSONB DEFAULT '[]'::jsonb,
    cards JSONB DEFAULT '[]'::jsonb,
    navigation JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    
    -- CSS Variables and Raw CSS
    css_variables JSONB DEFAULT '{}'::jsonb,
    raw_css TEXT,
    
    -- Form Schema (extracted forms structure)
    form_schema JSONB DEFAULT '[]'::jsonb,
    
    -- Branding & Metadata
    logo_url VARCHAR(512),
    brand_colors JSONB DEFAULT '[]'::jsonb,
    icons JSONB DEFAULT '[]'::jsonb,
    messaging JSONB DEFAULT '[]'::jsonb,
    
    -- Preview HTML (sample of extracted content)
    preview_html TEXT,
    
    -- Voice & Tone Analysis
    voice_tone JSONB DEFAULT '{}'::jsonb,
    personality_traits JSONB DEFAULT '[]'::jsonb,
    audience_analysis JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_forms_url ON forms(url);
CREATE INDEX IF NOT EXISTS idx_forms_created_at ON forms(created_at);
CREATE INDEX IF NOT EXISTS idx_forms_title ON forms(title);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_forms_updated_at 
    BEFORE UPDATE ON forms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();