const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { registerSchema } = require('../utils/validation');
const { sendStaffInvitation } = require('../services/emailService');

// 1. Lấy danh sách nhân viên (Waiter & Kitchen)
exports.getStaff = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        let query = supabase
            .from('users')
            .select('id, email, full_name, role, phone, avatar_url, created_at', { count: 'exact' })
            .in('role', ['waiter', 'kitchen']);

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limitNum - 1);

        // 2. Get global stats ignoring pagination
        const statsQuery = supabase
            .from('users')
            .select('role')
            .in('role', ['waiter', 'kitchen']);

        const { data: allStaff, error: statsError } = await statsQuery;

        if (error) throw error;
        if (statsError) throw statsError;

        const stats = {
            total: allStaff.length,
            waiter: allStaff.filter(s => s.role === 'waiter').length,
            kitchen: allStaff.filter(s => s.role === 'kitchen').length
        };

        res.status(200).json({
            success: true,
            data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: count,
                totalPages: Math.ceil(count / limitNum)
            },
            stats // Return global stats
        });
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

        // 1. Validate Input Strict
        const { error: validationError } = registerSchema.validate({
            email, password, full_name, phone, role
        });
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError.details[0].message });
        }

        // 2. Check email tồn tại
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        // 3. Hash Pass & Token
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // 4. Insert (is_verified = FALSE)
        const { data: newStaff, error } = await supabase
            .from('users')
            .insert([{
                email,
                password_hash: passwordHash,
                full_name,
                role,
                phone,
                is_verified: false, // CHẶN ĐĂNG NHẬP
                verification_token: verificationToken,
                verification_token_expires: tokenExpiry
            }])
            .select('id, email, full_name, role, phone, avatar_url')
            .single();

        if (error) throw error;

        // 5. Gửi mail
        await sendStaffInvitation(email, full_name, password, verificationToken);

        res.status(201).json({
            success: true,
            message: 'Tạo nhân viên thành công. Đã gửi email xác thực.',
            data: newStaff
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Cập nhật nhân viên (bao gồm cả mật khẩu nếu có)
exports.updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, role, phone, password } = req.body;

        // Check if the staff member exists and is not an admin
        const { data: existingStaff, error: fetchError } = await supabase
            .from('users')
            .select('role')
            .eq('id', id)
            .single();

        if (fetchError || !existingStaff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        if (existingStaff.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot update admin accounts' });
        }

        const updateData = {};
        if (full_name) updateData.full_name = full_name;
        if (role) {
            if (!['waiter', 'kitchen'].includes(role)) {
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
