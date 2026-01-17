const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');

const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');


router.get('/', couponController.getAvailableCoupons);

router.post('/validate', couponController.validateCoupon);

router.post('/create', 
    verifyToken, 
    authorizeRoles('admin', 'super_admin'), 
    couponController.createCoupon
);


module.exports = router;