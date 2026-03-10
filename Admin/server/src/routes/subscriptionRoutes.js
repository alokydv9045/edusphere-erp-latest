const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription
} = require('../controllers/subscriptionController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all subscriptions
router.get('/', getAllSubscriptions);

// Get subscription by ID
router.get('/:id', getSubscriptionById);

// Create new subscription
router.post('/', createSubscription);

// Update subscription
router.put('/:id', updateSubscription);

module.exports = router;