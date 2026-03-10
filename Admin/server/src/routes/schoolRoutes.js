const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool
} = require('../controllers/schoolController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all schools
router.get('/', getAllSchools);

// Get school by ID
router.get('/:id', getSchoolById);

// Create new school
router.post('/', createSchool);

// Update school
router.put('/:id', updateSchool);

// Delete school
router.delete('/:id', deleteSchool);

module.exports = router;