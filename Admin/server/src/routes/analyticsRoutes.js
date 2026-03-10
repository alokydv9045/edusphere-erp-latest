const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  getDashboard,
  getRevenue,
  getSchoolsGrowth,
  getStudentTrends,
  getSubscriptionDistribution
} = require('../controllers/analyticsController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get dashboard analytics
router.get('/dashboard', getDashboard);

// Get revenue analytics
router.get('/revenue', getRevenue);

// Get schools growth
router.get('/schools-growth', getSchoolsGrowth);

// Get student trends
router.get('/student-trends', getStudentTrends);

// Get subscription distribution
router.get('/subscription-distribution', getSubscriptionDistribution);

module.exports = router;