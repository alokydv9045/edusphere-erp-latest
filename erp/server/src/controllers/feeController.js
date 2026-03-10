const feeService = require('../services/feeService');
const studentRepo = require('../repositories/studentRepository');
const asyncHandler = require('../utils/asyncHandler');
const NotFoundError = require('../errors/NotFoundError');

// Get fee structures
const getFeeStructures = asyncHandler(async (req, res) => {
  const result = await feeService.getFeeStructures(req.query);
  res.status(200).json(result);
});

// Get students with fee status
const getFeeStudents = asyncHandler(async (req, res) => {
  const result = await feeService.getFeeStudents(req.query);
  res.status(200).json(result);
});

// Create fee structure
const createFeeStructure = asyncHandler(async (req, res) => {
  const feeStructure = await feeService.createFeeStructure(req.body);
  res.status(201).json({
    message: 'Fee structure created successfully',
    feeStructure,
  });
});

// Get single fee structure
const getFeeStructureById = asyncHandler(async (req, res) => {
  const feeStructure = await feeService.getFeeStructureById(req.params.id);
  res.status(200).json(feeStructure);
});

// Update fee structure
const updateFeeStructure = asyncHandler(async (req, res) => {
  const feeStructure = await feeService.updateFeeStructure(req.params.id, req.body);
  res.status(200).json({
    message: 'Fee structure updated successfully',
    feeStructure,
  });
});

// Delete fee structure
const deleteFeeStructure = asyncHandler(async (req, res) => {
  await feeService.deleteFeeStructure(req.params.id);
  res.status(200).json({
    message: 'Fee structure deleted successfully',
  });
});

// Get fee payments
const getFeePayments = asyncHandler(async (req, res) => {
  const result = await feeService.getFeePayments(req.query);
  res.status(200).json(result);
});

// Create fee payment
const createFeePayment = asyncHandler(async (req, res) => {
  const payment = await feeService.createFeePayment(req.body, req.user.userId);
  res.status(201).json({
    message: 'Fee payment recorded successfully',
    payment,
  });
});

// Get student fee status
const getStudentFeeStatus = asyncHandler(async (req, res) => {
  let studentId = req.params.id;
  if (studentId === 'me') {
    const student = await studentRepo.findByUserId(req.user.userId);
    if (!student) {
      throw new NotFoundError('Student profile not found for this user');
    }
    studentId = student.id;
  }
  const result = await feeService.getStudentFeeStatus(studentId, req.query.academicYearId);
  res.status(200).json(result);
});

// Request Discount / Scholarship / Adjustment
const requestAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await feeService.requestAdjustment(req.body, req.user.userId);
  res.status(201).json({
    message: 'Adjustment requested successfully',
    adjustment,
  });
});

// Approve/Reject Adjustment
const approveAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await feeService.approveAdjustment(req.params.id, req.body.status, req.user.userId);
  res.status(200).json({
    message: `Adjustment ${req.body.status.toLowerCase()}`,
    adjustment,
  });
});

// Process Refund
const processRefund = asyncHandler(async (req, res) => {
  const refund = await feeService.processRefund(req.body, req.user.userId);
  res.status(201).json({
    message: 'Refund processed successfully',
    refund,
  });
});

// Get Adjustments
const getAdjustments = asyncHandler(async (req, res) => {
  const adjustments = await feeService.getAdjustments(req.query);
  res.status(200).json({ adjustments });
});

// Get Admin Fee Stats
const getFeeStats = asyncHandler(async (req, res) => {
  const stats = await feeService.getFeeStats();
  res.status(200).json(stats);
});

module.exports = {
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
};
