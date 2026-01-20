const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const guestOrderController = require('../controllers/guestOrderController');
const uploadController = require('../controllers/uploadController');
const { verifyToken } = require('../middleware/authMiddleware');

// All routes require authentication
router.put('/profile', verifyToken, userController.updateProfile);
router.put('/password', verifyToken, userController.updatePassword);
router.get('/orders', verifyToken, userController.getMyOrders);
router.post('/claim-orders', verifyToken, guestOrderController.claimGuestOrders);
router.post('/avatar', verifyToken, uploadController.uploadAvatarMiddleware, uploadController.uploadAvatar);

module.exports = router;
