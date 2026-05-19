const express = require('express');
const {
  getFeeStructures,
  getFeeStructureById,
  updateFeeStructure,
  deleteFeeStructure,
  getFeeStudents,
  createFeeStructure,
  getFeePayments,
  createFeePayment,
  getStudentFeeStatus,
  requestAdjustment,
  approveAdjustment,
  processRefund,
  getAdjustments,
  getFeeStats,
  getClassWiseReport,
  downloadFeeStatement
} = require('../controllers/feeController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLogger');

// Zod Validation Middleware and Schemas
const validate = require('../middleware/validate');
const {
  createFeeStructureSchema,
  createFeePaymentSchema,
  requestAdjustmentSchema,
  approveAdjustmentSchema,
  processRefundSchema,
} = require('../validators/feeValidator');

const router = express.Router();

router.use(authMiddleware);

// Reports
router.get('/reports/class-wise', requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), getClassWiseReport);

// Fee structures
router.get('/structures', requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), getFeeStructures);
router.get('/structures/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), getFeeStructureById);
router.post('/structures', requireRole('SUPER_ADMIN', 'ADMIN'), auditMiddleware('CREATE_FEE_STRUCTURE'), validate(createFeeStructureSchema), createFeeStructure);
router.put('/structures/:id', requireRole('SUPER_ADMIN', 'ADMIN'), auditMiddleware('UPDATE_FEE_STRUCTURE'), validate(createFeeStructureSchema), updateFeeStructure);
router.delete('/structures/:id', requireRole('SUPER_ADMIN', 'ADMIN'), auditMiddleware('DELETE_FEE_STRUCTURE'), deleteFeeStructure);

// Fee Students List
router.get('/students', requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), getFeeStudents);

// Fee payments
router.get('/payments', requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), getFeePayments);
router.post('/payments', requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), auditMiddleware('FEE_PAYMENT'), validate(createFeePaymentSchema), createFeePayment);

// Adjustments (Discounts & Scholarships)
router.get('/stats', requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), getFeeStats);
router.get('/adjustments', requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), getAdjustments);
router.post('/adjustments/request', requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), auditMiddleware('REQUEST_ADJUSTMENT'), validate(requestAdjustmentSchema), requestAdjustment);
router.put('/adjustments/:id/approve', requireRole('SUPER_ADMIN', 'ADMIN'), auditMiddleware('APPROVE_ADJUSTMENT'), validate(approveAdjustmentSchema), approveAdjustment);

// Refunds
router.post('/refunds', requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), auditMiddleware('PROCESS_REFUND'), validate(processRefundSchema), processRefund);

// Student fee status/ledger
router.get('/students/:id/status', requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'STUDENT', 'PARENT'), getStudentFeeStatus);
router.get('/students/:id/statement', requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'STUDENT', 'PARENT'), downloadFeeStatement);

module.exports = router;
