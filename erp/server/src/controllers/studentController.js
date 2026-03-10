const studentService = require('../services/studentService');
const studentRepo = require('../repositories/studentRepository');
const asyncHandler = require('../utils/asyncHandler');
const NotFoundError = require('../errors/NotFoundError');

/**
 * Get all students with filters
 * Route: GET /api/students
 */
const getStudents = asyncHandler(async (req, res) => {
  const result = await studentService.getStudents(req.query);

  res.status(200).json(result);
});

/**
 * Get single student
 * Route: GET /api/students/:id
 */
const getStudent = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentById(req.params.id);

  res.status(200).json({ student });
});

/**
 * Create basic student
 * Route: POST /api/students
 */
const createStudent = asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(req.body);

  res.status(201).json({
    message: 'Student created successfully',
    student,
  });
});

/**
 * Update student
 * Route: PUT /api/students/:id
 */
const updateStudent = asyncHandler(async (req, res) => {
  const student = await studentService.updateStudent(req.params.id, req.body);

  res.status(200).json({
    message: 'Student updated successfully',
    student,
  });
});

/**
 * Delete student (soft delete)
 * Route: DELETE /api/students/:id
 */
const deleteStudent = asyncHandler(async (req, res) => {
  await studentService.deleteStudent(req.params.id);

  res.status(200).json({ message: 'Student deleted successfully' });
});

/**
 * Get student attendance
 * Route: GET /api/students/:id/attendance
 */
const getStudentAttendance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const result = await studentService.getStudentAttendance(req.params.id, startDate, endDate);

  res.status(200).json(result);
});

/**
 * Register new student (Comprehensive)
 * Route: POST /api/students/register
 */
const registerStudent = asyncHandler(async (req, res) => {
  // Pass req.user for audit logging (who collected the fee)
  const result = await studentService.registerStudent(req.body, req.user);

  res.status(201).json({
    success: true,
    message: 'Student registered successfully',
    data: result
  });
});

/**
 * Get current student profile (For STUDENT role)
 * Route: GET /api/students/me
 */
const getMeStudent = asyncHandler(async (req, res) => {
  // Use repository directly to bypass any Admin-only filters in service
  const student = await studentRepo.findByUserId(req.user.userId);
  if (!student) {
    throw new NotFoundError('Student profile not found for this user');
  }

  res.status(200).json({ student });
});

/**
 * Update current student profile (For STUDENT role)
 * Route: PUT /api/students/me
 */
const updateMeStudent = asyncHandler(async (req, res) => {
  // 1. Get the student record for the logged-in user
  const student = await studentRepo.findByUserId(req.user.userId);
  if (!student) {
    throw new NotFoundError('Student profile not found for this user');
  }

  // 2. Filter allowed updates to prevent privilege escalation or core identity changes
  const allowedUpdates = {};
  const { phone, address, emergencyContact, emergencyPhone, medicalConditions, allergies } = req.body;

  // User model fields
  if (phone !== undefined) allowedUpdates.phone = phone;
  if (address !== undefined) allowedUpdates.address = address;

  // Student model fields
  if (emergencyContact !== undefined) allowedUpdates.emergencyContact = emergencyContact;
  if (emergencyPhone !== undefined) allowedUpdates.emergencyPhone = emergencyPhone;
  if (medicalConditions !== undefined) allowedUpdates.medicalConditions = medicalConditions;
  if (allergies !== undefined) allowedUpdates.allergies = allergies;

  // 3. Update using student service
  const updatedStudent = await studentService.updateStudent(student.id, allowedUpdates);

  res.status(200).json({
    message: 'Profile updated successfully',
    student: updatedStudent,
  });
});

module.exports = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentAttendance,
  registerStudent,
  getMeStudent,
  updateMeStudent
};
