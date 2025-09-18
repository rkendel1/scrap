-- Migration: Add webhook connector type
-- Created: 2024-01-04

-- Insert webhook connector if it doesn't exist
INSERT INTO connectors (name, type, is_premium, config_schema) 
SELECT 'Webhook', 'webhook', FALSE, '{"fields": [{"name": "webhook_url", "type": "url", "required": true}, {"name": "method", "type": "select", "required": false, "options": ["POST", "PUT"], "default": "POST"}]}'
WHERE NOT EXISTS (SELECT 1 FROM connectors WHERE type = 'webhook');