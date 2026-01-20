-- Create helper function for updated_at if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create modifier_groups table
CREATE TABLE IF NOT EXISTS modifier_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    min_selection INTEGER DEFAULT 0,
    max_selection INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create modifiers table
CREATE TABLE IF NOT EXISTS modifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create junction table for menu_items and modifier_groups
CREATE TABLE IF NOT EXISTS menu_item_modifier_groups (
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    modifier_group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (menu_item_id, modifier_group_id)
);

-- Add triggers for updated_at
CREATE TRIGGER update_modifier_groups_updated_at
    BEFORE UPDATE ON modifier_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modifiers_updated_at
    BEFORE UPDATE ON modifiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
