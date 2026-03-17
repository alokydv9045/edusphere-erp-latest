const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');
const logger = require('../config/logger');

// Create a new assignment (Teacher only)
const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, dueDate, subjectId, classId, sectionId } = req.body;
  const teacherId = req.user.teacherId; // Assuming teacherId is available in req.user after auth

  if (!teacherId) {
    throw new ValidationError('Only teachers can create assignments');
  }

  // Handle file upload (path from multer)
  const filePath = req.file ? `/uploads/assignments/${req.file.filename}` : null;

  const assignment = await prisma.assignment.create({
    data: {
      title,
      description,
      dueDate: new Date(dueDate),
      filePath,
      subjectId,
      classId,
      sectionId: sectionId || null,
      teacherId,
    },
  });

  res.status(201).json({
    message: 'Assignment created successfully',
    assignment,
  });
});

// Get assignments for a student (based on their class/section)
const getStudentAssignments = asyncHandler(async (req, res) => {
  const student = await prisma.student.findFirst({
    where: { userId: req.user.id },
  });

  if (!student) {
    throw new NotFoundError('Student profile not found');
  }

  const assignments = await prisma.assignment.findMany({
    where: {
      classId: student.currentClassId,
      OR: [
        { sectionId: student.sectionId },
        { sectionId: null },
      ],
    },
    include: {
      subject: { select: { name: true } },
      teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
      submissions: {
        where: { studentId: student.id },
        select: { status: true, grade: true, submittedAt: true },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  res.json({ assignments });
});

// Get assignments created by a teacher
const getTeacherAssignments = asyncHandler(async (req, res) => {
  const teacherId = req.user.teacherId;

  if (!teacherId) {
    throw new ValidationError('Teacher ID not found');
  }

  const assignments = await prisma.assignment.findMany({
    where: { teacherId },
    include: {
      subject: { select: { name: true } },
      class: { select: { name: true } },
      section: { select: { name: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ assignments });
});

// Get assignment details with submissions (for teacher)
const getAssignmentDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      subject: { select: { name: true } },
      class: { select: { name: true } },
      section: { select: { name: true } },
      submissions: {
        include: {
          student: {
            select: {
              admissionNumber: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  });

  if (!assignment) {
    throw new NotFoundError('Assignment not found');
  }

  res.json({ assignment });
});

// Delete assignment
const deleteAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teacherId = req.user.teacherId;

  const assignment = await prisma.assignment.findUnique({ where: { id } });

  if (!assignment) {
    throw new NotFoundError('Assignment not found');
  }

  if (assignment.teacherId !== teacherId && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    throw new ValidationError('You are not authorized to delete this assignment');
  }

  await prisma.assignment.delete({ where: { id } });

  res.json({ message: 'Assignment deleted successfully' });
});

module.exports = {
  createAssignment,
  getStudentAssignments,
  getTeacherAssignments,
  getAssignmentDetails,
  deleteAssignment,
};
