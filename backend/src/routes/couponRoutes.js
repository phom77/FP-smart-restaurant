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

router.get('/:id', verifyToken, authorizeRoles('admin', 'super_admin'), couponController.getCouponById);
router.put('/:id', verifyToken, authorizeRoles('admin', 'super_admin'), couponController.updateCoupon);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'super_admin'), couponController.deleteCoupon);

module.exports = router;