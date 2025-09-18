-- Migration: Add customer configuration tables for n8n routing
-- Created: 2024-01-01

-- Customer configurations table
CREATE TABLE IF NOT EXISTS customer_configs (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(255) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    routing_config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Form to customer mapping
CREATE TABLE IF NOT EXISTS form_customer_mappings (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    customer_id VARCHAR(255) REFERENCES customer_configs(customer_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(form_id, customer_id)
);

-- n8n workflow configurations
CREATE TABLE IF NOT EXISTS n8n_workflows (
    id SERIAL PRIMARY KEY,
    workflow_name VARCHAR(255) NOT NULL,
    workflow_id VARCHAR(255) UNIQUE NOT NULL,
    webhook_url TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_configs_customer_id ON customer_configs(customer_id);
CREATE INDEX IF NOT EXISTS idx_form_customer_mappings_form_id ON form_customer_mappings(form_id);
CREATE INDEX IF NOT EXISTS idx_form_customer_mappings_customer_id ON form_customer_mappings(customer_id);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_workflow_id ON n8n_workflows(workflow_id);

-- Insert default customer configuration
INSERT INTO customer_configs (customer_id, customer_name, routing_config) 
VALUES (
    'default', 
    'Default Customer',
    '{
        "routing_rules": [
            {
                "condition": "all_forms",
                "action": "webhook",
                "target": "http://n8n:5678/webhook/form-submission",
                "priority": 1
            }
        ]
    }'::jsonb
) ON CONFLICT (customer_id) DO NOTHING;

-- Insert default n8n workflow
INSERT INTO n8n_workflows (workflow_name, workflow_id, webhook_url, description)
VALUES (
    'Form Data Router',
    'form-data-router',
    'http://n8n:5678/webhook/form-submission',
    'Default workflow for routing form submissions based on customer configuration'
) ON CONFLICT (workflow_id) DO NOTHING;