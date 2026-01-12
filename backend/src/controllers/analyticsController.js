const supabase = require('../config/supabaseClient');
const ExcelJS = require('exceljs');

exports.getRevenueStats = async (req, res) => {
    try {
        const { range = 'week' } = req.query;
        let startDate, endDate, type;
        const now = new Date();
        endDate = now;

        switch (range) {
            case 'today':
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                type = 'daily';
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                type = 'daily';
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 30);
                type = 'daily';
                break;
            case 'year':
                startDate = new Date(now);
                startDate.setFullYear(now.getFullYear() - 1);
                type = 'monthly';
                break;
            case 'all':
                startDate = new Date(0);
                type = 'yearly';
                break;
            default:
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                type = 'daily';
        }

        const { data, error } = await supabase
            .rpc('get_revenue_analytics', {
                p_start_date: startDate.toISOString(),
                p_end_date: endDate.toISOString(),
                p_type: type
            });

        if (error) throw error;

        const formattedData = data.map(item => ({
            date: item.period,
            total: item.total_revenue,
            count: item.order_count
        }));

        res.status(200).json({
            success: true,
            data: formattedData,
            range: { from: startDate, to: endDate, type: range }
        });
    } catch (err) {
        console.error("Revenue Stats Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getTopProducts = async (req, res) => {
    try {
        const { start_date, end_date, limit = 10 } = req.query;
        const { data, error } = await supabase.rpc('get_top_products', {
            p_start_date: start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            p_end_date: end_date || new Date().toISOString(),
            p_limit: parseInt(limit)
        });

        if (error) throw error;

        res.status(200).json({ success: true, data });
    } catch (err) {
        console.error("Top Products Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getPeakHours = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const { data, error } = await supabase.rpc('get_peak_hours', {
            p_start_date: start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            p_end_date: end_date || new Date().toISOString()
        });

        if (error) throw error;

        res.status(200).json({ success: true, data });
    } catch (err) {
        console.error("Peak Hours Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.exportToExcel = async (req, res) => {
    try {
        const { range = 'month' } = req.query;
        // Fetch data (similar to getRevenueStats but for export)
        // For simplicity, we'll just fetch revenue stats for the given range

        let startDate = new Date();
        if (range === 'week') startDate.setDate(startDate.getDate() - 7);
        else if (range === 'month') startDate.setDate(startDate.getDate() - 30);
        else if (range === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
        else startDate = new Date(0);

        const { data: revenueData } = await supabase.rpc('get_revenue_analytics', {
            p_start_date: startDate.toISOString(),
            p_end_date: new Date().toISOString(),
            p_type: range === 'year' ? 'monthly' : 'daily'
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Revenue Report');

        worksheet.columns = [
            { header: 'Period', key: 'period', width: 20 },
            { header: 'Orders', key: 'order_count', width: 10 },
            { header: 'Revenue (VND)', key: 'total_revenue', width: 20 }
        ];

        worksheet.addRows(revenueData);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=revenue_report_${range}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error("Export Error:", err);
        res.status(500).send("Export failed");
    }
};
