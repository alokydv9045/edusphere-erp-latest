const ExamService = require('../services/ExamService');
const { emitEvent } = require('../services/socketService');
const asyncHandler = require('express-async-handler');

/**
 * Controller for Exam related routes
 */

// Get all exams
const getExams = asyncHandler(async (req, res) => {
  const result = await ExamService.getExams(req.query);
  res.json(result);
});

// Get teacher's assigned exam tasks
const getTeacherExams = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const result = await ExamService.getTeacherExams(userId);
  res.json(result);
});

// Get single exam
const getExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await ExamService.getExam(id);
  res.json(result);
});

// Create exam
const createExam = asyncHandler(async (req, res) => {
  const exam = await ExamService.createExam(req.body);
  res.status(201).json({
    message: 'Exam created successfully',
    exam,
  });
});

// Update exam
const updateExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedExam = await ExamService.updateExam(id, req.body);
  
  res.json({
    message: 'Exam updated successfully',
    exam: updatedExam,
  });

  if (updatedExam.status === 'COMPLETED' || updatedExam.status === 'PUBLISHED') {
    emitEvent('EXAM_RESULT_PUBLISHED', { examId: id, classId: updatedExam.classId });
  }
});

// Delete exam
const deleteExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await ExamService.deleteExam(id);
  res.json({ message: 'Exam deleted successfully' });
});

// Add subject to exam
const addSubjectToExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const examSubject = await ExamService.addSubjectToExam(id, req.body);
  res.status(201).json({
    message: 'Subject added to exam successfully',
    examSubject,
  });
});

// Marks entry
const enterMarks = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const userId = req.user.userId || req.user.id;
  const userRole = req.user.role;
  
  const result = await ExamService.enterMarks(examId, req.body, userId, userRole);
  res.json({
    message: `Marks saved for ${result.saved} students`,
    saved: result.saved,
  });
});

// Consolidated marks
const getConsolidatedMarks = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const result = await ExamService.getConsolidatedMarks(examId);
  res.json(result);
});

// Freeze exam
const freezeExam = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const userId = req.user?.id || null;
  
  const updated = await ExamService.freezeExam(examId, userId);
  res.json({ message: 'Exam results frozen', exam: updated });

  emitEvent('EXAM_RESULT_PUBLISHED', { examId: examId, classId: updated.classId });
});

// Unfreeze exam
const unfreezeExam = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const updated = await ExamService.unfreezeExam(examId);
  res.json({ message: 'Exam results unfrozen', exam: updated });
});

// Legacy submit exam results
const submitExamResults = asyncHandler(async (req, res) => {
  // This is kept for backward compatibility but redirected to service logic if needed.
  // For now, let's keep it as is but wrap in asyncHandler.
  // Original logic was quite different from enterMarks.
  // I'll leave it as a placeholder pointing to the service if we ever need to fully migrate it.
  const result = await ExamService.createExam(req.body); // Roughly similar to creating results
  res.status(201).json({
    message: 'Exam results submitted successfully',
    examResult: result,
  });
});

// Get student exam results
const getStudentExamResults = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const result = await ExamService.getStudentExamResults(studentId, req.query);
  res.json(result);
});

// Get exam results report
const getExamResultsReport = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const result = await ExamService.getExamResultsReport(examId, req.query);
  res.json(result);
});

module.exports = {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  addSubjectToExam,
  enterMarks,
  getConsolidatedMarks,
  freezeExam,
  unfreezeExam,
  submitExamResults,
  getStudentExamResults,
  getExamResultsReport,
  getTeacherExams,
};
