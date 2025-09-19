CREATE TABLE IF NOT EXISTS connectors (
    id SERIAL PRIMARY KEY,
    type VARCHAR(255) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    icon TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    config_schema JSONB NOT NULL, -- JSON schema for connector settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Populate with initial connector definitions
INSERT INTO connectors (type, label, description, icon, is_premium, config_schema) VALUES
('email', 'Email Notifications', 'Send form submissions via email', '📧', FALSE, '{
    "to": {"type": "email", "required": true, "label": "To Email"},
    "subject": {"type": "text", "required": false, "label": "Email Subject"},
    "template": {"type": "textarea", "required": false, "label": "Email Template"}
}'),
('slack', 'Slack Notifications', 'Send form submissions to Slack channels', '💬', FALSE, '{
    "webhookUrl": {"type": "url", "required": true, "label": "Webhook URL"},
    "channel": {"type": "text", "required": false, "label": "Channel"},
    "template": {"type": "textarea", "required": false, "label": "Message Template"}
}'),
('googleSheets', 'Google Sheets', 'Add form submissions as rows in Google Sheets', '📊', FALSE, '{
    "spreadsheetId": {"type": "text", "required": true, "label": "Spreadsheet ID"},
    "sheetName": {"type": "text", "required": false, "label": "Sheet Name"}
}'),
('n8n', 'n8n Workflow Automation', 'Route form submissions through n8n workflows for advanced automation and customer-specific routing', '🔄', FALSE, '{
    "webhookUrl": {"type": "url", "required": true, "label": "n8n Webhook URL"},
    "customerId": {"type": "text", "required": false, "label": "Customer ID"},
    "workflowId": {"type": "text", "required": false, "label": "Workflow ID"},
    "authToken": {"type": "password", "required": false, "label": "Authorization Token"}
}')
ON CONFLICT (type) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    is_premium = EXCLUDED.is_premium,
    config_schema = EXCLUDED.config_schema,
    updated_at = CURRENT_TIMESTAMP;

-- Trigger for updated_at timestamp on connectors
CREATE OR REPLACE TRIGGER update_connectors_updated_at
BEFORE UPDATE ON connectors
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();