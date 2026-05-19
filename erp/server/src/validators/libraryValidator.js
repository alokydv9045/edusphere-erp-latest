const { z } = require('zod');

/**
 * Validator schemas for Library routes
 */

const issueBookSchema = z.object({
    bookId: z.string().min(1, 'Book ID is required'),
    studentId: z.string().min(1, 'Student ID is required'),
    dueDate: z.string().min(1, 'Due date is required'),
    remarks: z.string().optional(),
});

const returnBookSchema = z.object({
    issueId: z.string().min(1, 'Issue ID is required'),
    returnDate: z.string().optional(),
    condition: z.enum(['GOOD', 'DAMAGED', 'LOST']).optional(),
    fine: z.number().min(0).optional(),
    remarks: z.string().optional(),
});

const addBookSchema = z.object({
    title: z.string().min(1, 'Book title is required'),
    author: z.string().min(1, 'Author is required'),
    isbn: z.string().optional(),
    category: z.string().optional(),
    publisher: z.string().optional(),
    edition: z.string().optional(),
    totalCopies: z.number().int().min(1).optional().or(z.string().regex(/^\d+$/)),
    shelfLocation: z.string().optional(),
    description: z.string().optional(),
});

const updateBookSchema = addBookSchema.partial();

module.exports = {
    issueBookSchema,
    returnBookSchema,
    addBookSchema,
    updateBookSchema,
};
