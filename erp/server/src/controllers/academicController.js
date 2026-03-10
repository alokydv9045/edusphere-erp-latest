const prisma = require('../config/database');
const fs = require('fs');
const path = require('path');

// Academic Years
const getAcademicYears = async (req, res) => {
  try {
    const academicYears = await prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' },
    });
    res.json({ academicYears });
  } catch (error) {
    console.error('Get academic years error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createAcademicYear = async (req, res) => {
  try {
    const { name, startDate, endDate, isCurrent } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: 'Name, start date, and end date are required' });
    }

    // If this is set to current, unset others first
    if (isCurrent) {
      await prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false }
      });
    }

    const year = await prisma.academicYear.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: Boolean(isCurrent),
      }
    });

    res.status(201).json({
      message: 'Academic year created successfully',
      year,
    });
  } catch (error) {
    console.error('Create academic year error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'An academic year with this name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const setCurrentAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if year exists
    const year = await prisma.academicYear.findUnique({ where: { id } });
    if (!year) {
      return res.status(404).json({ error: 'Academic year not found' });
    }

    // Transaction to ensure atomicity
    await prisma.$transaction([
      // Unset current for all
      prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false }
      }),
      // Set new current
      prisma.academicYear.update({
        where: { id },
        data: { isCurrent: true }
      })
    ]);

    res.json({ message: 'Current academic year updated successfully' });
  } catch (error) {
    console.error('Set current academic year error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Classes
const getClasses = async (req, res) => {
  try {
    const { academicYearId } = req.query;
    const where = {};
    if (academicYearId) where.academicYearId = academicYearId;

    const classes = await prisma.class.findMany({
      where,
      include: {
        academicYear: true,
        classTeacher: {
          include: { user: true },
        },
        sections: true,
        _count: {
          select: {
            students: true,
            subjects: true,
          },
        },
      },
      orderBy: { numericValue: 'asc' },
    });
    res.json({ classes });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createClass = async (req, res) => {
  try {
    const { name, numericValue, description, academicYearId, classTeacherId } = req.body;

    if (!name || !numericValue || !academicYearId) {
      return res.status(400).json({ error: 'Name, numeric level, and academic year are required' });
    }

    const parsedNumericValue = parseInt(numericValue);
    if (isNaN(parsedNumericValue)) {
      return res.status(400).json({ error: 'Numeric level must be a valid number' });
    }

    const classData = await prisma.class.create({
      data: {
        name,
        numericValue: parsedNumericValue,
        description: description || null,
        academicYearId,
        classTeacherId: classTeacherId || null,
      },
      include: {
        academicYear: true,
        classTeacher: { include: { user: true } },
      },
    });

    res.status(201).json({
      message: 'Class created successfully',
      class: classData,
    });
  } catch (error) {
    console.error('Create class error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A class with this name already exists in this academic year' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'The selected academic year does not exist' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Subjects
const getSubjects = async (req, res) => {
  try {
    const { classId } = req.query;

    const where = {};
    if (classId) where.classId = classId;

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        class: true,
        teachers: {
          include: {
            teacher: {
              include: { user: true },
            },
          },
        },
      },
    });

    res.json({ subjects });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createSubject = async (req, res) => {
  try {
    const { name, code, description, classId, type, totalMarks, passMarks, teacherId } = req.body;

    if (!name || !code || !classId) {
      return res.status(400).json({ error: 'Name, code, and class are required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const subject = await tx.subject.create({
        data: {
          name,
          code,
          description: description || null,
          classId,
          type: type || 'CORE',
          totalMarks: parseInt(totalMarks) || 100,
          passMarks: parseInt(passMarks) || 40,
        },
        include: { class: true },
      });

      if (teacherId) {
        await tx.subjectTeacher.create({
          data: {
            subjectId: subject.id,
            teacherId,
          },
        });
      }

      return subject;
    });

    res.status(201).json({
      message: 'Subject created successfully',
      subject: result,
    });
  } catch (error) {
    console.error('Create subject error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A subject with this code already exists' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'The selected class or teacher does not exist' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const assignSubjectTeacher = async (req, res) => {
  try {
    const { subjectId, teacherId } = req.body;

    if (!subjectId || !teacherId) {
      return res.status(400).json({ error: 'Subject and Teacher IDs are required' });
    }

    const assignment = await prisma.subjectTeacher.create({
      data: {
        subjectId,
        teacherId,
      },
      include: {
        subject: true,
        teacher: { include: { user: true } },
      }
    });

    res.status(201).json({
      message: 'Teacher assigned to subject successfully',
      assignment,
    });
  } catch (error) {
    console.error('Assign subject teacher error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'This teacher is already assigned to this subject' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Sections
const getSections = async (req, res) => {
  try {
    const { classId } = req.query;

    const where = {};
    if (classId) where.classId = classId;

    const sections = await prisma.section.findMany({
      where,
      include: {
        class: true,
        _count: {
          select: { students: true },
        },
      },
    });

    res.json({ sections });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createSection = async (req, res) => {
  try {
    const { name, classId, maxStudents } = req.body;

    const section = await prisma.section.create({
      data: {
        name,
        classId,
        maxStudents: parseInt(maxStudents) || 40,
      },
      include: { class: true },
    });

    res.status(201).json({
      message: 'Section created successfully',
      section,
    });
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, numericValue, description, academicYearId, classTeacherId } = req.body;

    if (!name || !numericValue || !academicYearId) {
      return res.status(400).json({ error: 'Name, numeric level, and academic year are required' });
    }

    const parsedNumericValue = parseInt(numericValue);
    if (isNaN(parsedNumericValue)) {
      return res.status(400).json({ error: 'Numeric level must be a valid number' });
    }

    const existing = await prisma.class.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Class not found' });

    const classData = await prisma.class.update({
      where: { id },
      data: {
        name,
        numericValue: parsedNumericValue,
        description: description || null,
        academicYearId,
        classTeacherId: classTeacherId || null,
      },
      include: { academicYear: true, classTeacher: { include: { user: true } } },
    });

    res.json({ message: 'Class updated successfully', class: classData });
  } catch (error) {
    console.error('Update class error:', error);
    if (error.code === 'P2002') return res.status(400).json({ error: 'A class with this name already exists in this academic year' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.class.findUnique({
      where: { id },
      include: { _count: { select: { students: true, sections: true, subjects: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Class not found' });

    if (existing._count.students > 0) {
      return res.status(400).json({ error: `Cannot delete class with ${existing._count.students} enrolled student(s). Remove students first.` });
    }

    // Delete related subjects and sections first
    await prisma.subject.deleteMany({ where: { classId: id } });
    await prisma.section.deleteMany({ where: { classId: id } });
    await prisma.class.delete({ where: { id } });

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, classId, type, totalMarks, passMarks } = req.body;

    if (!name || !code || !classId) {
      return res.status(400).json({ error: 'Name, code, and class are required' });
    }

    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Subject not found' });

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        name,
        code,
        description: description || null,
        classId,
        type: type || 'CORE',
        totalMarks: parseInt(totalMarks) || 100,
        passMarks: parseInt(passMarks) || 40,
      },
      include: { class: true },
    });

    res.json({ message: 'Subject updated successfully', subject });
  } catch (error) {
    console.error('Update subject error:', error);
    if (error.code === 'P2002') return res.status(400).json({ error: 'A subject with this code already exists' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Subject not found' });

    await prisma.subject.delete({ where: { id } });
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    if (error.code === 'P2003') return res.status(400).json({ error: 'Cannot delete subject as it is referenced by other records' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, classId, maxStudents } = req.body;

    if (!name || !classId) {
      return res.status(400).json({ error: 'Name and class are required' });
    }

    const existing = await prisma.section.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Section not found' });

    const section = await prisma.section.update({
      where: { id },
      data: { name, classId, maxStudents: parseInt(maxStudents) || 40 },
      include: { class: true },
    });

    res.json({ message: 'Section updated successfully', section });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.section.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Section not found' });

    if (existing._count.students > 0) {
      return res.status(400).json({ error: `Cannot delete section with ${existing._count.students} enrolled student(s). Reassign students first.` });
    }

    await prisma.section.delete({ where: { id } });
    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Dashboard Stats
const getAcademicDashboardStats = async (req, res) => {
  try {
    const totalYears = await prisma.academicYear.count();
    const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    const totalClasses = await prisma.class.count();
    const totalSections = await prisma.section.count();
    const totalSubjects = await prisma.subject.count();
    const totalTeachers = await prisma.teacher.count({ where: { status: 'ACTIVE' } });

    res.json({
      stats: {
        totalYears,
        currentYear,
        totalClasses,
        totalSections,
        totalSubjects,
        totalTeachers,
      }
    });
  } catch (error) {
    console.error('Get academic stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Timetables
const getTimetables = async (req, res) => {
  try {
    const { classId, type } = req.query;
    const where = { isActive: true };
    if (classId) where.classId = classId;
    if (type) where.type = type;

    // For students/teachers, we might want to restrict based on their class
    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findFirst({ where: { userId: req.user.userId } });
      if (student && student.currentClassId) {
        where.classId = student.currentClassId;
      }
    } else if (req.user.role === 'TEACHER') {
      // Teachers can see for their assigned class or based on the classId filter
    }

    const timetables = await prisma.timetable.findMany({
      where,
      include: {
        class: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ timetables });
  } catch (error) {
    console.error('Get timetables error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createTimetable = async (req, res) => {
  try {
    const { name, classId, type, effectiveFrom, effectiveTo } = req.body;
    const pdfUrl = req.file ? `/uploads/timetables/${req.file.filename}` : null;

    if (!name || !classId || !effectiveFrom) {
      return res.status(400).json({ error: 'Name, class, and effective date are required' });
    }

    // Verify classId exists
    const classExists = await prisma.class.findUnique({ where: { id: classId } });
    if (!classExists) {
      return res.status(400).json({ error: 'Class not found with given classId' });
    }

    const timetable = await prisma.timetable.create({
      data: {
        name,
        classId,
        type: type || 'DAILY',
        pdfUrl,
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      },
      include: { class: true },
    });

    res.status(201).json({
      message: 'Timetable created successfully',
      timetable,
    });
  } catch (error) {
    console.error('Create timetable error:', error?.message || error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
};


const deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    // Find timetable first to get pdfUrl
    const timetable = await prisma.timetable.findUnique({ where: { id } });
    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }

    // Hard delete from DB
    await prisma.timetable.delete({ where: { id } });

    // Delete physical PDF file if it exists
    if (timetable.pdfUrl) {
      const filename = path.basename(timetable.pdfUrl);
      const filePath = path.join(__dirname, '..', '..', 'uploads', 'timetables', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAcademicYears,
  createAcademicYear,
  setCurrentAcademicYear,
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  assignSubjectTeacher,
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getAcademicDashboardStats,
  getTimetables,
  createTimetable,
  deleteTimetable,
};

