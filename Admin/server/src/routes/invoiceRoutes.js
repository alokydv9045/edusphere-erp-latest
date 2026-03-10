const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice
} = require('../controllers/invoiceController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all invoices
router.get('/', getAllInvoices);

// Get invoice by ID
router.get('/:id', getInvoiceById);

// Create new invoice
router.post('/', createInvoice);

// Update invoice
router.put('/:id', updateInvoice);

module.exports = router;