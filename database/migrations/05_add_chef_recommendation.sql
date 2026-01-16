-- Add is_chef_recommendation column to menu_items table
-- This marks items that are recommended by the chef

ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS is_chef_recommendation BOOLEAN DEFAULT FALSE;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_menu_items_chef_recommendation ON menu_items(is_chef_recommendation) WHERE is_chef_recommendation = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN menu_items.is_chef_recommendation IS 'Marks items recommended by the chef';

-- Example: Mark some popular items as chef recommendations (optional)
-- UPDATE menu_items SET is_chef_recommendation = TRUE WHERE name IN ('Phở Bò', 'Bún Chả', 'Bánh Mì');
