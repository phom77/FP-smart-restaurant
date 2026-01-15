const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');

// Validate Vietnamese phone number format
const isValidPhone = (phone) => {
    if (!phone) return true; // Phone is optional
    return /^0\d{9,10}$/.test(phone);
};

// 1. UPDATE PROFILE
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, phone, avatar_url } = req.body;

        // Validate phone number if provided
        if (phone && !isValidPhone(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 số, bắt đầu bằng 0)'
            });
        }

        // Build update object with only provided fields
        const updateData = {};
        if (full_name !== undefined) updateData.full_name = full_name;
        if (phone !== undefined) updateData.phone = phone;
        if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
        updateData.updated_at = new Date().toISOString();

        // Update user profile
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select('id, email, full_name, phone, avatar_url, role')
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            user: updatedUser
        });

    } catch (err) {
        console.error('Update Profile Error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật thông tin',
            error: err.message
        });
    }
};

// 2. UPDATE PASSWORD
exports.updatePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        // Validate input
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới'
            });
        }

        // Validate new password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
            });
        }

        // Get current user with password hash
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('password_hash')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Check if user has password (OAuth users might not have password)
        if (!user.password_hash) {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản này đăng nhập qua Google, không thể đổi mật khẩu'
            });
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Mật khẩu cũ không đúng'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        const { error: updateError } = await supabase
            .from('users')
            .update({
                password_hash: newPasswordHash,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        res.status(200).json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });

    } catch (err) {
        console.error('Update Password Error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đổi mật khẩu',
            error: err.message
        });
    }
};

// 3. GET MY ORDERS
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch orders for this user with related data
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
        id,
        table_id,
        status,
        total_amount,
        payment_method,
        created_at,
        updated_at,
        tables(table_number),
        order_items(
          id,
          quantity,
          unit_price,
          total_price,
          notes,
          status,
          menu_items(id, name, image_url)
        )
      `)
            .eq('customer_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            orders: orders || []
        });

    } catch (err) {
        console.error('Get My Orders Error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử đơn hàng',
            error: err.message
        });
    }
};
