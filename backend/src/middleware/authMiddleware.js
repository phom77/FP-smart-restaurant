const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseClient');

// Middleware kiểm tra Token
exports.verifyToken = async (req, res, next) => {
  // Lấy token từ header: "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided!' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret_tam_thoi');

    // Check if user is banned (is_verified = false)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, is_verified, role')
      .eq('id', verified.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.'
      });
    }

    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};