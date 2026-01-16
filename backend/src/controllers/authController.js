const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); 
const { sendResetPasswordEmail, sendVerificationEmail } = require('../services/emailService');

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

exports.register = async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ thông tin' });
    }

    // 1. Check email tồn tại
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Tạo Verification Token (Random string)
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 4. Insert User với is_verified = FALSE
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash: passwordHash,
        full_name,
        phone,
        role: 'customer',
        is_verified: false, // 👈 Quan trọng
        verification_token: verificationToken // 👈 Lưu token để đối chiếu
      }])
      .select()
      .single();

    if (error) throw error;

    // 5. Gửi email xác thực
    sendVerificationEmail(email, verificationToken).catch(console.error);

    // 6. Trả về thành công NHƯNG KHÔNG CÓ TOKEN (Bắt buộc user phải check mail)
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.'
    });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, message: 'Lỗi Server', error: err.message });
  }
};

// 2. ĐĂNG NHẬP
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
    }

    // Tìm user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
    }

    if (user.role === 'customer' && !user.is_verified) {
        return res.status(403).json({ 
            success: false, 
            message: 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email.' 
        });
    }

    // Check pass
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
    }

    // Tạo token thật
    const token = signToken(user.id, user.role);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: 'Lỗi Server' });
  }
};

// 3. GET ME (Lấy thông tin từ Token)
exports.getMe = async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, role, phone, avatar_url, password_hash')
      .eq('id', req.user.id)
      .single();

    // Don't send password_hash to client, just indicate if user has password
    const userResponse = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone,
      avatar_url: user.avatar_url,
      has_password: !!user.password_hash // true if user has password, false for OAuth users
    };

    res.status(200).json({ success: true, user: userResponse });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi lấy thông tin' });
  }
};

// 4. GOOGLE OAUTH - Initiate authentication
exports.googleAuth = (req, res, next) => {
  const passport = require('passport');
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
};

// 5. GOOGLE OAUTH CALLBACK - Handle OAuth response
exports.googleCallback = (req, res, next) => {
  const passport = require('passport');

  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err || !user) {
      // Redirect to frontend login page with error
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }

    // Generate JWT token for the user
    const token = signToken(user.id, user.role);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/google/callback?token=${token}`);
  })(req, res, next);
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Vui lòng nhập email' });

        // 1. Kiểm tra user có tồn tại không
        const { data: user } = await supabase
            .from('users')
            .select('id, email, full_name')
            .eq('email', email)
            .single();

        // 2. Nếu không tìm thấy user -> Vẫn báo thành công ảo để bảo mật (tránh hacker dò email)
        if (!user) {
            return res.status(200).json({ 
                success: true, 
                message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.' 
            });
        }

        // 3. Tạo Token Reset (Chứa ID user, hết hạn sau 15 phút)
        // Token này dùng bí mật riêng hoặc cộng dồn password hash cũ để tăng bảo mật (khi đổi pass xong token cũ vô hiệu)
        const resetToken = jwt.sign(
            { id: user.id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '15m' } 
        );

        // 4. Gửi Email
        const sent = await sendResetPasswordEmail(user.email, resetToken);

        if (!sent) {
            return res.status(500).json({ success: false, message: 'Lỗi server gửi email' });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Đã gửi email hướng dẫn đặt lại mật khẩu.' 
        });

    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ success: false, message: 'Lỗi xử lý yêu cầu' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin xác thực' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 6 ký tự trở lên' });
        }

        // 1. Verify Token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ success: false, message: 'Link hết hạn hoặc không hợp lệ' });
        }

        // 2. Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // 3. Update DB
        const { error } = await supabase
            .from('users')
            .update({ 
                password_hash: passwordHash,
                updated_at: new Date().toISOString()
            })
            .eq('id', decoded.id);

        if (error) throw error;

        res.status(200).json({ 
            success: true, 
            message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.' 
        });

    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ success: false, message: 'Lỗi khi đặt lại mật khẩu' });
    }
};

// --- 8. VERIFY EMAIL (Xác thực khi user bấm link) ---
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.body; // Frontend sẽ gửi token lên qua body

        if (!token) {
            return res.status(400).json({ success: false, message: 'Thiếu token xác thực' });
        }

        // 1. Tìm user có token này
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, is_verified')
            .eq('verification_token', token)
            .single();

        if (error || !user) {
            return res.status(400).json({ success: false, message: 'Token không hợp lệ hoặc tài khoản đã kích hoạt.' });
        }

        // 2. Update trạng thái user
        const { error: updateError } = await supabase
            .from('users')
            .update({ 
                is_verified: true, 
                verification_token: null // Xóa token đi để không dùng lại được
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        res.status(200).json({ 
            success: true, 
            message: 'Xác thực tài khoản thành công! Bạn có thể đăng nhập ngay.' 
        });

    } catch (err) {
        console.error("Verify Email Error:", err);
        res.status(500).json({ success: false, message: 'Lỗi xác thực' });
    }
};