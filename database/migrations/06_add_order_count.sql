-- Add order_count column to menu_items table
-- This tracks how many times each menu item has been ordered

ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS order_count INTEGER DEFAULT 0;

-- Create index for efficient sorting by popularity
CREATE INDEX IF NOT EXISTS idx_menu_items_order_count ON menu_items(order_count DESC);

-- Update existing items with current order counts from order_items
UPDATE menu_items mi
SET order_count = (
    SELECT COALESCE(SUM(oi.quantity), 0)
    FROM order_items oi
    WHERE oi.menu_item_id = mi.id
);

-- Add comment for documentation
COMMENT ON COLUMN menu_items.order_count IS 'Total number of times this item has been ordered (sum of quantities)';
