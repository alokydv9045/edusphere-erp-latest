const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const prisma = require('../config/database');
const feeService = require('../services/feeService');
const { getConfigValue } = require('../utils/configHelper');
const { DEFAULTS, ROLES } = require('../constants');

/**
 * Create a Razorpay order for a specific fee ledger
 * POST /api/payments/create-order
 * Body: { ledgerId, amount }
 */
const createOrder = async (req, res) => {
    try {
        const { ledgerId, amount } = req.body;
        const userId = req.user.userId || req.user.id;

        if (!ledgerId || !amount || amount <= 0) {
            return res.status(400).json({ error: 'ledgerId and a positive amount are required' });
        }

        // Verify the ledger exists and belongs to this student
        const ledger = await prisma.studentFeeLedger.findUnique({
            where: { id: ledgerId },
            include: {
                student: { select: { userId: true } },
                feeStructure: { select: { name: true } },
            },
        });

        if (!ledger) {
            return res.status(404).json({ error: 'Fee ledger not found' });
        }

        // Students can only pay their own fees
        if (req.user.role === ROLES.STUDENT && ledger.student.userId !== userId) {
            return res.status(403).json({ error: 'You can only pay your own fees' });
        }

        if (ledger.totalPending <= 0) {
            return res.status(400).json({ error: 'This fee is already fully paid' });
        }

        // Cap amount to what's actually pending
        const payableAmount = Math.min(parseFloat(amount), ledger.totalPending);

        // Create Razorpay order (amount in paise)
        const order = await razorpay.orders.create({
            amount: Math.round(payableAmount * 100),
            currency: await getConfigValue('fee_currency', DEFAULTS.CURRENCY),
            receipt: `fee_${ledgerId}_${Date.now()}`,
            notes: {
                ledgerId,
                studentId: ledger.studentId,
                feeType: ledger.feeStructure.name,
            },
        });

        res.status(201).json({
            orderId: order.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            amount: payableAmount,
            amountInPaise: order.amount,
            currency: order.currency,
            ledgerId,
            feeType: ledger.feeStructure.name,
        });
    } catch (error) {
        console.error('Create Razorpay order error:', error);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
};

/**
 * Verify Razorpay payment signature and record the payment
 * POST /api/payments/verify
 * Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, ledgerId }
 */
const verifyPayment = async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, ledgerId } = req.body;
        const userId = req.user.userId || req.user.id;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !ledgerId) {
            return res.status(400).json({ error: 'All payment fields are required' });
        }

        // Verify HMAC signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            return res.status(400).json({ error: 'Payment verification failed — invalid signature' });
        }

        // Fetch the Razorpay order to get the amount
        const rpOrder = await razorpay.orders.fetch(razorpayOrderId);
        const amountPaid = rpOrder.amount / 100; // Convert paise to rupees

        // Fetch ledger details
        const ledger = await prisma.studentFeeLedger.findUnique({
            where: { id: ledgerId },
            include: {
                student: { select: { userId: true } },
                feeStructure: true,
            },
        });

        if (!ledger) {
            return res.status(404).json({ error: 'Ledger not found' });
        }

        // Record the payment via the existing fee service
        const payment = await feeService.createFeePayment(
            {
                studentId: ledger.studentId,
                ledgerId: ledger.id,
                amount: amountPaid,
                paymentMode: 'ONLINE',
                transactionId: razorpayPaymentId,
                forMonth: new Date().getMonth() + 1,
                forYear: new Date().getFullYear(),
            },
            userId,
        );

        // Update the payment record with Razorpay IDs
        if (payment && payment.id) {
            await prisma.feePayment.update({
                where: { id: payment.id },
                data: {
                    razorpayOrderId,
                    razorpayPaymentId,
                    razorpaySignature,
                },
            });
        }

        res.json({
            message: 'Payment verified and recorded successfully',
            payment,
            amountPaid,
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: error.message || 'Payment verification failed' });
    }
};

/**
 * Get the logged-in student's payment history
 * GET /api/payments/my-history
 */
const getMyPaymentHistory = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        const student = await prisma.student.findFirst({ where: { userId } });
        if (!student) {
            return res.status(404).json({ error: 'Student profile not found' });
        }

        const payments = await prisma.feePayment.findMany({
            where: { studentId: student.id },
            include: {
                feeStructure: { select: { name: true } },
                ledger: { select: { totalPayable: true, totalPaid: true, totalPending: true } },
            },
            orderBy: { paymentDate: 'desc' },
            take: 20,
        });

        res.json({ payments });
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { createOrder, verifyPayment, getMyPaymentHistory };
