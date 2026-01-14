const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// All routes require authentication
router.put('/profile', verifyToken, userController.updateProfile);
router.put('/password', verifyToken, userController.updatePassword);
router.get('/orders', verifyToken, userController.getMyOrders);

module.exports = router;
