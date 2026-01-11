const express = require('express');
const router = express.Router();
const kitchenController = require('../controllers/kitchenController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(verifyToken);
router.use(authorizeRoles('kitchen', 'admin'));

router.get('/items', kitchenController.getKitchenItems);
router.put('/items/:id', kitchenController.updateItemStatus);

module.exports = router;