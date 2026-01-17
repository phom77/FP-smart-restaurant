const supabase = require('../config/supabaseClient');

// 1. Lấy danh sách Voucher (Cho khách xem)
exports.getAvailableCoupons = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('is_active', true)
            .gte('end_date', new Date().toISOString()) // Chỉ lấy voucher chưa hết hạn
            .order('min_order_value', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Validate Voucher (Khi khách chọn)
exports.validateCoupon = async (req, res) => {
    const { code, cartTotal } = req.body;

    try {
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code)
            .single();

        if (error || !coupon) {
            return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại' });
        }

        // --- CÁC ĐIỀU KIỆN KIỂM TRA ---
        
        // 1. Kiểm tra ngày hiệu lực
        const now = new Date();
        if (new Date(coupon.start_date) > now) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá chưa đến ngày hiệu lực' });
        }
        if (new Date(coupon.end_date) < now) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn' });
        }

        // 2. Kiểm tra số lượng
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
        }

        // 3. Kiểm tra đơn tối thiểu
        if (cartTotal < coupon.min_order_value) {
            return res.status(400).json({ 
                success: false, 
                message: `Đơn hàng cần tối thiểu ${coupon.min_order_value.toLocaleString()}đ để dùng mã này` 
            });
        }

        // --- TÍNH TOÁN SỐ TIỀN GIẢM ---
        let discountAmount = 0;
        if (coupon.discount_type === 'fixed') {
            discountAmount = coupon.discount_value;
        } else {
            discountAmount = (cartTotal * coupon.discount_value) / 100;
            // Áp trần giảm tối đa (nếu có)
            if (coupon.max_discount_value && discountAmount > coupon.max_discount_value) {
                discountAmount = coupon.max_discount_value;
            }
        }

        // Đảm bảo không giảm quá giá trị đơn hàng
        if (discountAmount > cartTotal) discountAmount = cartTotal;

        res.json({ 
            success: true, 
            data: {
                ...coupon,
                discountAmount
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

// 4. Lấy chi tiết 1 Voucher (Dùng cho trang Edit)
exports.getCouponById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('id', id)
            .single();

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
        
        // Loại bỏ các field không cho sửa (nếu cần)
        delete updates.id; 
        delete updates.created_at;

        const { data, error } = await supabase
            .from('coupons')
            .update(updates)
            .eq('id', id)
            .select();

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

        // Kiểm tra xem voucher đã được dùng lần nào chưa
        // Nếu đã dùng thì chỉ nên ẩn đi (is_active = false) chứ không nên xóa vĩnh viễn
        // Tuy nhiên ở đây mình làm xóa vĩnh viễn theo yêu cầu, bạn có thể tùy chỉnh logic.
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Đã xóa thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi xóa voucher: Có thể mã này đã được sử dụng trong đơn hàng.' });
    }
};