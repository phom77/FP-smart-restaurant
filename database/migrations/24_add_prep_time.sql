-- Add prep_time column to menu_items table
-- This stores the average preparation time in minutes for each dish

ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS prep_time INTEGER DEFAULT 15; -- Default 15 minutes

-- Add comment for documentation
COMMENT ON COLUMN menu_items.prep_time IS 'Average preparation time in minutes for this menu item';
