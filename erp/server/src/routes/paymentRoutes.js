const express = require('express');
const { createOrder, verifyPayment, getMyPaymentHistory } = require('../controllers/paymentController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLogger');

const router = express.Router();

router.use(authMiddleware);

// Create Razorpay order for a fee ledger
router.post('/create-order', requireRole('STUDENT', 'PARENT'), auditMiddleware('CREATE_RAZORPAY_ORDER'), createOrder);

// Verify Razorpay payment after checkout
router.post('/verify', requireRole('STUDENT', 'PARENT'), auditMiddleware('VERIFY_RAZORPAY_PAYMENT'), verifyPayment);

// Get my payment history
router.get('/my-history', requireRole('STUDENT', 'PARENT'), getMyPaymentHistory);

module.exports = router;
