const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware');

// Create a new review (requires authentication)
router.post('/', verifyToken, reviewController.createReview);

// Get reviews for a specific menu item (public)
router.get('/item/:id', reviewController.getItemReviews);

// Get current user's reviews (requires authentication)
router.get('/my-reviews', verifyToken, reviewController.getMyReviews);

// Delete a review (requires authentication)
router.delete('/:id', verifyToken, reviewController.deleteReview);

module.exports = router;
