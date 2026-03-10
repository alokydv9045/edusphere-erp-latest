const express = require('express');
const {
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
} = require('../controllers/examController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Exam management
router.get('/', getExams);
router.get('/teacher-tasks', requireRole('TEACHER'), getTeacherExams);

// Results — MUST be above /:id to avoid collision
router.post('/results', requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), submitExamResults);
router.get('/students/:studentId/results', getStudentExamResults);

// Single exam — wildcard /:id must come LAST in this group
router.get('/:id', getExam);
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN'), createExam);
router.put('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), updateExam);
router.delete('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), deleteExam);

// Exam subjects
router.post('/:id/subjects', requireRole('SUPER_ADMIN', 'ADMIN'), addSubjectToExam);

// Marks entry (subject teacher)
router.post('/:examId/marks', requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), enterMarks);

// Consolidated marks (class teacher / admin)
router.get('/:examId/consolidated', requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getConsolidatedMarks);

// Freeze / Unfreeze (admin only)
router.put('/:examId/freeze', requireRole('SUPER_ADMIN', 'ADMIN'), freezeExam);
router.put('/:examId/unfreeze', requireRole('SUPER_ADMIN', 'ADMIN'), unfreezeExam);

// Exam report
router.get('/:examId/report', getExamResultsReport);

module.exports = router;
