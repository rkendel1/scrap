CREATE TABLE IF NOT EXISTS guest_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    associated_at TIMESTAMP WITH TIME ZONE
);

-- Add a trigger to update the associated_at column automatically
CREATE OR REPLACE TRIGGER update_guest_tokens_associated_at
BEFORE UPDATE ON guest_tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); -- Reusing the function from users table