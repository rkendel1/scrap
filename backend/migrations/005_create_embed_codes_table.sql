CREATE TABLE IF NOT EXISTS embed_codes (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE NOT NULL, -- Now includes FK and NOT NULL
    code VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(2048), -- Optional domain restriction
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    submission_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE
);

-- Add a trigger to update the last_accessed column automatically
CREATE OR REPLACE TRIGGER update_embed_codes_last_accessed
BEFORE UPDATE ON embed_codes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); -- Reusing the function from users table