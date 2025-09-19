CREATE TABLE IF NOT EXISTS customer_configs (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(255) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    routing_config JSONB NOT NULL, -- Stores n8n routing rules for this customer
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS form_customer_mappings (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    customer_id VARCHAR(255) NOT NULL REFERENCES customer_configs(customer_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (form_id, customer_id)
);

CREATE TABLE IF NOT EXISTS n8n_workflows (
    id SERIAL PRIMARY KEY,
    workflow_name VARCHAR(255) NOT NULL,
    workflow_id VARCHAR(255) UNIQUE NOT NULL, -- Internal ID for n8n workflow
    webhook_url VARCHAR(2048) NOT NULL, -- The URL to trigger this workflow
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for updated_at timestamp on customer_configs
CREATE OR REPLACE TRIGGER update_customer_configs_updated_at
BEFORE UPDATE ON customer_configs
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger for updated_at timestamp on n8n_workflows
CREATE OR REPLACE TRIGGER update_n8n_workflows_updated_at
BEFORE UPDATE ON n8n_workflows
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Insert a default customer configuration for n8n routing
INSERT INTO customer_configs (customer_id, customer_name, routing_config, is_active)
VALUES (
    'default',
    'Default Customer Routing',
    '{
        "routing_rules": [
            {
                "condition": "all_forms",
                "action": "n8n",
                "target": "http://n8n:5678/webhook/form-submission",
                "priority": 1,
                "headers": {
                    "Content-Type": "application/json"
                }
            }
        ]
    }'::jsonb,
    TRUE
)
ON CONFLICT (customer_id) DO NOTHING;