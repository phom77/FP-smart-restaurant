-- Function to calculate revenue statistics using SQL Aggregation
DROP FUNCTION IF EXISTS get_revenue_analytics;

CREATE OR REPLACE FUNCTION get_revenue_analytics(
    p_start_date TIMESTAMP, 
    p_end_date TIMESTAMP, 
    p_type TEXT -- 'daily' or 'weekly'
)
RETURNS TABLE (
    period TEXT,
    total_revenue DECIMAL(10, 2),
    order_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN p_type = 'weekly' THEN to_char(created_at, 'IYYY-"W"IW') -- e.g., "2023-W42"
            WHEN p_type = 'monthly' THEN to_char(created_at, 'YYYY-MM') -- e.g., "2023-10"
            WHEN p_type = 'yearly' THEN to_char(created_at, 'YYYY') -- e.g., "2023"
            ELSE to_char(created_at, 'YYYY-MM-DD') -- e.g., "2023-10-25"
        END AS period,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(id) as order_count
    FROM orders
    WHERE status = 'completed'
      AND created_at >= p_start_date
      AND created_at <= p_end_date
    GROUP BY 1
    ORDER BY 1;
END;
$$;
