const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  activateUser,
  deactivateUser
} = require('../controllers/adminUserController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all users
router.get('/', getAllUsers);

// Get user by ID
router.get('/:id', getUserById);

// Create new user (admin only)
router.post('/', requireRole('SUPER_ADMIN'), createUser);

// Update user (PATCH for REST compliance)
router.patch('/:id', updateUser);

// Delete user (admin only)
router.delete('/:id', requireRole('SUPER_ADMIN'), deleteUser);

// Change password
router.put('/:id/password', changePassword);

// Activate user
router.post('/:id/activate', activateUser);

// Deactivate user
router.post('/:id/deactivate', deactivateUser);

module.exports = router;