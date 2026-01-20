-- Add images column to menu_items table
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Comment on column
COMMENT ON COLUMN menu_items.images IS 'Array of additional image URLs for the menu item';
