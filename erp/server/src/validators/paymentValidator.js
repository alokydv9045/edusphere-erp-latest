const { z } = require('zod');

/**
 * Validator schemas for Payment routes (Razorpay integration)
 */

const createOrderSchema = z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    amount: z.number().positive('Amount must be positive'),
    feeStructureId: z.string().optional(),
    academicYearId: z.string().optional(),
    description: z.string().optional(),
});

const verifyPaymentSchema = z.object({
    razorpay_order_id: z.string().min(1, 'Order ID is required'),
    razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
    razorpay_signature: z.string().min(1, 'Signature is required'),
});

const refundSchema = z.object({
    paymentId: z.string().min(1, 'Payment ID is required'),
    amount: z.number().positive('Amount must be positive').optional(),
    reason: z.string().optional(),
});

module.exports = {
    createOrderSchema,
    verifyPaymentSchema,
    refundSchema,
};
