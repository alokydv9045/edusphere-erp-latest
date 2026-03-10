const prisma = require('../config/database');
const { getConfigValue } = require('../utils/configHelper');
const { DEFAULTS, EXAM_STATUS } = require('../constants');

// Get all exams
const getExams = async (req, res) => {
  try {
    const { academicYearId, classId, examType, status, page = 1, limit = 25 } = req.query;

    const where = {};
    if (academicYearId) where.academicYearId = academicYearId;
    if (classId) where.classId = classId;
    if (examType) where.examType = examType;
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        include: {
          class: { select: { name: true } },
          academicYear: { select: { name: true } },
          examSubjects: {
            include: {
              subject: { select: { name: true, code: true } },
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { startDate: 'desc' },
      }),
      prisma.exam.count({ where }),
    ]);

    res.json({
      exams,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get teacher's assigned exam tasks
const getTeacherExams = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) return res.status(404).json({ error: 'Teacher profile not found' });

    // Find all subjects assigned to this teacher
    const assignments = await prisma.subjectTeacher.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: {
          include: {
            class: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (assignments.length === 0) return res.json({ tasks: [] });

    // Find active exams for these classes
    const classIds = [...new Set(assignments.map((a) => a.subject.classId))];

    const exams = await prisma.exam.findMany({
      where: {
        classId: { in: classIds },
        status: { in: [EXAM_STATUS.PUBLISHED, EXAM_STATUS.IN_PROGRESS] },
        isFrozen: false,
      },
      include: {
        class: {
          select: {
            name: true,
            _count: {
              select: { students: true }
            }
          }
        },
        examSubjects: {
          include: { subject: { select: { id: true, name: true, code: true } } },
        },
        examResults: {
          select: {
            id: true,
            marks: {
              select: { subjectCode: true }
            }
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    // Format tasks: Map assignments to exams
    const tasks = [];
    exams.forEach((exam) => {
      // Find which assignments of the teacher belong to this exam's class
      const teacherClassAssignments = assignments.filter((a) => a.subject.classId === exam.classId);

      teacherClassAssignments.forEach((assignment) => {
        // Find the specific exam subject
        const es = exam.examSubjects.find((s) => s.subjectId === assignment.subjectId);
        if (!es) return;

        // Calculate progress for this specific subject
        const totalStudents = exam.class._count.students;
        const entered = exam.examResults.filter((er) =>
          er.marks.some((m) => m.subjectCode === es.subject.code)
        ).length;

        tasks.push({
          examId: exam.id,
          examName: exam.name,
          classId: exam.classId,
          className: exam.class.name,
          subjectId: es.subjectId,
          subjectName: es.subject.name,
          subjectCode: es.subject.code,
          progress: {
            entered,
            total: totalStudents,
            isComplete: entered >= totalStudents && totalStudents > 0,
          },
        });
      });
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Get teacher exams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single exam
const getExam = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        class: true,
        academicYear: true,
        examSubjects: {
          include: {
            subject: true,
          },
        },
        examResults: {
          include: {
            student: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    res.json({ exam });
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create exam
const createExam = async (req, res) => {
  try {
    const {
      name,
      description,
      examType,
      classId,
      academicYearId,
      termId,
      gradeScaleId,
      startDate,
      endDate,
      subjects, // Array of { subjectId, examDate, startTime, duration, totalMarks, passMarks, theoryMaxMarks, ... }
    } = req.body;

    if (!name || !examType || !classId || !academicYearId || !startDate) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const examData = {
      name,
      description: description || null,
      examType,
      classId,
      academicYearId,
      termId: termId || null,
      gradeScaleId: gradeScaleId || null,
      endDate: endDate ? new Date(endDate) : null,
      status: EXAM_STATUS.DRAFT,
    };

    const passPercentage = await getConfigValue('passing_percentage', DEFAULTS.PASS_PERCENTAGE);

    // If subjects are provided, include them in creation
    if (subjects && Array.isArray(subjects) && subjects.length > 0) {
      examData.examSubjects = {
        create: subjects.map(s => ({
          subjectId: s.subjectId,
          examDate: new Date(s.examDate),
          startTime: s.startTime || DEFAULTS.EXAM_START_TIME,
          duration: parseInt(s.duration) || DEFAULTS.EXAM_DURATION,
          totalMarks: parseFloat(s.totalMarks),
          passMarks: parseFloat(s.passMarks) || parseFloat(s.totalMarks) * (passPercentage / 100),
          theoryMaxMarks: parseFloat(s.theoryMaxMarks) || 0,
          practicalMaxMarks: parseFloat(s.practicalMaxMarks) || 0,
          internalMaxMarks: parseFloat(s.internalMaxMarks) || 0,
        }))
      };
    }

    const exam = await prisma.exam.create({
      data: examData,
      include: {
        class: true,
        academicYear: true,
        term: true,
        gradeScale: true,
        examSubjects: {
          include: { subject: true }
        }
      },
    });

    res.status(201).json({
      message: 'Exam created successfully',
      exam,
    });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update exam
const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const exam = await prisma.exam.findUnique({ where: { id } });

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (exam.isFrozen) {
      return res.status(403).json({ error: 'Cannot update a frozen exam' });
    }

    const allowedUpdates = [
      'name', 'description', 'examType', 'startDate', 'endDate',
      'termId', 'gradeScaleId', 'status',
    ];

    const updateData = {};
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        if (key === 'startDate' || key === 'endDate') {
          updateData[key] = new Date(updates[key]);
        } else {
          updateData[key] = updates[key];
        }
      }
    });

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: updateData,
      include: {
        class: true,
        academicYear: true,
        term: true,
        gradeScale: true,
      },
    });

    res.json({
      message: 'Exam updated successfully',
      exam: updatedExam,
    });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete exam
const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (exam.isFrozen) {
      return res.status(403).json({ error: 'Cannot delete a frozen exam. Unfreeze it first.' });
    }

    await prisma.exam.delete({ where: { id } });

    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add subject to exam
const addSubjectToExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectId, examDate, startTime, duration, totalMarks, passMarks, theoryMaxMarks, practicalMaxMarks, internalMaxMarks } = req.body;

    if (!subjectId || !examDate || !totalMarks) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const examSubject = await prisma.examSubject.create({
      data: {
        examId: id,
        subjectId,
        examDate: new Date(examDate),
        startTime: startTime || DEFAULTS.EXAM_START_TIME,
        duration: parseInt(duration) || DEFAULTS.EXAM_DURATION,
        totalMarks: parseFloat(totalMarks),
        passMarks: parseFloat(passMarks) || parseFloat(totalMarks) * (await getConfigValue('passing_percentage', DEFAULTS.PASS_PERCENTAGE) / 100),
        theoryMaxMarks: parseFloat(theoryMaxMarks) || 0,
        practicalMaxMarks: parseFloat(practicalMaxMarks) || 0,
        internalMaxMarks: parseFloat(internalMaxMarks) || 0,
      },
      include: {
        subject: true,
      },
    });

    res.status(201).json({
      message: 'Subject added to exam successfully',
      examSubject,
    });
  } catch (error) {
    console.error('Add subject to exam error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =============================================
// MARKS ENTRY (Subject Teacher — manual)
// =============================================
const enterMarks = async (req, res) => {
  try {
    const { examId } = req.params;
    const { subjectId, marks } = req.body;

    const userId = req.user.userId || req.user.id;

    if (!subjectId || !marks || !Array.isArray(marks) || marks.length === 0) {
      return res.status(400).json({ error: 'Required: subjectId, marks (non-empty array)' });
    }

    // Check exam exists and is not frozen
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        gradeScale: { include: { entries: { orderBy: { order: 'asc' } } } },
      },
    });

    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (exam.isFrozen) return res.status(403).json({ error: 'Exam results are frozen. Cannot enter marks.' });

    // Get the exam subject to know max marks
    const examSubject = await prisma.examSubject.findUnique({
      where: { examId_subjectId: { examId, subjectId } },
      include: { subject: true },
    });

    if (!examSubject) return res.status(404).json({ error: 'This subject is not part of the exam' });

    // Enforce Subject-Teacher assignment for non-admins
    if (req.user.role === 'TEACHER') {
      const assignment = await prisma.subjectTeacher.findFirst({
        where: {
          teacher: { userId: userId },
          subjectId,
        },
      });
      if (!assignment) {
        return res.status(403).json({ error: 'You are not assigned to this subject' });
      }
    }

    // Validate max marks
    const validationErrors = [];
    for (const m of marks) {
      if (!m.isAbsent) {
        if (examSubject.theoryMaxMarks > 0 && (m.theoryObtained || 0) > examSubject.theoryMaxMarks) {
          validationErrors.push({ studentId: m.studentId, field: 'theoryObtained', message: `Exceeds max ${examSubject.theoryMaxMarks}` });
        }
        if (examSubject.practicalMaxMarks > 0 && (m.practicalObtained || 0) > examSubject.practicalMaxMarks) {
          validationErrors.push({ studentId: m.studentId, field: 'practicalObtained', message: `Exceeds max ${examSubject.practicalMaxMarks}` });
        }
        if (examSubject.internalMaxMarks > 0 && (m.internalObtained || 0) > examSubject.internalMaxMarks) {
          validationErrors.push({ studentId: m.studentId, field: 'internalObtained', message: `Exceeds max ${examSubject.internalMaxMarks}` });
        }
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Marks exceed maximum allowed', details: validationErrors });
    }

    // Get or build grade calculation function
    const gradeEntries = exam.gradeScale?.entries || [];
    const calcGrade = (pct) => {
      if (gradeEntries.length > 0) {
        const entry = gradeEntries.find(e => pct >= e.minPercent && pct <= e.maxPercent);
        return entry?.grade || null;
      }
      return calculateGrade(pct);
    };

    const enteredBy = userId || null;
    const enteredAt = new Date();
    const saved = [];

    for (const m of marks) {
      const theory = m.isAbsent ? 0 : parseFloat(m.theoryObtained) || 0;
      const practical = m.isAbsent ? 0 : parseFloat(m.practicalObtained) || 0;
      const internal = m.isAbsent ? 0 : parseFloat(m.internalObtained) || 0;
      const obtainedMarks = theory + practical + internal;
      const pct = examSubject.totalMarks > 0 ? (obtainedMarks / examSubject.totalMarks) * 100 : 0;

      // Upsert ExamResult for student
      const examResult = await prisma.examResult.upsert({
        where: { examId_studentId: { examId, studentId: m.studentId } },
        create: {
          examId,
          studentId: m.studentId,
          totalMarks: 0, // will be recalculated
          obtainedMarks: 0,
          percentage: 0,
          result: 'PASS',
        },
        update: {},
      });

      // Upsert ExamMark for this subject
      // Find existing mark for this subject
      const existingMark = await prisma.examMark.findFirst({
        where: { examResultId: examResult.id, subjectCode: examSubject.subject.code },
      });

      const markData = {
        subjectName: examSubject.subject.name,
        subjectCode: examSubject.subject.code,
        totalMarks: examSubject.totalMarks,
        obtainedMarks,
        grade: m.isAbsent ? (m.absenceType === 'MEDICAL' ? 'MED' : 'AB') : calcGrade(pct),
        theoryObtained: theory,
        practicalObtained: practical,
        internalObtained: internal,
        isAbsent: m.isAbsent || false,
        absenceType: m.isAbsent ? (m.absenceType || 'ABSENT') : null,
        enteredBy,
        enteredAt,
      };

      if (existingMark) {
        await prisma.examMark.update({
          where: { id: existingMark.id },
          data: markData,
        });
      } else {
        await prisma.examMark.create({
          data: {
            examResultId: examResult.id,
            ...markData,
          },
        });
      }

      // Recalculate overall result
      const allMarks = await prisma.examMark.findMany({
        where: { examResultId: examResult.id },
      });

      const totalMax = allMarks.reduce((sum, mk) => sum + mk.totalMarks, 0);
      const totalObt = allMarks.filter(mk => !mk.isAbsent || mk.absenceType === 'MEDICAL')
        .reduce((sum, mk) => sum + mk.obtainedMarks, 0);
      const totalMaxForCalc = allMarks.filter(mk => !mk.isAbsent || mk.absenceType === 'MEDICAL')
        .reduce((sum, mk) => sum + mk.totalMarks, 0);
      const overallPct = totalMaxForCalc > 0 ? (totalObt / totalMaxForCalc) * 100 : 0;
      const hasFailingSubject = allMarks.some(mk =>
        !mk.isAbsent && mk.obtainedMarks < (examSubject.passMarks || examSubject.totalMarks * 0.4)
      );

      await prisma.examResult.update({
        where: { id: examResult.id },
        data: {
          totalMarks: totalMax,
          obtainedMarks: totalObt,
          percentage: parseFloat(overallPct.toFixed(2)),
          grade: calcGrade(overallPct),
          result: allMarks.some(mk => mk.isAbsent && mk.absenceType !== 'MEDICAL')
            ? 'ABSENT'
            : overallPct >= (await getConfigValue('passing_percentage', DEFAULTS.PASS_PERCENTAGE)) && !hasFailingSubject ? 'PASS' : 'FAIL',
          remarks: generateRemarks(overallPct),
        },
      });

      saved.push(m.studentId);
    }

    res.json({
      message: `Marks saved for ${saved.length} students`,
      saved: saved.length,
    });
  } catch (error) {
    console.error('Enter marks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =============================================
// CONSOLIDATED MARKS (Class Teacher view)
// =============================================
const getConsolidatedMarks = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        class: {
          include: {
            students: {
              include: {
                user: { select: { firstName: true, lastName: true } },
                section: { select: { name: true } },
              },
              where: { status: 'ACTIVE' },
              orderBy: { admissionNumber: 'asc' },
            },
          },
        },
        academicYear: { select: { name: true } },
        examSubjects: {
          include: { subject: { select: { name: true, code: true } } },
          orderBy: { examDate: 'asc' },
        },
        examResults: {
          include: {
            marks: true,
          },
        },
      },
    });

    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const students = exam.class.students;
    const totalStudents = students.length;

    // Map students to results (existing or virtual)
    const results = students.map(student => {
      const dbResult = exam.examResults.find(er => er.studentId === student.id);

      return {
        studentId: student.id,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        admissionNo: student.admissionNumber || '-',
        section: student.section?.name || '-',
        totalMarks: dbResult?.totalMarks || 0,
        obtainedMarks: dbResult?.obtainedMarks || 0,
        percentage: dbResult?.percentage || 0,
        grade: dbResult?.grade || '-',
        rank: dbResult?.rank || '-',
        result: dbResult?.result || 'PENDING',
        marks: dbResult?.marks || [],
      };
    });

    // Recalculate ranks based on percentage if any results published/completed
    // For manual entry grid, we keep them sorted by admission number (as fetched above)
    // unless the user is specifically looking at the overview tab.
    // The previous implementation sorted by percentage desc.
    const sortedResults = [...results].sort((a, b) => b.percentage - a.percentage);
    sortedResults.forEach((r, idx) => {
      const original = results.find(o => o.studentId === r.studentId);
      if (original) original.rank = idx + 1;
    });

    // Calculate entry progress
    const subjectProgress = exam.examSubjects.map(es => {
      const entered = exam.examResults.filter(er =>
        er.marks.some(mk => mk.subjectCode === es.subject.code)
      ).length;
      return {
        subjectId: es.subjectId,
        subjectName: es.subject.name,
        subjectCode: es.subject.code,
        totalMarks: es.totalMarks,
        theoryMax: es.theoryMaxMarks,
        practicalMax: es.practicalMaxMarks,
        internalMax: es.internalMaxMarks,
        entered,
        total: totalStudents,
        isComplete: entered >= totalStudents && totalStudents > 0,
      };
    });

    res.json({
      exam: {
        id: exam.id,
        name: exam.name,
        className: exam.class.name,
        academicYear: exam.academicYear.name,
        isFrozen: exam.isFrozen,
        status: exam.status,
      },
      subjectProgress,
      results, // Returned in admission number order for the entry grid
    });
  } catch (error) {
    console.error('Get consolidated marks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =============================================
// FREEZE / UNFREEZE
// =============================================
const freezeExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (exam.isFrozen) return res.status(400).json({ error: 'Exam is already frozen' });

    const updated = await prisma.exam.update({
      where: { id: examId },
      data: {
        isFrozen: true,
        frozenAt: new Date(),
        frozenBy: req.user?.id || null,
        status: EXAM_STATUS.FROZEN,
      },
    });

    res.json({ message: 'Exam results frozen', exam: updated });
  } catch (error) {
    console.error('Freeze exam error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const unfreezeExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (!exam.isFrozen) return res.status(400).json({ error: 'Exam is not frozen' });

    const updated = await prisma.exam.update({
      where: { id: examId },
      data: {
        isFrozen: false,
        frozenAt: null,
        frozenBy: null,
        status: EXAM_STATUS.COMPLETED,
      },
    });

    res.json({ message: 'Exam results unfrozen', exam: updated });
  } catch (error) {
    console.error('Unfreeze exam error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Submit exam results (legacy — kept for backward compatibility)
const submitExamResults = async (req, res) => {
  try {
    const { examId, studentId, results } = req.body;

    if (!examId || !studentId || !results || !Array.isArray(results)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Check if exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { examSubjects: true },
    });

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (exam.isFrozen) {
      return res.status(403).json({ error: 'Exam results are frozen' });
    }

    // Calculate total and percentage
    let totalMarksObtained = 0;
    let totalMaxMarks = 0;

    results.forEach((result) => {
      totalMarksObtained += parseFloat(result.marksObtained);
      const examSubject = exam.examSubjects.find((s) => s.subjectId === result.subjectId);
      if (examSubject) {
        totalMaxMarks += examSubject.totalMarks;
      }
    });

    const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
    const grade = calculateGrade(percentage);

    // Create exam result
    const examResult = await prisma.examResult.create({
      data: {
        examId,
        studentId,
        totalMarks: totalMaxMarks,
        obtainedMarks: totalMarksObtained,
        percentage: parseFloat(percentage.toFixed(2)),
        grade,
        result: percentage >= (await getConfigValue('passing_percentage', DEFAULTS.PASS_PERCENTAGE)) ? 'PASS' : 'FAIL',
        remarks: generateRemarks(percentage),
        marks: {
          create: results.map((r) => {
            const subj = exam.examSubjects.find((s) => s.subjectId === r.subjectId);
            return {
              subjectName: r.subjectName || r.subjectId,
              subjectCode: r.subjectCode || '',
              totalMarks: subj?.totalMarks || 0,
              obtainedMarks: parseFloat(r.marksObtained),
              grade: calculateGrade(subj ? (parseFloat(r.marksObtained) / subj.totalMarks) * 100 : 0),
            };
          }),
        },
      },
    });

    res.status(201).json({
      message: 'Exam results submitted successfully',
      examResult,
    });
  } catch (error) {
    console.error('Submit exam results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get student exam results
const getStudentExamResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYearId, examType } = req.query;

    const where = { studentId };

    if (academicYearId || examType) {
      where.exam = {};
      if (academicYearId) where.exam.academicYearId = academicYearId;
      if (examType) where.exam.examType = examType;
    }

    const results = await prisma.examResult.findMany({
      where,
      include: {
        exam: {
          include: {
            class: { select: { name: true } },
            academicYear: { select: { name: true } },
          },
        },
        marks: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ results });
  } catch (error) {
    console.error('Get student exam results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get exam results report
const getExamResultsReport = async (req, res) => {
  try {
    const { examId } = req.params;
    const { classId, passFail } = req.query;

    const where = { examId };

    const results = await prisma.examResult.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
            currentClass: { select: { name: true } },
          },
        },
        exam: {
          include: {
            examSubjects: {
              include: {
                subject: true,
              },
            },
          },
        },
        marks: true,
      },
      orderBy: { percentage: 'desc' },
    });

    // Filter by class if specified
    let filteredResults = results;
    if (classId) {
      filteredResults = results.filter((r) => r.student.currentClassId === classId);
    }

    // Filter by pass/fail if specified
    if (passFail === 'pass') {
      filteredResults = filteredResults.filter((r) => r.percentage >= 40);
    } else if (passFail === 'fail') {
      filteredResults = filteredResults.filter((r) => r.percentage < 40);
    }

    // Calculate statistics
    const stats = {
      totalStudents: filteredResults.length,
      passed: filteredResults.filter((r) => r.percentage >= 40).length,
      failed: filteredResults.filter((r) => r.percentage < 40).length,
      averagePercentage:
        filteredResults.length > 0
          ? (
            filteredResults.reduce((sum, r) => sum + r.percentage, 0) / filteredResults.length
          ).toFixed(2)
          : 0,
      highestPercentage: filteredResults.length > 0 ? filteredResults[0].percentage : 0,
      lowestPercentage:
        filteredResults.length > 0
          ? filteredResults[filteredResults.length - 1].percentage
          : 0,
    };

    res.json({
      results: filteredResults,
      stats,
    });
  } catch (error) {
    console.error('Get exam results report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper functions
const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

const generateRemarks = (percentage) => {
  if (percentage >= 90) return 'Outstanding';
  if (percentage >= 80) return 'Excellent';
  if (percentage >= 70) return 'Very Good';
  if (percentage >= 60) return 'Good';
  if (percentage >= 50) return 'Satisfactory';
  if (percentage >= 40) return 'Pass';
  return 'Needs Improvement';
};

module.exports = {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  addSubjectToExam,
  enterMarks,
  getConsolidatedMarks,
  freezeExam,
  unfreezeExam,
  submitExamResults,
  getStudentExamResults,
  getExamResultsReport,
  getTeacherExams,
};
