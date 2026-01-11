const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/', orderController.createOrder);

router.get('/', 
  verifyToken, 
  authorizeRoles('waiter', 'admin'), 
  orderController.getOrders
);

router.get('/:id', orderController.getOrder); 

router.put('/:id/status', 
  verifyToken, 
  authorizeRoles('waiter', 'admin'), 
  orderController.updateOrderStatus
);

router.post('/:id/items', orderController.addItemsToOrder); 
router.post('/:id/checkout', orderController.checkoutOrder); 

module.exports = router;