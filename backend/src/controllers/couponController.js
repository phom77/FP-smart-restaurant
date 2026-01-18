const supabase = require('../config/supabaseClient');
const couponService = require('../services/couponService'); // <--- Import Service

// 1. Lấy danh sách Voucher (Cho khách xem)
exports.getAvailableCoupons = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('is_active', true)
            .gte('end_date', new Date().toISOString())
            .order('min_order_value', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Validate Voucher (Đã Refactor dùng Service)
exports.validateCoupon = async (req, res) => {
    const { code, cartTotal, userId } = req.body; 

    try {
        // Gọi Service kiểm tra
        const result = await couponService.verifyCouponCondition(code, cartTotal, userId);

        // Nếu Service báo lỗi -> Trả về lỗi
        if (!result.isValid) {
            return res.status(400).json({ success: false, message: result.message });
        }

        // Nếu hợp lệ -> Trả về dữ liệu
        res.json({ 
            success: true, 
            data: {
                ...result.coupon,
                discountAmount: result.discountAmount
            } 
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Admin tạo voucher 
exports.createCoupon = async (req, res) => {
    try {
        const { data, error } = await supabase.from('coupons').insert([req.body]).select();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Lấy chi tiết 1 Voucher
exports.getCouponById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('coupons').select('*').eq('id', id).single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 5. Cập nhật Voucher
exports.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        delete updates.id; 
        delete updates.created_at;

        const { data, error } = await supabase.from('coupons').update(updates).eq('id', id).select();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 6. Xóa Voucher
exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('coupons').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true, message: 'Đã xóa thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi xóa voucher.' });
    }
};