const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Public: Lấy danh sách bàn (để Staff xem trạng thái)
router.get('/', tableController.getTables);

// Admin Only: Tạo bàn
router.post('/', 
  verifyToken, 
  authorizeRoles('admin'), 
  tableController.createTable
);

// Admin Only: Lấy mã QR để in
router.get('/:id/qr', 
  verifyToken, 
  authorizeRoles('admin'), 
  tableController.generateQRCode
);

module.exports = router;