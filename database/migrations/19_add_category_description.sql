-- Add description column to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Comment on column
COMMENT ON COLUMN categories.description IS 'Detailed description of the category';
