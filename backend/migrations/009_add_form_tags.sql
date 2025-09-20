-- Add tags column to forms table for categorization
ALTER TABLE forms ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

-- Create an index on the tags column for better query performance
CREATE INDEX IF NOT EXISTS idx_forms_tags ON forms USING GIN (tags);

-- Add a comment explaining the tags column
COMMENT ON COLUMN forms.tags IS 'Array of tag strings for form categorization and filtering';