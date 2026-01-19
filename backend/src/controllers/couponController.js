const supabase = require('../config/supabaseClient');
const couponService = require('../services/couponService'); // <--- Import Service

// 1. Lấy danh sách Voucher (Cho khách xem - Lọc theo đối tượng)
exports.getAvailableCoupons = async (req, res) => {
    try {
        const now = new Date().toISOString();
        const userId = req.query.userId || null; // Optional: ID của user đang đăng nhập

        // Bước 1: Lấy tất cả voucher active trong thời hạn
        const { data: allCoupons, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('is_active', true)
            .lte('start_date', now)
            .gte('end_date', now)
            .order('min_order_value', { ascending: true });

        if (error) throw error;

        // Bước 2: Lọc theo target_type và thêm metadata
        const filteredCoupons = [];

        for (const coupon of allCoupons) {
            let canUse = true;
            let reason = null;
            let usageCount = 0;
            let remainingUses = null;

            // Kiểm tra target_type
            if (coupon.target_type === 'guest' && userId) {
                // Voucher dành cho guest nhưng user đã đăng nhập
                canUse = false;
                reason = 'Chỉ dành cho khách vãng lai (chưa đăng nhập)';
            } else if (coupon.target_type === 'customer' && !userId) {
                // Voucher dành cho customer nhưng user chưa đăng nhập
                canUse = false;
                reason = 'Vui lòng đăng nhập để sử dụng';
            } else if (coupon.target_type === 'new_user') {
                if (!userId) {
                    canUse = false;
                    reason = 'Vui lòng đăng nhập để sử dụng';
                } else {
                    // Kiểm tra xem user đã có đơn hàng completed chưa
                    const { count } = await supabase
                        .from('orders')
                        .select('*', { count: 'exact', head: true })
                        .eq('customer_id', userId)
                        .eq('status', 'completed');

                    if (count > 0) {
                        canUse = false;
                        reason = 'Chỉ dành cho khách hàng mới (chưa có đơn hàng)';
                    }
                }
            }

            // Kiểm tra limit_per_user (chỉ khi user đã đăng nhập)
            if (userId && coupon.limit_per_user && coupon.target_type !== 'guest') {
                const { count } = await supabase
                    .from('coupon_usage')
                    .select('*', { count: 'exact', head: true })
                    .eq('coupon_id', coupon.id)
                    .eq('user_id', userId);

                usageCount = count || 0;
                remainingUses = coupon.limit_per_user - usageCount;

                if (usageCount >= coupon.limit_per_user) {
                    canUse = false;
                    reason = `Bạn đã sử dụng hết lượt (${usageCount}/${coupon.limit_per_user})`;
                }
            }

            // Kiểm tra usage_limit toàn hệ thống
            if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
                canUse = false;
                reason = 'Mã đã hết lượt sử dụng';
            }

            // Chỉ hiển thị voucher phù hợp với target_type
            const shouldShow =
                coupon.target_type === 'all' || // Voucher cho tất cả
                (coupon.target_type === 'guest' && !userId) || // Guest voucher cho guest
                (coupon.target_type === 'customer' && userId) || // Customer voucher cho customer
                (coupon.target_type === 'new_user' && userId); // New user voucher cho customer

            if (shouldShow) {
                filteredCoupons.push({
                    ...coupon,
                    canUse,
                    reason,
                    usageCount,
                    remainingUses
                });
            }
        }

        res.json({ success: true, data: filteredCoupons });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 1.1. Lấy TẤT CẢ Voucher (Cho Admin quản lý)
exports.getAllCouponsForAdmin = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false }); // Sắp xếp theo mới nhất

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Validate Voucher (Khi khách chọn)
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