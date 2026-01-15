const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

    // Check email tồn tại
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert vào DB
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash: passwordHash,
        full_name,
        phone,
        role: 'customer' // Mặc định là khách
      }])
      .select()
      .single();

    if (error) throw error;

    const token = signToken(newUser.id, newUser.role);

    res.status(201).json({
      success: true,
      token,
      user: { id: newUser.id, email: newUser.email, role: newUser.role, full_name: newUser.full_name }
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