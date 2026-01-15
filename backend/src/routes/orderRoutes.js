const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/', orderController.createOrder);

// Customer's own orders (must be before /:id to avoid route conflict)
router.post('/lookup', orderController.lookupOrders);

router.get('/my-orders',
  verifyToken,
  orderController.getCustomerOrders
);

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

router.put('/:id/served',
  verifyToken,
  authorizeRoles('waiter', 'admin'),
  orderController.updateOrderServedStatus
);

router.post('/:id/items', orderController.addItemsToOrder);
router.post('/add-items', orderController.addItemsToOrder); // Alternative route with orderId in body
router.post('/:id/checkout', orderController.checkoutOrder);

module.exports = router;