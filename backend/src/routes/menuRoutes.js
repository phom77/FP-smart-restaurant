const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const recommendationController = require('../controllers/recommendationController');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

// Public routes (no authentication required)
router.get('/', menuController.verifyMenuToken);
router.get('/items', cacheMiddleware(3600), menuController.getMenuItems);
router.get('/items/:id', menuController.getMenuItem);
router.get('/items/:id/reviews', menuController.getMenuItemReviews);
router.get('/items/:id/recommendations', recommendationController.getRecommendations);

module.exports = router;
