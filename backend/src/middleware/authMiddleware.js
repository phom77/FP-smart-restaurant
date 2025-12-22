const jwt = require('jsonwebtoken');

// Middleware kiểm tra Token
exports.verifyToken = (req, res, next) => {
  // Lấy token từ header: "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided!' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret_tam_thoi');
    req.user = verified; 
    next(); 
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};