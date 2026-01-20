-- Migration: Add status to menu_items
-- Possible values: 'available', 'unavailable', 'sold_out'

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'menu_item_status') THEN
        CREATE TYPE menu_item_status AS ENUM ('available', 'unavailable', 'sold_out');
    END IF;
END $$;

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS status menu_item_status DEFAULT 'available';

-- Migrate existing data
UPDATE menu_items SET status = 'available' WHERE is_available = true;
UPDATE menu_items SET status = 'sold_out' WHERE is_available = false;

-- Note: We keep is_available for now to avoid breaking changes, 
-- but we should eventually phase it out.
