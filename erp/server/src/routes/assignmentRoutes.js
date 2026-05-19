const express = require('express');
const {
  createAssignment,
  getStudentAssignments,
  getTeacherAssignments,
  getAssignmentDetails,
  deleteAssignment,
} = require('../controllers/assignmentController');
const {
  submitAssignment,
  gradeSubmission,
} = require('../controllers/submissionController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { createUploader } = require('../utils/fileUpload');

const router = express.Router();

const uploadAssignment = createUploader({ 
  folder: 'assignments', 
  type: 'all', 
  maxSizeBytes: 10 * 1024 * 1024 // 10MB
});

const uploadSubmission = createUploader({ 
  folder: 'submissions', 
  type: 'all', 
  maxSizeBytes: 10 * 1024 * 1024 // 10MB
});

router.use(authMiddleware);

// Assignment routes
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), uploadAssignment.single('file'), createAssignment);
router.get('/student', requireRole('STUDENT'), getStudentAssignments);
router.get('/teacher', requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getTeacherAssignments);
router.get('/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'), getAssignmentDetails);
router.delete('/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), deleteAssignment);

// Submission routes
router.post('/submit', requireRole('STUDENT'), uploadSubmission.single('file'), submitAssignment);
router.put('/submissions/:submissionId/grade', requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), gradeSubmission);

module.exports = router;
