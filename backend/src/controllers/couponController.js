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