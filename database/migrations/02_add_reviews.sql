-- Migration: 02_add_reviews.sql
-- Purpose: Add reviews table for customer feedback and rating system
-- Author: Member 2
-- Date: 2026-01-11

-- ============================================
-- 1. CREATE REVIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate reviews from same user for same item
    CONSTRAINT unique_user_item_review UNIQUE(user_id, menu_item_id)
);

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index for fast queries by menu item (most common query)
CREATE INDEX IF NOT EXISTS idx_reviews_menu_item ON reviews(menu_item_id);

-- Index for fast queries by user
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- Index for sorting by rating
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);

-- Index for sorting by date
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- ============================================
-- 3. ADD RATING COLUMNS TO MENU_ITEMS
-- ============================================

-- Add average rating column to menu_items
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

-- Create index for sorting by rating
CREATE INDEX IF NOT EXISTS idx_menu_items_rating ON menu_items(avg_rating DESC);

-- ============================================
-- 4. CREATE FUNCTION TO UPDATE RATINGS
-- ============================================

-- Function to recalculate menu item ratings automatically
CREATE OR REPLACE FUNCTION update_menu_item_rating()
RETURNS TRIGGER AS $$
DECLARE
    item_id UUID;
BEGIN
    -- Determine which menu_item_id to update
    IF TG_OP = 'DELETE' THEN
        item_id := OLD.menu_item_id;
    ELSE
        item_id := NEW.menu_item_id;
    END IF;
    
    -- Update the menu item's average rating and review count
    UPDATE menu_items
    SET 
        avg_rating = COALESCE((
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM reviews
            WHERE menu_item_id = item_id
        ), 0.00),
        review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE menu_item_id = item_id
        ),
        updated_at = NOW()
    WHERE id = item_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. CREATE TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Trigger to auto-update ratings on review insert
DROP TRIGGER IF EXISTS trigger_update_rating_on_insert ON reviews;
CREATE TRIGGER trigger_update_rating_on_insert
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_menu_item_rating();

-- Trigger to auto-update ratings on review update
DROP TRIGGER IF EXISTS trigger_update_rating_on_update ON reviews;
CREATE TRIGGER trigger_update_rating_on_update
AFTER UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_menu_item_rating();

-- Trigger to auto-update ratings on review delete
DROP TRIGGER IF EXISTS trigger_update_rating_on_delete ON reviews;
CREATE TRIGGER trigger_update_rating_on_delete
AFTER DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_menu_item_rating();

-- ============================================
-- 6. ENABLE FUZZY SEARCH EXTENSION
-- ============================================

-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index for fast fuzzy search on menu item names
CREATE INDEX IF NOT EXISTS idx_menu_items_name_trgm 
ON menu_items USING gin (name gin_trgm_ops);

-- Create GIN index for description search (optional)
CREATE INDEX IF NOT EXISTS idx_menu_items_description_trgm 
ON menu_items USING gin (description gin_trgm_ops);

-- ============================================
-- 7. CREATE FUZZY SEARCH FUNCTION (Vietnamese-aware)
-- ============================================

-- Enable unaccent extension for Vietnamese support
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Fuzzy search function using pg_trgm with Vietnamese support
CREATE OR REPLACE FUNCTION fuzzy_search_menu_items(
    search_term TEXT,
    match_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    price DECIMAL,
    image_url TEXT,
    avg_rating DECIMAL,
    review_count INT,
    category_id UUID,
    is_available BOOLEAN,
    similarity REAL
) AS $$
DECLARE
    normalized_search TEXT;
BEGIN
    -- Normalize search term (remove accents for Vietnamese)
    normalized_search := unaccent(LOWER(search_term));
    
    RETURN QUERY
    SELECT 
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mi.image_url,
        mi.avg_rating,
        mi.review_count,
        mi.category_id,
        mi.is_available,
        GREATEST(
            -- Compare normalized versions
            similarity(unaccent(LOWER(mi.name)), normalized_search),
            similarity(unaccent(LOWER(COALESCE(mi.description, ''))), normalized_search),
            -- Also check original with diacritics
            similarity(LOWER(mi.name), LOWER(search_term)),
            similarity(LOWER(COALESCE(mi.description, '')), LOWER(search_term))
        ) as sim
    FROM menu_items mi
    WHERE 
        mi.is_available = true
        AND (
            -- Normalized trigram match (works for "pho" -> "Phở")
            unaccent(LOWER(mi.name)) % normalized_search
            OR unaccent(LOWER(COALESCE(mi.description, ''))) % normalized_search
            -- Original trigram match
            OR LOWER(mi.name) % LOWER(search_term)
            OR LOWER(COALESCE(mi.description, '')) % LOWER(search_term)
            -- Fallback: ILIKE for exact substring match
            OR mi.name ILIKE '%' || search_term || '%'
            OR mi.description ILIKE '%' || search_term || '%'
        )
    ORDER BY sim DESC, mi.avg_rating DESC, mi.name ASC
    LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. CREATE RECOMMENDATION FUNCTION
-- ============================================

-- Find items frequently ordered together (collaborative filtering)
CREATE OR REPLACE FUNCTION get_frequently_ordered_together(
    item_id UUID,
    match_limit INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    price DECIMAL,
    image_url TEXT,
    avg_rating DECIMAL,
    review_count INT,
    category_id UUID,
    pair_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mi.id,
        mi.name,
        mi.price,
        mi.image_url,
        mi.avg_rating,
        mi.review_count,
        mi.category_id,
        COUNT(DISTINCT oi1.order_id) as pair_count
    FROM order_items oi1
    JOIN order_items oi2 ON oi1.order_id = oi2.order_id
    JOIN menu_items mi ON oi2.menu_item_id = mi.id
    WHERE 
        oi1.menu_item_id = item_id
        AND oi2.menu_item_id != item_id
        AND mi.is_available = true
    GROUP BY mi.id, mi.name, mi.price, mi.image_url, mi.avg_rating, mi.review_count, mi.category_id
    ORDER BY pair_count DESC, mi.avg_rating DESC
    LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables created
DO $$
BEGIN
    RAISE NOTICE 'Migration 02_add_reviews.sql completed successfully!';
    RAISE NOTICE 'Created: reviews table';
    RAISE NOTICE 'Added: avg_rating, review_count to menu_items';
    RAISE NOTICE 'Created: 7 indexes for performance';
    RAISE NOTICE 'Created: 1 function + 3 triggers for auto-rating updates';
    RAISE NOTICE 'Enabled: pg_trgm extension for fuzzy search';
    RAISE NOTICE 'Created: 2 database functions (fuzzy_search, recommendations)';
END $$;
