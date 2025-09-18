-- Create the users table first, as other tables depend on it
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

-- Create guest_tokens table, which references users
CREATE TABLE IF NOT EXISTS guest_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    associated_at TIMESTAMP WITH TIME ZONE
);

-- Now create the forms table, which references users and guest_tokens
CREATE TABLE IF NOT EXISTS forms (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    guest_token_id INTEGER REFERENCES guest_tokens(id) ON DELETE SET NULL,
    url VARCHAR(2048) NOT NULL,
    form_name VARCHAR(255) NOT NULL,
    form_description TEXT,
    is_live BOOLEAN DEFAULT FALSE,
    embed_code VARCHAR(255) UNIQUE, -- Unique embed code for public access
    submissions_count INTEGER DEFAULT 0,
    last_submission_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Original design token fields
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
    form_schema JSONB DEFAULT '[]', -- Stores the AI-generated form structure
    logo_url VARCHAR(2048),
    brand_colors JSONB DEFAULT '[]',
    icons JSONB DEFAULT '[]',
    messaging JSONB DEFAULT '[]',
    preview_html TEXT,
    voice_tone JSONB DEFAULT '{}',
    personality_traits JSONB DEFAULT '[]',
    audience_analysis JSONB DEFAULT '{}',
    extracted_at TIMESTAMP WITH TIME ZONE,
    allowed_domains TEXT[] DEFAULT '{}', -- For secure embed domain whitelisting
    connectors JSONB DEFAULT '[]' -- New column for storing connector configurations
);

-- Create embed_codes table, which references forms
CREATE TABLE IF NOT EXISTS embed_codes (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    code VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    submission_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create form_submissions table, which references forms and embed_codes
CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    embed_code_id INTEGER REFERENCES embed_codes(id) ON DELETE SET NULL,
    submission_data JSONB NOT NULL,
    submitted_from_url VARCHAR(2048),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create connectors table (for defining available connector types)
CREATE TABLE IF NOT EXISTS connectors (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'email', 'slack', 'googleSheets'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    config_schema JSONB DEFAULT '{}' -- JSON schema for connector configuration
);

-- Insert default connector definitions if they don't exist
INSERT INTO connectors (type, name, description, is_premium, config_schema) VALUES
('email', 'Email Notifications', 'Send form submissions via email', FALSE, '{
  "to": {"type": "string", "format": "email", "description": "Recipient email address"},
  "subject": {"type": "string", "description": "Email subject line"},
  "template": {"type": "string", "description": "Custom email template with {{fieldName}} placeholders"}
}') ON CONFLICT (type) DO NOTHING;

INSERT INTO connectors (type, name, description, is_premium, config_schema) VALUES
('slack', 'Slack Notifications', 'Send form submissions to Slack channels', FALSE, '{
  "webhookUrl": {"type": "string", "format": "url", "description": "Slack webhook URL"},
  "channel": {"type": "string", "description": "Target Slack channel (e.g., #notifications)"},
  "template": {"type": "string", "description": "Custom message template with {{fieldName}} placeholders"}
}') ON CONFLICT (type) DO NOTHING;

INSERT INTO connectors (type, name, description, is_premium, config_schema) VALUES
('googleSheets', 'Google Sheets', 'Add form submissions as rows in Google Sheets', FALSE, '{
  "spreadsheetId": {"type": "string", "description": "Google Sheets spreadsheet ID"},
  "sheetName": {"type": "string", "description": "Name of the specific sheet tab (defaults to Sheet1)"}
}') ON CONFLICT (type) DO NOTHING;

INSERT INTO connectors (type, name, description, is_premium, config_schema) VALUES
('webhook', 'Generic Webhook', 'Send form data to any custom HTTP endpoint', FALSE, '{
  "url": {"type": "string", "format": "url", "description": "Target webhook URL"},
  "method": {"type": "string", "enum": ["POST", "GET", "PUT"], "description": "HTTP method (default: POST)"},
  "headers": {"type": "object", "description": "Custom HTTP headers as key-value pairs"}
}') ON CONFLICT (type) DO NOTHING;

INSERT INTO connectors (type, name, description, is_premium, config_schema) VALUES
('airtable', 'Airtable', 'Create records in an Airtable base', FALSE, '{
  "baseId": {"type": "string", "description": "Airtable Base ID"},
  "tableId": {"type": "string", "description": "Airtable Table ID"}
}') ON CONFLICT (type) DO NOTHING;

INSERT INTO connectors (type, name, description, is_premium, config_schema) VALUES
('hubspot', 'HubSpot', 'Create contacts or leads in HubSpot', TRUE, '{
  "portalId": {"type": "string", "description": "HubSpot Portal ID"},
  "objectType": {"type": "string", "enum": ["contact", "company", "deal"], "description": "HubSpot object type to create"}
}') ON CONFLICT (type) DO NOTHING;

INSERT INTO connectors (type, name, description, is_premium, config_schema) VALUES
('salesforce', 'Salesforce', 'Create leads or contacts in Salesforce', TRUE, '{
  "objectType": {"type": "string", "enum": ["Lead", "Contact"], "description": "Salesforce object type to create"},
  "recordTypeId": {"type": "string", "description": "Optional Salesforce Record Type ID"}
}') ON CONFLICT (type) DO NOTHING;

INSERT INTO connectors (type, name, description, is_premium, config_schema) VALUES
('notion', 'Notion', 'Add pages to a Notion database', TRUE, '{
  "databaseId": {"type": "string", "description": "Notion Database ID"}
}') ON CONFLICT (type) DO NOTHING;

INSERT INTO connectors (type, name, description, is_premium, config_schema) VALUES
('teams', 'Microsoft Teams', 'Send notifications to a Microsoft Teams channel', TRUE, '{
  "webhookUrl": {"type": "string", "format": "url", "description": "Microsoft Teams webhook URL"},
  "title": {"type": "string", "description": "Title for the Teams message"}
}') ON CONFLICT (type) DO NOTHING;

INSERT INTO connectors (type, name, description, is_premium, config_schema) VALUES
('zendesk', 'Zendesk', 'Create support tickets in Zendesk', TRUE, '{
  "subdomain": {"type": "string", "description": "Your Zendesk subdomain (e.g., yourcompany)"},
  "priority": {"type": "string", "enum": ["urgent", "high", "normal", "low"], "description": "Ticket priority"},
  "tags": {"type": "array", "items": {"type": "string"}, "description": "Tags to apply to the ticket"}
}') ON CONFLICT (type) DO NOTHING;


-- Create form_connectors table (linking forms to configured connectors)
CREATE TABLE IF NOT EXISTS form_connectors (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    connector_id INTEGER NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
    config JSONB NOT NULL DEFAULT '{}', -- Stores the specific configuration for this form-connector pair
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (form_id, connector_id) -- A form can only have one configuration per connector type
);

-- Create form_submission_rate_limits table for security features
CREATE TABLE IF NOT EXISTS form_submission_rate_limits (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    domain VARCHAR(255),
    submission_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(form_id, ip_address, domain)
);

-- Create a function to update the updated_at column (if not already created by another migration)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers to ensure they are correctly applied after table reordering
-- Trigger for forms updated_at
DROP TRIGGER IF EXISTS update_forms_updated_at ON forms;
CREATE TRIGGER update_forms_updated_at
BEFORE UPDATE ON forms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for form_connectors updated_at
DROP TRIGGER IF EXISTS update_form_connectors_updated_at ON form_connectors;
CREATE TRIGGER update_form_connectors_updated_at
BEFORE UPDATE ON form_connectors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();