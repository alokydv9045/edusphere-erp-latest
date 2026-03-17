const libraryService = require('../services/LibraryService');
const asyncHandler = require('../utils/asyncHandler');

// Get all books with advanced filtering
const getBooks = asyncHandler(async (req, res) => {
  const result = await libraryService.getBooks(req.query);
  res.json(result);
});

// Get single book with detailed history
const getBook = asyncHandler(async (req, res) => {
  const book = await libraryService.getBookById(req.params.id);
  res.json({ book });
});

// Create book
const createBook = asyncHandler(async (req, res) => {
  const book = await libraryService.createBook(req.body);
  res.status(201).json({ message: 'Book created successfully', book });
});

// Update book
const updateBook = asyncHandler(async (req, res) => {
  const book = await libraryService.updateBook(req.params.id, req.body);
  res.json({ message: 'Book updated successfully', book });
});

// Issue book
const issueBook = asyncHandler(async (req, res) => {
  const result = await libraryService.issueBook(req.body, req.user.userId);
  res.status(201).json({ message: 'Book issued successfully', issue: result });
});

// Return book with condition tracking
const returnBook = asyncHandler(async (req, res) => {
  const result = await libraryService.returnBook(req.body, req.user.userId);
  res.json({ message: 'Book returned successfully', issue: result.updatedIssue, fine: result.fine });
});

// Renew book
const renewBook = asyncHandler(async (req, res) => {
  const updatedIssue = await libraryService.renewBook(req.body.issueId);
  res.json({ message: 'Book renewed successfully', issue: updatedIssue });
});

// Reserve book
const reserveBook = asyncHandler(async (req, res) => {
  const reservation = await libraryService.reserveBook(req.body);
  res.status(201).json({ message: 'Reservation created successfully', reservation });
});

// Get book issues history
const getBookIssues = asyncHandler(async (req, res) => {
  const result = await libraryService.getBookIssues(req.query);
  res.json(result);
});

// Get overdue books
const getOverdueBooks = asyncHandler(async (req, res) => {
  const overdueBooks = await libraryService.getOverdueBooks();
  res.json({ overdueBooks, total: overdueBooks.length });
});

const getReservations = asyncHandler(async (req, res) => {
  const reservations = await libraryService.getReservations(req.query.status);
  res.json({ success: true, reservations });
});

module.exports = {
  getBooks,
  getBook,
  createBook,
  updateBook,
  issueBook,
  returnBook,
  renewBook,
  reserveBook,
  getReservations,
  getBookIssues,
  getOverdueBooks,
};
