// backend/src/routes/superAdminRoutes.js
const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Middleware chung: BẮT BUỘC PHẢI LÀ SUPER_ADMIN
router.use(verifyToken, authorizeRoles('super_admin'));

// Route tạo Admin nhà hàng
router.post('/create-admin', superAdminController.createRestaurantAdmin);

// Route xem danh sách user (để quản lý)
router.get('/users', superAdminController.getAllUsers);

// Route Ban/Unban user
router.patch('/users/:id/status', superAdminController.banUser);

module.exports = router;