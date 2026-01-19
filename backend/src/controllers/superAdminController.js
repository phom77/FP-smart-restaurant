const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { registerSchema } = require('../utils/validation'); // Import validation strict
const { sendStaffInvitation } = require('../services/emailService');

// 1. TẠO TÀI KHOẢN CHỦ NHÀ HÀNG (Restaurant Admin)
exports.createRestaurantAdmin = async (req, res) => {
    try {
        const { email, password, full_name, phone, restaurant_name } = req.body;

        // 1. Validate dữ liệu đầu vào nghiêm ngặt
        const { error: validationError } = registerSchema.validate({
            email, password, full_name, phone, restaurant_name
        });
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError.details[0].message });
        }

        // 2. Check trùng email
        const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
        }

        // 3. Hash Password & Tạo Token Verify
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        // 4. Insert User (is_verified = FALSE)
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([{
                email,
                password_hash: passwordHash,
                full_name,
                phone,
                role: 'admin',
                is_verified: false, // BẮT BUỘC FALSE
                verification_token: verificationToken,
                verification_token_expires: tokenExpiry
            }])
            .select()
            .single();

        if (error) throw error;

        // 5. Update System Settings nếu có tên nhà hàng
        if (restaurant_name) {
            await supabase.from('system_settings').upsert({ key: 'restaurant_name', value: restaurant_name });
        }

        // 6. Gửi Email Xác thực
        await sendStaffInvitation(email, full_name, password, verificationToken);

        res.status(201).json({
            success: true,
            message: 'Đã tạo tài khoản thành công. Email xác thực đã được gửi tới chủ nhà hàng.',
            data: { ...newUser, verification_token: undefined } // Không trả về token
        });

    } catch (err) {
        console.error("Create Admin Error:", err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// 2. QUẢN LÝ USER (Xem danh sách)
exports.getAllUsers = async (req, res) => {
    try {
        const { role, page = 1, limit = 10, search } = req.query;

        // Calculate pagination range
        const pageInt = parseInt(page);
        const limitInt = parseInt(limit);
        const from = (pageInt - 1) * limitInt;
        const to = from + limitInt - 1;

        let query = supabase.from('users').select('id, email, full_name, role, is_verified, created_at, phone', { count: 'exact' });

        if (role) {
            query = query.eq('role', role);
        }

        if (search) {
            query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        const { data, maxLength, count, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        // Calculate pagination meta
        const totalPages = Math.ceil(count / limitInt);

        res.status(200).json({
            success: true,
            data,
            pagination: {
                page: pageInt,
                limit: limitInt,
                total: count,
                totalPages
            }
        });
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
        // Khi ban: set is_verified = false và xóa verification_token để phân biệt với user chưa verify
        const updateData = { is_verified: is_active };
        if (!is_active) {
            // When banning, clear verification_token to distinguish from unverified users
            updateData.verification_token = null;
        }

        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;

        res.status(200).json({ success: true, message: `Đã ${is_active ? 'mở khóa' : 'khóa'} tài khoản thành công` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};