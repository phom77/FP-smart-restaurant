const supabase = require('../config/supabaseClient');

/**
 * Hàm kiểm tra điều kiện và tính toán giảm giá
 * @param {string} code - Mã voucher
 * @param {number} cartTotal - Tổng tiền hàng
 * @param {string} userId - ID khách hàng (null nếu là Guest)
 */
exports.verifyCouponCondition = async (code, cartTotal, userId) => {
    try {
        // 1. Lấy thông tin Voucher
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code)
            .single();

        if (error || !coupon) {
            return { isValid: false, message: 'Mã giảm giá không tồn tại' };
        }

        // 2. Kiểm tra CƠ BẢN (Thời gian, Trạng thái, Số lượng chung)
        const now = new Date();
        if (!coupon.is_active) return { isValid: false, message: 'Mã giảm giá đang tạm khóa' };
        if (new Date(coupon.start_date) > now) return { isValid: false, message: 'Mã chưa đến ngày hiệu lực' };
        if (new Date(coupon.end_date) < now) return { isValid: false, message: 'Mã giảm giá đã hết hạn' };
        
        // Kiểm tra giới hạn tổng toàn hệ thống (VD: Chỉ có 100 mã toàn sàn)
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            return { isValid: false, message: 'Mã đã hết lượt sử dụng trên toàn hệ thống' };
        }
        
        // Kiểm tra đơn tối thiểu
        if (cartTotal < coupon.min_order_value) {
            return { isValid: false, message: `Đơn hàng cần tối thiểu ${coupon.min_order_value.toLocaleString()}đ` };
        }

        // 3. Kiểm tra ĐỐI TƯỢNG (Target Type)
        // ---------------------------------------------------------
        
        // Trường hợp A: Dành riêng cho GUEST (Khách vãng lai)
        if (coupon.target_type === 'guest') {
            if (userId) {
                return { isValid: false, message: 'Mã này chỉ dành cho khách vãng lai (Chưa đăng nhập).' };
            }
        }

        // Trường hợp B: Dành riêng cho CUSTOMER (Thành viên)
        if (coupon.target_type === 'customer') {
            if (!userId) {
                return { isValid: false, message: 'Vui lòng đăng nhập tài khoản để sử dụng mã này.' };
            }
        }

        // Trường hợp C: Dành riêng cho NEW USER (Thành viên mới tinh)
        if (coupon.target_type === 'new_user') {
            if (!userId) {
                return { isValid: false, message: 'Voucher này dành riêng cho thành viên mới. Vui lòng đăng nhập!' };
            }
            // Check lịch sử: Đếm số đơn đã hoàn thành của user này
            const { count } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('customer_id', userId)
                .eq('status', 'completed');
            
            if (count > 0) {
                return { isValid: false, message: 'Mã này chỉ áp dụng cho đơn hàng đầu tiên.' };
            }
        }

        // 4. Kiểm tra GIỚI HẠN CÁ NHÂN (Limit Per User)
        // ---------------------------------------------------------
        // (Chỉ kiểm tra được nếu là Customer đã đăng nhập)
        if (coupon.target_type !== 'guest' && coupon.limit_per_user && coupon.limit_per_user > 0) {
            
            if (!userId) {
                // Nếu voucher yêu cầu limit mà khách chưa login -> Bắt login
                return { isValid: false, message: 'Vui lòng đăng nhập để sử dụng mã giới hạn số lần dùng này.' };
            }

            const { count: usageCount } = await supabase
                .from('coupon_usage')
                .select('*', { count: 'exact', head: true })
                .eq('coupon_id', coupon.id)
                .eq('user_id', userId);

            if (usageCount >= coupon.limit_per_user) {
                return { isValid: false, message: `Bạn đã dùng mã này ${usageCount}/${coupon.limit_per_user} lần cho phép.` };
            }
        }

        // 5. Tính toán SỐ TIỀN GIẢM
        // ---------------------------------------------------------
        let discountAmount = 0;
        if (coupon.discount_type === 'fixed') {
            discountAmount = parseFloat(coupon.discount_value);
        } else {
            // Giảm theo %
            discountAmount = (cartTotal * parseFloat(coupon.discount_value)) / 100;
            // Áp trần giảm tối đa (Nếu có cấu hình)
            if (coupon.max_discount_value && discountAmount > parseFloat(coupon.max_discount_value)) {
                discountAmount = parseFloat(coupon.max_discount_value);
            }
        }

        // Không bao giờ giảm quá giá trị đơn hàng (Tránh âm tiền)
        if (discountAmount > cartTotal) discountAmount = cartTotal;

        return {
            isValid: true,
            discountAmount,
            coupon, // Trả về object coupon để Controller dùng
            message: 'Áp dụng thành công'
        };

    } catch (err) {
        console.error('Coupon Service Error:', err);
        return { isValid: false, message: 'Lỗi hệ thống khi kiểm tra mã' };
    }
};