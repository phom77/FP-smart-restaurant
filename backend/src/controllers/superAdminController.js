const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');

// 1. TẠO TÀI KHOẢN CHỦ NHÀ HÀNG (Restaurant Admin)
exports.createRestaurantAdmin = async (req, res) => {
    try {
        const { email, password, full_name, phone, restaurant_name } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        // Check trùng email
        const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert User với role 'admin' (Chủ nhà hàng)
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([{
                email,
                password_hash: passwordHash,
                full_name,
                phone,
                role: 'admin', // Role Admin thường (Chủ quán)
                is_verified: true // Admin do Super tạo thì không cần verify mail
            }])
            .select()
            .single();

        if (error) throw error;

        // Nếu có nhập tên nhà hàng -> Update luôn vào System Settings
        if (restaurant_name) {
            await supabase.from('system_settings').upsert({ key: 'restaurant_name', value: restaurant_name });
        }

        res.status(201).json({
            success: true,
            message: 'Đã tạo tài khoản Chủ nhà hàng thành công',
            data: newUser
        });

    } catch (err) {
        console.error("Create Admin Error:", err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// 2. QUẢN LÝ USER (Xem danh sách)
exports.getAllUsers = async (req, res) => {
    try {
        const { role } = req.query; 
        let query = supabase.from('users').select('id, email, full_name, role, is_verified, created_at, phone');

        if (role) {
            query = query.eq('role', role);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 3. KHÓA TÀI KHOẢN (Ban User)
exports.banUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body; // true = mở, false = khóa

        // Dùng is_verified để chặn đăng nhập
        const { error } = await supabase
            .from('users')
            .update({ is_verified: is_active }) 
            .eq('id', id);

        if (error) throw error;

        res.status(200).json({ success: true, message: `Đã ${is_active ? 'mở khóa' : 'khóa'} tài khoản thành công` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};