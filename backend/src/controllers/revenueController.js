const supabase = require('../config/supabaseClient');

exports.getRevenueStats = async (req, res) => {
    try {
        const { range = 'today' } = req.query; // today, week, month, year, all

        let startDate, endDate, type;

        // Determine Start and End dates based on Vietnam Time
        // "Today" means 00:00 VN to 23:59 VN
        if (range === 'all') {
            startDate = new Date(0); // Epoch
            endDate = new Date();
            type = 'yearly';
        } else {
            const { getStartOfPeriod, getEndOfPeriod } = require('../utils/timeUtils');
            startDate = getStartOfPeriod(range);
            endDate = getEndOfPeriod(); // End of "today" VN

            // Map range to type for database grouping
            switch (range) {
                case 'today': type = 'daily'; break;
                case 'week': type = 'daily'; break;
                case 'month': type = 'daily'; break;
                case 'year': type = 'monthly'; break;
                default: type = 'daily';
            }
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
