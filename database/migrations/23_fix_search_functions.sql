-- Migration: 23_fix_search_functions.sql
-- Purpose: Update fuzzy search and recommendation functions to filter by 'status' instead of 'is_available'

-- Drop existing functions before recreation since we are changing the return type (adding 'status' column)
DROP FUNCTION IF EXISTS fuzzy_search_menu_items(text,integer);
DROP FUNCTION IF EXISTS get_frequently_ordered_together(uuid,integer);

-- 1. Update fuzzy_search_menu_items
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
    similarity REAL,
    status menu_item_status -- Added status to return
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
        ) as sim,
        mi.status
    FROM menu_items mi
    WHERE 
        mi.status IN ('available', 'sold_out') -- Updated filter
        AND (
            -- Normalized trigram match
            unaccent(LOWER(mi.name)) % normalized_search
            OR unaccent(LOWER(COALESCE(mi.description, ''))) % normalized_search
            -- Original trigram match
            OR LOWER(mi.name) % LOWER(search_term)
            OR LOWER(COALESCE(mi.description, '')) % LOWER(search_term)
            -- Fallback: ILIKE
            OR mi.name ILIKE '%' || search_term || '%'
            OR mi.description ILIKE '%' || search_term || '%'
        )
    ORDER BY sim DESC, mi.avg_rating DESC, mi.name ASC
    LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;

-- 2. Update get_frequently_ordered_together
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
    pair_count BIGINT,
    status menu_item_status -- Added status to return
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
        COUNT(DISTINCT oi1.order_id) as pair_count,
        mi.status
    FROM order_items oi1
    JOIN order_items oi2 ON oi1.order_id = oi2.order_id
    JOIN menu_items mi ON oi2.menu_item_id = mi.id
    WHERE 
        oi1.menu_item_id = item_id
        AND oi2.menu_item_id != item_id
        AND mi.status IN ('available', 'sold_out') -- Updated filter
    GROUP BY mi.id, mi.name, mi.price, mi.image_url, mi.avg_rating, mi.review_count, mi.category_id, mi.status
    ORDER BY pair_count DESC, mi.avg_rating DESC
    LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;
