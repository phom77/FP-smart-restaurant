-- Migration: 04_analytics_rpcs.sql

CREATE OR REPLACE FUNCTION get_top_products(
    p_start_date TIMESTAMP,
    p_end_date TIMESTAMP,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    menu_item_id UUID,
    name TEXT,
    total_quantity BIGINT,
    total_revenue DECIMAL(10, 2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mi.id as menu_item_id,
        mi.name::TEXT,
        COALESCE(SUM(oi.quantity), 0)::BIGINT as total_quantity,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0)::DECIMAL(10, 2) as total_revenue
    FROM menu_items mi
    LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
    LEFT JOIN orders o ON oi.order_id = o.id 
      AND o.status = 'completed'
      AND o.created_at >= p_start_date
      AND o.created_at <= p_end_date
    GROUP BY mi.id, mi.name
    ORDER BY total_revenue DESC, total_quantity DESC, mi.name ASC
    LIMIT p_limit;
END;
$$;

-- 2. Get Peak Hours
CREATE OR REPLACE FUNCTION get_peak_hours(
    p_start_date TIMESTAMP,
    p_end_date TIMESTAMP
)
RETURNS TABLE (
    hour INT,
    order_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.h::INT as hour,
        COUNT(o.id)::BIGINT as order_count
    FROM generate_series(0, 23) h
    LEFT JOIN orders o ON EXTRACT(HOUR FROM o.created_at) = h.h
      AND o.status = 'completed'
      AND o.created_at >= p_start_date
      AND o.created_at <= p_end_date
    GROUP BY h.h
    ORDER BY h.h;
END;
$$;
