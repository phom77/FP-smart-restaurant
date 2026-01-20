-- Create table for storing selected modifiers for each order item
CREATE TABLE IF NOT EXISTS order_item_modifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    modifier_id UUID REFERENCES modifiers(id) ON DELETE SET NULL,
    modifier_name VARCHAR(200), -- Snapshot for record keeping
    price_modifier DECIMAL(10, 2), -- Snapshot for record keeping
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_order_item_modifiers_order_item_id ON order_item_modifiers(order_item_id);
