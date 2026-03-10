const express = require('express');
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  issueBook,
  returnBook,
  getBookIssues,
  getOverdueBooks,
} = require('../controllers/libraryController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Book management
router.get('/books', getBooks);
router.get('/books/:id', getBook);
router.post('/books', requireRole('SUPER_ADMIN', 'ADMIN', 'LIBRARIAN'), createBook);
router.put('/books/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'LIBRARIAN'), updateBook);

// Book issue/return
router.post('/issue', requireRole('SUPER_ADMIN', 'ADMIN', 'LIBRARIAN'), issueBook);
router.post('/return', requireRole('SUPER_ADMIN', 'ADMIN', 'LIBRARIAN'), returnBook);

// Reports
router.get('/issues', getBookIssues);
router.get('/overdue', getOverdueBooks);

module.exports = router;
