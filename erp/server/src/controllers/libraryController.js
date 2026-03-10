const prisma = require('../config/database');

// Get all books
const getBooks = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 25 } = req.query;

    const where = {};
    if (category) where.category = category;
    // Note: Book model has no 'status' field — skip that filter
    if (status === 'active') where.isActive = true;
    else if (status === 'inactive') where.isActive = false;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
        { publisher: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const books = await prisma.book.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.book.count({ where });

    res.json({
      books,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single book
const getBook = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findUnique({
      where: { id },
      // FIXED: relation field is 'issues' not 'issueHistory'
      include: {
        issues: {
          include: {
            student: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
          orderBy: { issueDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ book });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create book
const createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      publisher,
      publishedYear,
      category,
      description,
      totalCopies,
      shelfLocation,
    } = req.body;

    if (!title || !author || !category) {
      return res.status(400).json({ error: 'Title, author, and category are required' });
    }

    // Check if ISBN already exists
    if (isbn) {
      const existing = await prisma.book.findUnique({
        where: { isbn },
      });

      if (existing) {
        return res.status(400).json({ error: 'ISBN already exists' });
      }
    }

    const copies = parseInt(totalCopies) || 1;

    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        publisher,
        publishedYear: publishedYear ? parseInt(publishedYear) : null,
        category,
        description,
        totalCopies: copies,
        availableCopies: copies,
        shelfLocation,
      },
    });

    res.status(201).json({
      message: 'Book created successfully',
      book,
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update book
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const book = await prisma.book.findUnique({ where: { id } });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const allowedUpdates = [
      'title',
      'author',
      'publisher',
      'publishedYear',
      'category',
      'description',
      'totalCopies',
      'shelfLocation',
      'isActive',
    ];

    const updateData = {};
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        if (key === 'publishedYear' || key === 'totalCopies') {
          updateData[key] = parseInt(updates[key]);
        } else {
          updateData[key] = updates[key];
        }
      }
    });

    // If total copies changed, adjust available copies
    if (updateData.totalCopies) {
      const difference = updateData.totalCopies - book.totalCopies;
      updateData.availableCopies = Math.max(0, book.availableCopies + difference);
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: 'Book updated successfully',
      book: updatedBook,
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Issue book
const issueBook = async (req, res) => {
  try {
    const { bookId, studentId, dueDate } = req.body;

    if (!bookId || !studentId) {
      return res.status(400).json({ error: 'Book ID and Student ID are required' });
    }

    // Check book availability
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({ error: 'No copies available' });
    }

    // Check if student has reached max books limit
    // FIXED: using prisma.libraryIssue (correct model name)
    const activeIssues = await prisma.libraryIssue.count({
      where: {
        studentId,
        status: 'ISSUED',
      },
    });

    const maxBooksAllowed = parseInt(process.env.MAX_BOOKS_PER_STUDENT) || 5;
    if (activeIssues >= maxBooksAllowed) {
      return res.status(400).json({
        error: `Student has already issued maximum of ${maxBooksAllowed} books`,
      });
    }

    // Calculate due date if not provided
    const issueDueDate = dueDate
      ? new Date(dueDate)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days default

    // FIXED: using prisma.libraryIssue (correct Prisma model name for LibraryIssue)
    // FIXED: using 'issueDate' and 'dueDate' which are the actual schema field names
    const issue = await prisma.libraryIssue.create({
      data: {
        bookId,
        studentId,
        issueDate: new Date(),
        dueDate: issueDueDate,
        status: 'ISSUED',
        issuedBy: req.user.userId,
      },
      include: {
        book: true,
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    // Update available copies
    await prisma.book.update({
      where: { id: bookId },
      data: {
        availableCopies: book.availableCopies - 1,
      },
    });

    res.status(201).json({
      message: 'Book issued successfully',
      issue,
    });
  } catch (error) {
    console.error('Issue book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Return book
const returnBook = async (req, res) => {
  try {
    const { issueId } = req.body;

    if (!issueId) {
      return res.status(400).json({ error: 'Issue ID is required' });
    }

    // FIXED: using prisma.libraryIssue
    const issue = await prisma.libraryIssue.findUnique({
      where: { id: issueId },
      include: { book: true },
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue record not found' });
    }

    if (issue.status === 'RETURNED') {
      return res.status(400).json({ error: 'Book already returned' });
    }

    const returnDate = new Date();
    const dueDate = new Date(issue.dueDate);
    const isOverdue = returnDate > dueDate;

    // Calculate fine if overdue
    let fine = 0;
    if (isOverdue) {
      const daysOverdue = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      const finePerDay = parseFloat(process.env.LIBRARY_FINE_PER_DAY) || 5;
      fine = daysOverdue * finePerDay;
    }

    // FIXED: schema fields are 'returnDate', 'fineAmount', 'finePaid', 'returnedBy'
    const updatedIssue = await prisma.libraryIssue.update({
      where: { id: issueId },
      data: {
        returnDate,
        status: isOverdue ? 'OVERDUE' : 'RETURNED',
        fineAmount: fine,
        returnedBy: req.user.userId,
      },
      include: {
        book: true,
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    // Update available copies
    await prisma.book.update({
      where: { id: issue.bookId },
      data: {
        availableCopies: issue.book.availableCopies + 1,
      },
    });

    res.json({
      message: isOverdue ? 'Book returned with fine' : 'Book returned successfully',
      issue: updatedIssue,
      fine: fine > 0 ? fine : 0,
    });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get book issues
// FIXED: using prisma.libraryIssue (correct Prisma accessor for model LibraryIssue)
const getBookIssues = async (req, res) => {
  try {
    const { studentId, bookId, status, page = 1, limit = 25 } = req.query;

    const where = {};
    if (studentId) where.studentId = studentId;
    if (bookId) where.bookId = bookId;
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const issues = await prisma.libraryIssue.findMany({
      where,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
          },
        },
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
            currentClass: {
              select: { name: true },
            },
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: { issueDate: 'desc' },
    });

    const total = await prisma.libraryIssue.count({ where });

    res.json({
      issues,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get book issues error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get overdue books
const getOverdueBooks = async (req, res) => {
  try {
    const now = new Date();

    // FIXED: using prisma.libraryIssue with correct field and status
    const overdueIssues = await prisma.libraryIssue.findMany({
      where: {
        status: { in: ['ISSUED', 'OVERDUE'] },
        dueDate: {
          lt: now,
        },
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
          },
        },
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, phone: true },
            },
            currentClass: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Calculate fine for each overdue book
    const finePerDay = parseFloat(process.env.LIBRARY_FINE_PER_DAY) || 5;

    const overdueWithFines = overdueIssues.map((issue) => {
      const daysOverdue = Math.ceil((now - new Date(issue.dueDate)) / (1000 * 60 * 60 * 24));
      const calculatedFine = daysOverdue * finePerDay;

      return {
        ...issue,
        daysOverdue,
        calculatedFine,
      };
    });

    res.json({
      overdueBooks: overdueWithFines,
      total: overdueWithFines.length,
    });
  } catch (error) {
    console.error('Get overdue books error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getBooks,
  getBook,
  createBook,
  updateBook,
  issueBook,
  returnBook,
  getBookIssues,
  getOverdueBooks,
};
