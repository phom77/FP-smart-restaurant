const supabase = require('../config/supabaseClient');
const ExcelJS = require('exceljs');

exports.getRevenueStats = async (req, res) => {
    try {
        const { range = 'week', from, to } = req.query;
        let startDate, endDate, type;
        const now = new Date();

        if (from && to) {
            startDate = new Date(from);
            endDate = new Date(to);
            endDate.setHours(23, 59, 59, 999);

            // Determine type based on duration
            const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            if (diffDays <= 31) type = 'daily';
            else if (diffDays <= 366) type = 'monthly';
            else type = 'yearly';
        } else {
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
        const { range = 'month', from, to } = req.query;
        let startDate, endDate;

        if (from && to) {
            startDate = new Date(from);
            endDate = new Date(to);
            endDate.setHours(23, 59, 59, 999);
        } else {
            startDate = new Date();
            endDate = new Date();

            if (range === 'week') startDate.setDate(startDate.getDate() - 7);
            else if (range === 'month') startDate.setDate(startDate.getDate() - 30);
            else if (range === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
            else if (range === 'today') startDate.setHours(0, 0, 0, 0);
            else startDate = new Date(0);
        }

        // Fetch all data in parallel
        const [revenueRes, topRes, peakRes] = await Promise.all([
            supabase.rpc('get_revenue_analytics', {
                p_start_date: startDate.toISOString(),
                p_end_date: endDate.toISOString(),
                p_type: range === 'year' ? 'monthly' : 'daily'
            }),
            supabase.rpc('get_top_products', {
                p_start_date: startDate.toISOString(),
                p_end_date: endDate.toISOString(),
                p_limit: 20
            }),
            supabase.rpc('get_peak_hours', {
                p_start_date: startDate.toISOString(),
                p_end_date: endDate.toISOString()
            })
        ]);

        if (revenueRes.error) throw revenueRes.error;
        if (topRes.error) throw topRes.error;
        if (peakRes.error) throw peakRes.error;

        const workbook = new ExcelJS.Workbook();

        // 1. Revenue Report Worksheet
        const revSheet = workbook.addWorksheet('Revenue Report');
        revSheet.columns = [
            { header: 'Period', key: 'period', width: 25 },
            { header: 'Orders', key: 'order_count', width: 15 },
            { header: 'Revenue (VND)', key: 'total_revenue', width: 20 }
        ];
        revSheet.addRows(revenueRes.data || []);

        // 2. Top Products Worksheet
        const topSheet = workbook.addWorksheet('Top Products');
        topSheet.columns = [
            { header: 'Product Name', key: 'name', width: 30 },
            { header: 'Quantity Sold', key: 'total_quantity', width: 15 },
            { header: 'Total Revenue (VND)', key: 'total_revenue', width: 20 }
        ];
        topSheet.addRows(topRes.data || []);

        // 3. Peak Hours Worksheet
        const peakSheet = workbook.addWorksheet('Peak Hours');
        peakSheet.columns = [
            { header: 'Hour (0-23)', key: 'hour', width: 15 },
            { header: 'Order Count', key: 'order_count', width: 15 }
        ];
        peakSheet.addRows(peakRes.data || []);

        // Styling: Make headers bold and add a light gray background
        [revSheet, topSheet, peakSheet].forEach(sheet => {
            sheet.getRow(1).font = { bold: true };
            sheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            sheet.getRow(1).alignment = { horizontal: 'center' };
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=analytics_report_${range}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error("Export Error:", err);
        res.status(500).send("Export failed");
    }
};
