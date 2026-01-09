const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// Public routes (no authentication required)
router.get('/items', menuController.getMenuItems);
router.get('/items/:id', menuController.getMenuItem);
router.get('/items/:id/reviews', menuController.getMenuItemReviews);

module.exports = router;
