DO $$
BEGIN
    -- Check if the unique_guest_token constraint already exists on the guest_tokens table
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'unique_guest_token'
        AND conrelid = 'guest_tokens'::regclass
    ) THEN
        -- If it does not exist, add the unique constraint
        ALTER TABLE guest_tokens
        ADD CONSTRAINT unique_guest_token UNIQUE (token);
    END IF;
END
$$;