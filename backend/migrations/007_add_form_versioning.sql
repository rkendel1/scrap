-- Create form_versions table
CREATE TABLE form_versions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    generated_form JSONB NOT NULL, -- Stores the full GeneratedForm object
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_live BOOLEAN NOT NULL DEFAULT FALSE,
    is_draft BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (form_id, version_number)
);

-- Add columns to forms table to reference live and draft versions
ALTER TABLE forms
ADD COLUMN live_version_id INTEGER REFERENCES form_versions(id) ON DELETE SET NULL,
ADD COLUMN draft_version_id INTEGER REFERENCES form_versions(id) ON DELETE SET NULL;

-- Remove old columns from forms table that are now handled by form_versions
ALTER TABLE forms
DROP COLUMN form_schema,
DROP COLUMN is_live;

-- Add a default value for allowed_domains if it doesn't exist, then make it NOT NULL
-- This is a safe way to handle existing rows if the column was previously nullable
ALTER TABLE forms
ALTER COLUMN allowed_domains SET DEFAULT '{}'::TEXT[],
ALTER COLUMN allowed_domains SET NOT NULL;

-- Update existing forms to have a default empty array for allowed_domains
UPDATE forms
SET allowed_domains = '{}'::TEXT[]
WHERE allowed_domains IS NULL;

-- Migrate existing form_schema data to form_versions for existing forms
-- This is a complex migration and assumes 'form_schema' in 'forms' table
-- contained the 'GeneratedForm' object as a JSONB array with one element.
-- If your existing data structure is different, this part needs adjustment.
DO $$
DECLARE
    r RECORD;
    v_form_schema JSONB;
    v_version_id INTEGER;
BEGIN
    FOR r IN SELECT id, form_name, form_description, title, description, color_palette, primary_colors, font_families, generated_form_schema FROM forms LOOP
        -- Assuming generated_form_schema is an array and we take the first element
        v_form_schema := (r.generated_form_schema -> 0);

        IF v_form_schema IS NOT NULL THEN
            INSERT INTO form_versions (form_id, version_number, generated_form, is_live, is_draft)
            VALUES (r.id, 1, v_form_schema, TRUE, TRUE) -- Mark initial version as both live and draft
            RETURNING id INTO v_version_id;

            UPDATE forms
            SET live_version_id = v_version_id,
                draft_version_id = v_version_id
            WHERE id = r.id;
        END IF;
    END LOOP;
END $$;

-- Drop the temporary generated_form_schema column after migration
ALTER TABLE forms
DROP COLUMN generated_form_schema;

-- Add a default value for connectors if it doesn't exist, then make it NOT NULL
ALTER TABLE forms
ALTER COLUMN connectors SET DEFAULT '[]'::JSONB,
ALTER COLUMN connectors SET NOT NULL;

-- Update existing forms to have a default empty array for connectors
UPDATE forms
SET connectors = '[]'::JSONB
WHERE connectors IS NULL;