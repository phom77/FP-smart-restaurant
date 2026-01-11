const supabase = require('../config/supabaseClient');

exports.getRevenueStats = async (req, res) => {
    try {
        const { range = 'today' } = req.query; // today, week, month, year, all

        let startDate, endDate, type;
        const now = new Date();
        endDate = now; // Default end date is now

        switch (range) {
            case 'today':
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0); // Start of today
                type = 'daily'; // Group by hour isn't supported yet, so maybe just show the day? 
                // Wait, if it's "Today", we want hourly? Or just single total?
                // The RPC groups by "YYYY-MM-DD". If start/end is same day, it returns 1 row.
                // Let's keep it 'daily'. 
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                type = 'daily';
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 30);
                type = 'daily'; // Or weekly? Daily is fine for 30 days.
                break;
            case 'year':
                startDate = new Date(now);
                startDate.setFullYear(now.getFullYear() - 1);
                type = 'monthly';
                break;
            case 'all':
                startDate = new Date(0); // Epoch
                type = 'yearly';
                break;
            default: // Custom or fallback
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                type = 'daily';
        }

        // Call RPC for SQL Aggregation
        const { data, error } = await supabase
            .rpc('get_revenue_analytics', {
                p_start_date: startDate.toISOString(),
                p_end_date: endDate.toISOString(),
                p_type: type
            });

        if (error) throw error;

        // format result to match frontend expectation { date: "...", total: ... }
        const formattedData = data.map(item => ({
            date: item.period,
            total: item.total_revenue,
            count: item.order_count
        }));

        return res.status(200).json({
            success: true,
            data: formattedData,
            range: { from: startDate, to: endDate, type: range }
        });

    } catch (err) {
        console.error("Revenue Stats Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
