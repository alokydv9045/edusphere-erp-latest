const express = require('express');
const { register, login, refreshToken, getMe, logout } = require('../controllers/authController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginSchema, registerSchema } = require('../validators/userValidator');

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', authMiddleware, requireRole('ADMIN'), validate(registerSchema), register);
router.post('/refresh', refreshToken);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);

module.exports = router;
