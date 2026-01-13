const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create-intent', paymentController.createPaymentIntent);
router.post('/mock', paymentController.mockPayment);
router.post('/confirm', paymentController.confirmPayment); 
router.post('/webhook', express.raw({type: 'application/json'}), paymentController.handleWebhook);
router.post('/confirm-cash', paymentController.confirmCashPayment);

module.exports = router;