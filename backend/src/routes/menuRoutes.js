const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const recommendationController = require('../controllers/recommendationController');

// Public routes (no authentication required)
router.get('/items', menuController.getMenuItems);
router.get('/items/:id', menuController.getMenuItem);
router.get('/items/:id/reviews', menuController.getMenuItemReviews);
router.get('/items/:id/recommendations', recommendationController.getRecommendations);

module.exports = router;
