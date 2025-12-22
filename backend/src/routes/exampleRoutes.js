const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const exampleController = require('../controllers/exampleController');

// QUY TẮC: Luôn đặt verifyToken trước, sau đó đến authorizeRoles

// 1. API cho Admin
router.get('/admin-only', 
  verifyToken, 
  authorizeRoles('admin'), 
  exampleController.getAdminData
);

// 2. API cho Nhân viên (Waiter và Kitchen đều xem được)
router.get('/staff-orders', 
  verifyToken, 
  authorizeRoles('waiter', 'kitchen', 'admin'), 
  (req, res) => res.send("Staff Data")
);

module.exports = router;