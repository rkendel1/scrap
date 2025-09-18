-- Migration: Add security features for embed forms
-- Created: 2024-01-04

-- Add allowed domains to forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS allowed_domains TEXT[]; -- Array of allowed domains

-- Add embed token expiry tracking
ALTER TABLE embed_codes ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;

-- Add rate limiting table for form submissions
CREATE TABLE IF NOT EXISTS form_submission_rate_limits (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    domain VARCHAR(255),
    submission_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(form_id, ip_address, domain)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_forms_allowed_domains ON forms USING GIN (allowed_domains);
CREATE INDEX IF NOT EXISTS idx_rate_limits_form_ip ON form_submission_rate_limits(form_id, ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON form_submission_rate_limits(window_start);