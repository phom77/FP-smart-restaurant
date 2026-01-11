const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenueController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', verifyToken, authorizeRoles('admin'), revenueController.getRevenueStats);

module.exports = router;
