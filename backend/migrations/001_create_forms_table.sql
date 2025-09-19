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

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'free' NOT NULL, -- 'free', 'paid'
    subscription_status VARCHAR(50) DEFAULT 'active' NOT NULL, -- 'active', 'inactive', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS guest_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    associated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS embed_codes (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    code VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255), -- Optional domain restriction for this specific embed code
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    submission_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    embed_code_id INTEGER REFERENCES embed_codes(id) ON DELETE SET NULL,
    submission_data JSONB NOT NULL,
    submitted_from_url VARCHAR(2048),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS form_submission_rate_limits (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    domain VARCHAR(255),
    submission_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(form_id, ip_address, domain)
);

CREATE TABLE IF NOT EXISTS connectors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(255) NOT NULL UNIQUE,
    is_premium BOOLEAN DEFAULT FALSE,
    config_schema JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS form_connectors (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    connector_id INTEGER REFERENCES connectors(id) ON DELETE CASCADE,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (form_id, connector_id)
);

-- Function to update 'updated_at' column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic 'updated_at' updates
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_forms_updated_at') THEN
        CREATE TRIGGER update_forms_updated_at
        BEFORE UPDATE ON forms
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_form_connectors_updated_at') THEN
        CREATE TRIGGER update_form_connectors_updated_at
        BEFORE UPDATE ON form_connectors
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert default connectors (updated types to match frontend normalization and added Zapier)
INSERT INTO connectors (name, type, is_premium, config_schema) VALUES
('Email Notifications', 'email', FALSE, '{}'),
('Slack Notifications', 'slack', FALSE, '{}'),
('Google Sheets', 'googlesheets', FALSE, '{}'), -- Changed type to 'googlesheets'
('Generic Webhook', 'webhook', FALSE, '{}'),
('HubSpot', 'hubspot', TRUE, '{}'),
('Salesforce', 'salesforce', TRUE, '{}'),
('Notion', 'notion', TRUE, '{}'),
('Microsoft Teams', 'teams', TRUE, '{}'),
('Zendesk', 'zendesk', TRUE, '{}'),
('Zapier', 'zapier', TRUE, '{}') -- Added Zapier connector
ON CONFLICT (type) DO UPDATE SET 
    name = EXCLUDED.name, 
    is_premium = EXCLUDED.is_premium, 
    config_schema = EXCLUDED.config_schema, 
    updated_at = CURRENT_TIMESTAMP;