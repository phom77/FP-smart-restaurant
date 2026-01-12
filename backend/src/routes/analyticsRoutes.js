const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/revenue', verifyToken, authorizeRoles('admin'), analyticsController.getRevenueStats);
router.get('/top-products', verifyToken, authorizeRoles('admin'), analyticsController.getTopProducts);
router.get('/peak-hours', verifyToken, authorizeRoles('admin'), analyticsController.getPeakHours);
router.get('/export', verifyToken, authorizeRoles('admin'), analyticsController.exportToExcel);

module.exports = router;
