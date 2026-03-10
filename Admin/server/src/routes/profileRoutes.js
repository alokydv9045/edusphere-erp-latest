const express = require('express');
const { getProfile, updateProfile, changePassword } = require('../controllers/profileController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/profile - Get user profile
router.get('/', getProfile);

// PUT /api/profile - Update profile
router.put('/', updateProfile);

// POST /api/profile/change-password - Change password
router.post('/change-password', changePassword);

module.exports = router;
