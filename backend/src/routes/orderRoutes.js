const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Public route (Customer table order)
router.post('/', orderController.createOrder);

// Protected routes (Waiter/Admin)
router.get('/', verifyToken, authorizeRoles('admin', 'waiter'), orderController.getOrders);
router.put('/:id/status', verifyToken, authorizeRoles('admin', 'waiter'), orderController.updateOrderStatus);

module.exports = router;