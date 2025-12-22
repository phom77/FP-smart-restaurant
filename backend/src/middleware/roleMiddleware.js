// Hàm này nhận vào một danh sách các role được phép (ví dụ: ['admin', 'waiter'])
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user được tạo ra từ authMiddleware chạy trước đó
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access Denied: You do not have permission. Your role is ${req.user?.role}` 
      });
    }
    next();
  };
};