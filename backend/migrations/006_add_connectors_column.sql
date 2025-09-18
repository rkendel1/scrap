-- Migration: Add connectors JSONB column to forms table
-- Created: 2024-01-05

-- Add connectors column to forms table for storing connector configurations directly
ALTER TABLE forms ADD COLUMN IF NOT EXISTS connectors JSONB DEFAULT '[]'::jsonb;

-- Create index for better query performance on connectors column
CREATE INDEX IF NOT EXISTS idx_forms_connectors ON forms USING gin(connectors);

-- Add comment to document the column usage
COMMENT ON COLUMN forms.connectors IS 'Array of connector configurations for this form, e.g. [{"type": "email", "settings": {"to": "owner@example.com"}}, {"type": "slack", "settings": {"webhookUrl": "https://hooks.slack.com/..."}}]';