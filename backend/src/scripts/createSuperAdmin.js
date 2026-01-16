// backend/src/scripts/createSuperAdmin.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Dùng Service Key để bypass RLS nếu có
const supabase = createClient(supabaseUrl, supabaseKey);

const createSuperAdmin = async () => {
    const email = 'superadmin@smartrestaurant.com'; // Email đăng nhập
    const password = 'SuperPassword123!'; // Mật khẩu cứng (Đổi sau)
    const fullName = 'System Administrator';

    try {
        // 1. Check xem đã có chưa
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            console.log('⚠️ Super Admin account already exists.');
            return;
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Insert
        const { error } = await supabase
            .from('users')
            .insert([{
                email,
                password_hash: passwordHash,
                full_name: fullName,
                role: 'super_admin', // Role mới
                is_verified: true,   // Auto verify
                phone: '0000000000'
            }]);

        if (error) throw error;

        console.log('✅ Super Admin created successfully!');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);

    } catch (err) {
        console.error('❌ Error creating Super Admin:', err.message);
    }
};

createSuperAdmin();