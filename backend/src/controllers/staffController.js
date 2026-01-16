const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');

// 1. Lấy danh sách nhân viên (Waiter & Kitchen)
exports.getStaff = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, full_name, role, phone, avatar_url, created_at')
            .in('role', ['waiter', 'kitchen'])
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Lấy chi tiết 1 nhân viên
exports.getStaffById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('users')
            .select('id, email, full_name, role, phone, avatar_url, created_at')
            .eq('id', id)
            .single();

        if (error || !data) {
            return res.status(404).json({ success: false, message: 'Nhân viên không tồn tại' });
        }

        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Tạo nhân viên (Admin Only)
exports.createStaff = async (req, res) => {
    try {
        const { email, password, full_name, role, phone } = req.body;

        if (!['waiter', 'kitchen'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        // Check email tồn tại
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const { data: newStaff, error } = await supabase
            .from('users')
            .insert([{
                email,
                password_hash: passwordHash,
                full_name,
                role,
                phone
            }])
            .select('id, email, full_name, role, phone, avatar_url')
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, data: newStaff });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Cập nhật nhân viên (bao gồm cả mật khẩu nếu có)
exports.updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, role, phone, password } = req.body;

        const updateData = {};
        if (full_name) updateData.full_name = full_name;
        if (role) {
            if (!['waiter', 'kitchen', 'admin'].includes(role)) {
                return res.status(400).json({ success: false, message: 'Invalid role' });
            }
            updateData.role = role;
        }
        if (phone !== undefined) updateData.phone = phone;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password_hash = await bcrypt.hash(password, salt);
        }

        const { data: updatedStaff, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', id)
            .select('id, email, full_name, role, phone, avatar_url')
            .single();

        if (error) throw error;
        res.status(200).json({ success: true, data: updatedStaff });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Xóa nhân viên
exports.deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id)
            .in('role', ['waiter', 'kitchen']);

        if (error) throw error;
        res.status(200).json({ success: true, message: 'Staff deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = exports;
