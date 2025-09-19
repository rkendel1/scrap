-- Create the connectors table
CREATE TABLE IF NOT EXISTS connectors (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(20), -- For storing emoji or simple icon string
    is_premium BOOLEAN DEFAULT FALSE,
    config_schema JSONB NOT NULL, -- Stores the fields definition
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Populate with initial connector definitions
INSERT INTO connectors (type, label, description, icon, is_premium, config_schema) VALUES
('email', 'Email Notifications', 'Send form submissions via email', '📧', FALSE, '[
  {"name": "to", "label": "To Email", "type": "email", "required": true, "placeholder": "recipient@example.com", "description": "Email address to receive form submissions"},
  {"name": "subject", "label": "Email Subject", "type": "text", "required": false, "placeholder": "New Form Submission", "description": "Subject line for the email notification"},
  {"name": "template", "label": "Email Template", "type": "textarea", "required": false, "placeholder": "New submission from {{name}} ({{email}}): {{message}}", "description": "Custom email template. Use {{fieldName}} for dynamic values"}
]'),
('slack', 'Slack Notifications', 'Send form submissions to Slack channels', '💬', FALSE, '[
  {"name": "webhookUrl", "label": "Webhook URL", "type": "url", "required": true, "placeholder": "https://hooks.slack.com/services/...", "description": "Slack webhook URL for your channel"},
  {"name": "channel", "label": "Channel", "type": "text", "required": false, "placeholder": "#notifications", "description": "Target Slack channel (optional)"},
  {"name": "template", "label": "Message Template", "type": "textarea", "required": false, "placeholder": "🚀 New lead: {{name}} from {{company}} - {{email}}", "description": "Custom message template. Use {{fieldName}} for dynamic values"}
]'),
('googlesheets', 'Google Sheets', 'Add form submissions as rows in Google Sheets', '📊', FALSE, '[
  {"name": "spreadsheetId", "label": "Spreadsheet ID", "type": "text", "required": true, "placeholder": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms", "description": "Google Sheets spreadsheet ID from the URL"},
  {"name": "sheetName", "label": "Sheet Name", "type": "text", "required": false, "placeholder": "Sheet1", "description": "Name of the specific sheet tab (defaults to Sheet1)"}
]'),
('webhook', 'Generic Webhook', 'Send form submissions to any custom webhook URL', '🔗', FALSE, '[
  {"name": "url", "label": "Webhook URL", "type": "url", "required": true, "placeholder": "https://api.yourdomain.com/webhook", "description": "The URL where the form data will be sent"},
  {"name": "method", "label": "HTTP Method", "type": "select", "required": false, "options": ["POST", "GET", "PUT", "PATCH"], "placeholder": "POST", "description": "HTTP method to use for the webhook request (defaults to POST)"},
  {"name": "headers", "label": "Custom Headers (JSON)", "type": "textarea", "required": false, "placeholder": "{\"Authorization\": \"Bearer your_token\", \"X-Custom-Header\": \"value\"}", "description": "Optional custom headers in JSON format"}
]'),
('zapier', 'Zapier Webhook', 'Send form submissions to a Zapier Catch Hook', '⚡', TRUE, '[
  {"name": "webhookUrl", "label": "Zapier Catch Hook URL", "type": "url", "required": true, "placeholder": "https://hooks.zapier.com/hooks/catch/...", "description": "The URL of your Zapier Catch Hook"}
]');

-- Add the 'connectors' JSONB column to the 'forms' table if it doesn't exist
-- This column will store an array of connector configurations for a form
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='forms' AND column_name='connectors') THEN
        ALTER TABLE forms ADD COLUMN connectors JSONB DEFAULT '[]'::JSONB;
    END IF;
END
$$;

-- Drop the form_connectors table if it exists, as it's being replaced by forms.connectors JSONB column
-- This is a destructive change, but necessary for consistency.
DROP TABLE IF EXISTS form_connectors;