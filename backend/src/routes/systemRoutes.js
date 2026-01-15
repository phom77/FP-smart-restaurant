// backend/src/routes/systemRoutes.js
const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { verifyToken } = require('../middleware/authMiddleware'); 
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Public access (Guest, Customer đều cần xem tên quán, logo để hiển thị)
router.get('/settings', systemController.getSettings);

// Admin access only (Chỉ Admin mới được sửa cấu hình)
router.put('/settings', 
    verifyToken, 
    authorizeRoles('super_admin', 'admin'), // Cho phép cả 2 đều sửa được là linh hoạt nhất
    systemController.updateSettings
);

module.exports = router;