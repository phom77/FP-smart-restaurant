-- Migration: 04_analytics_rpcs.sql

-- 1. Get Top Products
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
        oi.menu_item_id,
        mi.name::TEXT,
        SUM(oi.quantity)::BIGINT as total_quantity,
        SUM(oi.quantity * oi.unit_price)::DECIMAL(10, 2) as total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE o.status = 'completed'
      AND o.created_at >= p_start_date
      AND o.created_at <= p_end_date
    GROUP BY oi.menu_item_id, mi.name
    ORDER BY total_revenue DESC
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
        EXTRACT(HOUR FROM created_at)::INT as hour,
        COUNT(id) as order_count
    FROM orders
    WHERE status = 'completed'
      AND created_at >= p_start_date
      AND created_at <= p_end_date
    GROUP BY hour
    ORDER BY hour;
END;
$$;
