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
            const { getStartOfPeriod, getEndOfPeriod } = require('../utils/timeUtils');

            if (range === 'all') {
                startDate = new Date(0);
                endDate = new Date();
                type = 'yearly';
            } else {
                startDate = getStartOfPeriod(range);
                endDate = getEndOfPeriod(); // Current Vietnam day end

                switch (range) {
                    case 'today': type = 'daily'; break;
                    case 'week': type = 'daily'; break;
                    case 'month': type = 'daily'; break;
                    case 'year': type = 'monthly'; break;
                    default: type = 'daily';
                }
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
            const { getStartOfPeriod, getEndOfPeriod } = require('../utils/timeUtils');
            if (range === 'all') {
                startDate = new Date(0);
                endDate = new Date();
            } else {
                startDate = getStartOfPeriod(range);
                endDate = getEndOfPeriod();
            }
        }

        // Fetch all data in parallel
        const [revenueRes, topRes, peakRes, ordersRes] = await Promise.all([
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
            }),
            supabase
                .from('orders')
                .select(`
                    id,
                    created_at,
                    total_amount,
                    status,
                    payment_method,
                    tables (table_number),
                    users (full_name)
                `)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: false })
        ]);

        if (revenueRes.error) throw revenueRes.error;
        if (topRes.error) throw topRes.error;
        if (peakRes.error) throw peakRes.error;
        if (ordersRes.error) throw ordersRes.error;

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

        let peakData = peakRes.data || [];
        // Shift hours by +7 for VN Time
        peakData = peakData.map(item => ({
            ...item,
            hour: (item.hour + 7) % 24
        })).sort((a, b) => a.hour - b.hour);

        peakSheet.addRows(peakData);

        // 4. Detailed Orders Worksheet
        const orderSheet = workbook.addWorksheet('Detailed Orders');
        orderSheet.columns = [
            { header: 'Date', key: 'date', width: 25 },
            { header: 'Order ID', key: 'id', width: 36 },
            { header: 'Table', key: 'table', width: 10 },
            { header: 'Customer', key: 'customer', width: 20 },
            { header: 'Amount (VND)', key: 'amount', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Payment', key: 'payment', width: 15 }
        ];

        const orderRows = ordersRes.data.map(o => ({
            date: new Date(o.created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
            id: o.id,
            table: o.tables?.table_number || 'N/A',
            customer: o.users?.full_name || 'Guest',
            amount: o.total_amount,
            status: o.status,
            payment: o.payment_method || 'N/A'
        }));
        orderSheet.addRows(orderRows);

        // Styling: Make headers bold and add a light gray background
        [revSheet, topSheet, peakSheet, orderSheet].forEach(sheet => {
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
