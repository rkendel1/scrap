-- Migration: Modify forms table for SaaS features
-- Created: 2024-01-03

-- Add user and SaaS-related columns to forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS guest_token_id INTEGER REFERENCES guest_tokens(id) ON DELETE SET NULL;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS embed_code VARCHAR(255) UNIQUE;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS form_name VARCHAR(255);
ALTER TABLE forms ADD COLUMN IF NOT EXISTS form_description TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS submissions_count INTEGER DEFAULT 0;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS last_submission_at TIMESTAMP WITH TIME ZONE;

-- Create embed codes table for tracking form embeds and analytics
CREATE TABLE IF NOT EXISTS embed_codes (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    code VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    submission_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE
);

-- Create form submissions table
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

-- Create connectors table for different integrations
CREATE TABLE IF NOT EXISTS connectors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'email', 'google_sheets', 'slack', 'notion', 'hubspot', 'salesforce'
    is_premium BOOLEAN DEFAULT FALSE,
    config_schema JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default connectors
INSERT INTO connectors (name, type, is_premium, config_schema) VALUES
('Email Notifications', 'email', FALSE, '{"fields": [{"name": "to_email", "type": "email", "required": true}, {"name": "subject", "type": "text", "required": true}]}'),
('Google Sheets', 'google_sheets', FALSE, '{"fields": [{"name": "sheet_id", "type": "text", "required": true}, {"name": "worksheet_name", "type": "text", "required": false}]}'),
('Slack', 'slack', TRUE, '{"fields": [{"name": "webhook_url", "type": "url", "required": true}, {"name": "channel", "type": "text", "required": false}]}'),
('Notion', 'notion', TRUE, '{"fields": [{"name": "database_id", "type": "text", "required": true}, {"name": "api_key", "type": "password", "required": true}]}'),
('HubSpot', 'hubspot', TRUE, '{"fields": [{"name": "api_key", "type": "password", "required": true}, {"name": "form_id", "type": "text", "required": true}]}'),
('Salesforce', 'salesforce', TRUE, '{"fields": [{"name": "username", "type": "email", "required": true}, {"name": "password", "type": "password", "required": true}, {"name": "security_token", "type": "password", "required": true}]}');

-- Create form connectors junction table
CREATE TABLE IF NOT EXISTS form_connectors (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    connector_id INTEGER REFERENCES connectors(id) ON DELETE CASCADE,
    config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(form_id, connector_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
CREATE INDEX IF NOT EXISTS idx_forms_guest_token_id ON forms(guest_token_id);
CREATE INDEX IF NOT EXISTS idx_forms_embed_code ON forms(embed_code);
CREATE INDEX IF NOT EXISTS idx_forms_is_live ON forms(is_live);
CREATE INDEX IF NOT EXISTS idx_embed_codes_form_id ON embed_codes(form_id);
CREATE INDEX IF NOT EXISTS idx_embed_codes_code ON embed_codes(code);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_embed_code_id ON form_submissions(embed_code_id);
CREATE INDEX IF NOT EXISTS idx_form_connectors_form_id ON form_connectors(form_id);
CREATE INDEX IF NOT EXISTS idx_form_connectors_connector_id ON form_connectors(connector_id);