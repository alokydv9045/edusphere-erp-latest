const logger = require('../config/logger');
const prisma = require('../config/database');


/**
 * Get dashboard statistics
 * Returns different stats based on user role
 */
const getDashboardStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.userId;

    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ==========================================
    // STUDENT DASHBOARD STATS
    // ==========================================
    if (userRole === 'STUDENT') {
      // Get student details
      const student = await prisma.student.findUnique({
        where: { userId },
        include: {
          currentClass: true,
          section: true
        }
      });

      if (!student) {
        return res.status(404).json({ error: 'Student record not found' });
      }

      const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: {
          studentId: student.id,
          attendeeType: 'STUDENT',
          date: { gte: firstDayOfMonth }
        },
        select: { date: true, status: true }
      });

      // Count unique days for better accuracy (multi-session schools)
      const uniqueDaysCount = new Set(attendanceRecords.map(r => r.date.toISOString().split('T')[0])).size;
      const presentDaysCount = new Set(
        attendanceRecords
          .filter(r => r.status === 'PRESENT' || r.status === 'LATE')
          .map(r => r.date.toISOString().split('T')[0])
      ).size;

      const attendancePercentage = uniqueDaysCount > 0 ? ((presentDaysCount / uniqueDaysCount) * 100).toFixed(1) : 0;

      // 2. Pending Fees
      const pendingFees = await prisma.feePayment.count({
        where: {
          studentId: student.id,
          status: 'PENDING'
        }
      });

      // 3. Next Exam
      const nextExam = await prisma.exam.findFirst({
        where: {
          classId: student.currentClassId,
          startDate: { gte: today }
        },
        orderBy: { startDate: 'asc' },
        select: { name: true, startDate: true }
      });

      // 4. Library Books Due
      const booksDue = await prisma.libraryIssue.count({
        where: {
          studentId: student.id,
          status: { in: ['ISSUED', 'OVERDUE'] },
          dueDate: { lt: today }
        }
      });

      return res.json({
        success: true,
        stats: {
          attendancePercentage: parseFloat(attendancePercentage),
          pendingFees,
          nextExam: nextExam ? { name: nextExam.name, date: nextExam.startDate } : null,
          booksDue,
          role: 'STUDENT'
        }
      });
    }

    // ==========================================
    // TEACHER DASHBOARD STATS
    // ==========================================
    if (userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId }
      });

      if (!teacher) {
        return res.status(404).json({ error: 'Teacher record not found' });
      }

      // 1. My Class Students (if class teacher)
      let myClassStudents = 0;
      let myClassName = null;

      const myClass = await prisma.class.findUnique({
        where: { classTeacherId: teacher.id },
        include: { _count: { select: { students: true } } }
      });

      if (myClass) {
        myClassStudents = myClass._count.students;
        myClassName = myClass.name;
      }

      // 2. Total Subject Assignments
      const subjectCount = await prisma.subjectTeacher.count({
        where: { teacherId: teacher.id }
      });

      // 3. Pending Attendance Marking
      const dayOfWeek = today.getDay(); // 0-6

      const scheduledSlots = await prisma.timetableSlot.findMany({
        where: { teacherId: teacher.id, dayOfWeek: dayOfWeek },
        select: { sectionId: true, subjectId: true }
      });

      // Check how many unique class-sections have attendance marked today
      const markedSlots = await prisma.attendanceSlot.count({
        where: {
          date: todayStart,
          sectionId: { in: scheduledSlots.map(s => s.sectionId) }
        }
      });

      const classesToday = scheduledSlots.length;
      const pendingAttendance = Math.max(0, classesToday - markedSlots);

      return res.json({
        success: true,
        stats: {
          isClassTeacher: !!myClass,
          myClassName,
          myClassStudents,
          subjectCount,
          classesToday,
          pendingAttendance,
          role: 'TEACHER'
        }
      });
    }

    // ==========================================
    // ACCOUNTANT DASHBOARD STATS
    // ==========================================
    if (userRole === 'ACCOUNTANT') {
      const yearStart = new Date(today.getFullYear(), 0, 1);

      const [todayCollection, yearCollection, txToday, pendingCount] = await Promise.all([
        prisma.feePayment.aggregate({
          _sum: { amount: true },
          where: { status: 'COMPLETED', paymentDate: { gte: today, lt: tomorrow } },
        }),
        prisma.feePayment.aggregate({
          _sum: { amount: true },
          where: { status: 'COMPLETED', paymentDate: { gte: yearStart } },
        }),
        prisma.feePayment.count({
          where: { status: 'COMPLETED', paymentDate: { gte: today, lt: tomorrow } },
        }),
        prisma.feePayment.aggregate({
          _sum: { amount: true },
          where: { status: 'PENDING' },
        }),
      ]);

      return res.json({
        success: true,
        stats: {
          role: 'ACCOUNTANT',
          todayCollection: parseFloat(todayCollection?._sum?.amount || 0),
          yearCollection: parseFloat(yearCollection?._sum?.amount || 0),
          pendingAmount: parseFloat(pendingCount?._sum?.amount || 0),
          txToday,
        },
      });
    }

    // ==========================================
    // ADMISSION_MANAGER DASHBOARD STATS
    // ==========================================
    if (userRole === 'ADMISSION_MANAGER') {
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      // 1. Core Admission Counts
      const [totalStudents, admissionsToday, admissionsThisMonth] = await Promise.all([
        prisma.student.count({ where: { status: 'ACTIVE' } }),
        prisma.student.count({ where: { createdAt: { gte: todayStart, lt: tomorrow } } }),
        prisma.student.count({ where: { createdAt: { gte: thisMonthStart } } }),
      ]);

      // 2. Enquiry Pipeline Stats (The Funnel)
      const [pendingEnquiries, followUpEnquiries, convertedEnquiries] = await Promise.all([
        prisma.enquiry.count({ where: { status: 'PENDING' } }),
        prisma.enquiry.count({ where: { status: 'FOLLOW_UP' } }),
        prisma.enquiry.count({ where: { status: 'CONVERTED' } }),
      ]);

      // 3. Class-wise Admission Distribution (Top 5 classes)
      const classDistribution = await prisma.student.groupBy({
        by: ['currentClassId'],
        where: { currentClassId: { not: null }, status: 'ACTIVE' },
        _count: { id: true },
        take: 5,
        orderBy: { _count: { id: 'desc' } }
      });

      const classIds = classDistribution.map(item => item.currentClassId);
      const classes = await prisma.class.findMany({
        where: { id: { in: classIds } },
        select: { id: true, name: true }
      });

      const classMap = classes.reduce((acc, curr) => {
        acc[curr.id] = curr.name;
        return acc;
      }, {});

      const formattedDistribution = classDistribution.map(item => ({
        name: classMap[item.currentClassId] || 'Unknown',
        count: item._count.id
      }));

      // 4. Recent Enquiries (Last 5)
      const recentEnquiries = await prisma.enquiry.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          class: { select: { name: true } }
        }
      });

      return res.json({
        success: true,
        stats: {
          role: 'ADMISSION_MANAGER',
          totalStudents,
          admissionsToday,
          admissionsThisMonth,
          funnelStats: {
            pending: pendingEnquiries,
            followUp: followUpEnquiries,
            converted: convertedEnquiries
          },
          classDistribution: formattedDistribution,
          recentEnquiries: recentEnquiries.map(enq => ({
            id: enq.id,
            studentName: enq.studentName,
            parentName: enq.parentName,
            phone: enq.phone,
            class: enq.class?.name || 'Unknown',
            status: enq.status,
            createdAt: enq.createdAt
          }))
        }
      });
    }

    // ==========================================
    // ADMIN / SUPER_ADMIN DASHBOARD
    // ==========================================

    const thisMonthStart = new Date(today);
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const lastMonthEnd = new Date(thisMonthStart);
    const lastMonthStart = new Date(lastMonthEnd);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    // Batched execution to avoid MaxClientsReached on limited DB instances
    // Batch 1: Basic Counts + Teacher Growth Trends
    const [totalStudents, activeStudents, totalTeachers, totalClasses, teachersThisMonth, teachersLastMonth] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      prisma.user.count({ where: { role: 'TEACHER', isActive: true } }),
      prisma.class.count(),
      prisma.user.count({ where: { role: 'TEACHER', createdAt: { gte: thisMonthStart } } }),
      prisma.user.count({ where: { role: 'TEACHER', createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
    ]);

    // Batch 2: Admissions & Attendance
    const [recentAdmissions, totalAttendanceRecords, presentRecords] = await Promise.all([
      prisma.user.count({
        where: { role: 'STUDENT', createdAt: { gte: thisMonthStart } }
      }),
      prisma.attendanceRecord.count({
        where: { date: { gte: todayStart, lt: tomorrow } }
      }),
      prisma.attendanceRecord.count({
        where: { date: { gte: todayStart, lt: tomorrow }, status: 'PRESENT' }
      }),
    ]);

    // Batch 3: Fees, Exams, Library
    const [pendingFeeCount, upcomingExamCount, overdueBooks] = await Promise.all([
      prisma.feePayment.count({ where: { status: 'PENDING' } }),
      prisma.exam.count({
        where: {
          startDate: { gte: todayStart, lte: new Date(todayStart.getTime() + 30 * 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.libraryIssue.count({
        where: { status: 'OVERDUE' }
      }),
    ]);

    // Batch 4: Aggregations & Attendance Trends
    const [thisMonthFeeData, lastMonthFeeData, studentsThisMonth, studentsLastMonth, thisMonthAttendance, lastMonthAttendance, thisMonthTotalAtt, lastMonthTotalAtt] = await Promise.all([
      prisma.feePayment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED', paymentDate: { gte: thisMonthStart } }
      }),
      prisma.feePayment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED', paymentDate: { gte: lastMonthStart, lt: thisMonthStart } }
      }),
      prisma.user.count({ where: { role: 'STUDENT', createdAt: { gte: thisMonthStart } } }),
      prisma.user.count({ where: { role: 'STUDENT', createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
      prisma.attendanceRecord.aggregate({
        _count: { id: true },
        where: { date: { gte: thisMonthStart }, status: 'PRESENT' }
      }),
      prisma.attendanceRecord.aggregate({
        _count: { id: true },
        where: { date: { gte: lastMonthStart, lt: thisMonthStart }, status: 'PRESENT' }
      }),
      prisma.attendanceRecord.count({ where: { date: { gte: thisMonthStart } } }),
      prisma.attendanceRecord.count({ where: { date: { gte: lastMonthStart, lt: thisMonthStart } } }),
    ]);

    const attendanceToday = totalAttendanceRecords > 0
      ? parseFloat(((presentRecords / totalAttendanceRecords) * 100).toFixed(1))
      : 0;

    const thisMonthAvg = thisMonthTotalAtt > 0 ? (thisMonthAttendance._count.id / thisMonthTotalAtt) : 0;
    const lastMonthAvg = lastMonthTotalAtt > 0 ? (lastMonthAttendance._count.id / lastMonthTotalAtt) : 0;
    const attendanceChange = lastMonthAvg > 0
      ? parseFloat(((thisMonthAvg - lastMonthAvg) / lastMonthAvg * 100).toFixed(1))
      : 0;

    const thisMonthFeesAmount = parseFloat(thisMonthFeeData?._sum?.amount || 0);
    const lastMonthFeesAmount = parseFloat(lastMonthFeeData?._sum?.amount || 0);
    const feesChange = lastMonthFeesAmount > 0
      ? parseFloat(((thisMonthFeesAmount - lastMonthFeesAmount) / lastMonthFeesAmount * 100).toFixed(1))
      : 0;

    const studentsChange = studentsLastMonth > 0
      ? parseFloat(((studentsThisMonth / studentsLastMonth) * 100).toFixed(1))
      : 0;

    const teachersChange = teachersLastMonth > 0
      ? parseFloat(((teachersThisMonth / teachersLastMonth) * 100).toFixed(1))
      : 0;

    res.json({
      success: true,
      stats: {
        totalStudents,
        activeStudents,
        totalTeachers,
        totalClasses,
        attendanceToday,
        attendanceChange,
        feesCollected: thisMonthFeesAmount,
        feesChange,
        studentsChange,
        teachersChange,
        recentAdmissions,
        pendingFeeCount,
        upcomingExamCount,
        overdueBooks,
        role: 'ADMIN'
      }
    });
  } catch (error) {
    logger.error('Error in getDashboardStats:', error);
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};



/**
 * Get recent activities
 */
const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // ==========================================
    // ROLE-BASED FILTERING
    // ==========================================
    const userRole = req.user.role;
    const userId = req.user.userId;

    // ACCOUNTANT sees only recent fee payments
    if (userRole === 'ACCOUNTANT') {
      const recentPayments = await prisma.feePayment.findMany({
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          student: {
            include: { user: { select: { firstName: true, lastName: true } } }
          }
        }
      });
      const activities = recentPayments.map(p => ({
        id: `fee-${p.id}`,
        type: 'Fee',
        description: `Fee ₹${p.amount} collected from ${p.student.user.firstName} ${p.student.user.lastName}`,
        time: getRelativeTime(p.paymentDate),
        timestamp: new Date(p.paymentDate).getTime(),
        mode: p.paymentMode,
        receipt: p.receiptNumber,
      }));
      return res.json({ success: true, activities });
    }

    let studentId = null;
    let teacherId = null;

    if (userRole === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (student) studentId = student.id;
    } else if (userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (teacher) teacherId = teacher.id;
    }

    // Common where clauses
    const studentWhere = studentId ? { studentId } : {};

    // Get recent student admissions (Only Admin/Teacher sees this)
    let recentStudents = [];
    if (['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(userRole)) {
      recentStudents = await prisma.student.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
          currentClass: { select: { name: true } }
        }
      });
    }

    // Get recent fee payments (Student sees own, Admin sees all)
    const recentPayments = await prisma.feePayment.findMany({
      take: 3,
      orderBy: { paymentDate: 'desc' },
      where: studentId ? { studentId } : {},
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    // Get recent exam results (Student sees own, Admin sees all)
    const recentExamResults = await prisma.exam.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' },
      where: {
        endDate: { lte: new Date() },
        ...(studentId ? {
          examResults: { some: { studentId } }
        } : {})
      },
      include: {
        class: { select: { name: true } }
      }
    });

    // Get recent attendance records (unique dates)
    const recentAttendance = await prisma.attendanceRecord.findMany({
      take: 2,
      orderBy: { date: 'desc' },
      distinct: ['date'],
      where: studentId ? { studentId } : {},
      select: { date: true }
    });

    // Get recent library issues
    const recentLibraryIssues = await prisma.libraryIssue.findMany({
      take: 2,
      orderBy: { issueDate: 'desc' },
      where: studentId ? { studentId } : {},
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    // Combine all activities WITH timestamps for proper sorting
    const activities = [];

    recentStudents.forEach(student => {
      activities.push({
        id: `student-${student.id}`,
        type: 'Student',
        description: `New student admission: ${student.user.firstName} ${student.user.lastName} (${student.currentClass?.name || 'No Class'})`,
        time: getRelativeTime(student.createdAt),
        timestamp: new Date(student.createdAt).getTime(),
      });
    });

    recentPayments.forEach(payment => {
      activities.push({
        id: `fee-${payment.id}`,
        type: 'Fee',
        description: `Fee payment received from ${payment.student.user.firstName} ${payment.student.user.lastName}`,
        time: getRelativeTime(payment.paymentDate),
        timestamp: new Date(payment.paymentDate).getTime(),
      });
    });

    recentExamResults.forEach(exam => {
      activities.push({
        id: `exam-${exam.id}`,
        type: 'Exam',
        description: `${exam.name} results published for ${exam.class?.name || 'Multiple Classes'}`,
        time: getRelativeTime(exam.createdAt),
        timestamp: new Date(exam.createdAt).getTime(),
      });
    });

    for (const attendance of recentAttendance) {
      // Get some context about the class/section if possible
      const slot = await prisma.attendanceSlot.findFirst({
        where: { date: attendance.date },
        include: { class: { select: { name: true } } }
      });

      activities.push({
        id: `attendance-${attendance.date.getTime()}`,
        type: 'Attendance',
        description: slot?.class
          ? `Attendance session recorded for ${slot.class.name}`
          : 'Daily attendance attendance session completed',
        time: getRelativeTime(attendance.date),
        timestamp: new Date(attendance.date).getTime(),
      });
    }

    recentLibraryIssues.forEach(issue => {
      activities.push({
        id: `library-${issue.id}`,
        type: 'Library',
        description: `Book issued to ${issue.student.user.firstName} ${issue.student.user.lastName}`,
        time: getRelativeTime(issue.issueDate),
        timestamp: new Date(issue.issueDate).getTime(),
      });
    });

    // Sort by most recent first (fixed: was always returning 0)
    activities.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      activities: activities.slice(0, limit)
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities',
      error: error.message
    });
  }
};

/**
 * Get upcoming examinations
 */
const getUpcomingExams = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const today = new Date();

    const userRole = req.user.role;
    const userId = req.user.userId;

    let classFilter = {};

    if (userRole === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (student && student.currentClassId) {
        classFilter = { classId: student.currentClassId };
      }
    }

    const upcomingExams = await prisma.exam.findMany({
      where: {
        startDate: {
          gte: today
        },
        ...classFilter
      },
      take: limit,
      orderBy: {
        startDate: 'asc'
      },
      include: {
        class: {
          select: {
            name: true
          }
        },
        examSubjects: {
          take: 1,
          include: {
            subject: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    const formattedExams = upcomingExams.map(exam => {
      let examDate = 'N/A';
      try {
        if (exam.startDate) {
          examDate = exam.startDate instanceof Date
            ? exam.startDate.toISOString().split('T')[0]
            : new Date(exam.startDate).toISOString().split('T')[0];
        }
      } catch (e) {
        console.error('Error formatting exam date:', e);
      }

      return {
        id: exam.id,
        name: exam.name,
        class: exam.class?.name || 'All Classes',
        date: examDate,
        subject: exam.examSubjects[0]?.subject?.name || 'Multiple Subjects'
      };
    });

    res.json({
      success: true,
      exams: formattedExams
    });
  } catch (error) {
    logger.error('Error in getUpcomingExams:', error);
    console.error('Error fetching upcoming exams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming examinations',
      error: error.message
    });
  }
};


/**
 * Get fee collection summary
 */
const getFeeCollectionSummary = async (req, res) => {
  try {
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    // Get total expected fees for active students
    const activeFeeStructures = await prisma.feeStructure.findMany({
      where: {
        isActive: true
      }
    });

    const totalExpected = activeFeeStructures.reduce((sum, structure) => {
      return sum + parseFloat(structure.totalAmount || 0);
    }, 0);

    // Get collected fees this month
    const collectedThisMonth = await prisma.feePayment.aggregate({
      _sum: {
        amount: true
      },
      where: {
        status: 'COMPLETED',
        paymentDate: {
          gte: thisMonthStart
        }
      }
    });

    const collected = collectedThisMonth._sum.amount || 0;
    const pending = totalExpected - parseFloat(collected || 0);
    const collectionRate = totalExpected > 0
      ? ((parseFloat(collected || 0) / totalExpected) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      summary: {
        totalExpected: parseFloat(totalExpected),
        collected: parseFloat(collected),
        pending: pending,
        collectionRate: parseFloat(collectionRate)
      }
    });
  } catch (error) {
    console.error('Error fetching fee collection summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee collection summary',
      error: error.message
    });
  }
};

/**
 * Get low stock inventory alerts
 */
const getInventoryAlerts = async (req, res) => {
  try {
    // Use raw query to compare quantity <= minQuantity (two columns)
    const lowStockItems = await prisma.$queryRaw`
      SELECT * FROM "InventoryItem"
      WHERE quantity <= "minStockLevel"
    `;

    res.json({
      success: true,
      lowStockCount: lowStockItems.length,
      items: lowStockItems
    });
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory alerts',
      error: error.message
    });
  }
};

/**
 * Helper function to get relative time
 */
function getRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(date).toLocaleDateString();
}

/**
 * Dedicated accountant stats endpoint – more detailed than the stats branch
 */
const getAccountantStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    // Today's transactions
    const todayPayments = await prisma.feePayment.findMany({
      where: { status: 'COMPLETED', paymentDate: { gte: today, lt: tomorrow } },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            currentClass: { select: { name: true } },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    // Summary aggregates - Sequentialized to respect connection limits
    const todayAgg = await prisma.feePayment.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED', paymentDate: { gte: today, lt: tomorrow } }
    });

    const yearAgg = await prisma.feePayment.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED', paymentDate: { gte: yearStart } }
    });

    const pendingAgg = await prisma.feePayment.aggregate({
      _sum: { amount: true },
      where: { status: 'PENDING' }
    });

    // Top defaulters (students with most pending payments)
    const defaulters = await prisma.feePayment.groupBy({
      by: ['studentId'],
      where: { status: 'PENDING' },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    });

    const defaulterDetails = [];
    for (const d of defaulters) {
      const student = await prisma.student.findUnique({
        where: { id: d.studentId },
        include: {
          user: { select: { firstName: true, lastName: true } },
          currentClass: { select: { name: true } },
        },
      });
      defaulterDetails.push({
        studentId: d.studentId,
        name: student ? `${student.user.firstName} ${student.user.lastName}` : 'Unknown',
        class: student?.currentClass?.name || 'N/A',
        pendingAmount: d._sum.amount || 0,
      });
    }

    // 6-month collection trend (Parallelized)
    const trendPromises = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      return prisma.feePayment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED', paymentDate: { gte: start, lte: end } },
      }).then(res2 => ({
        month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        collected: parseFloat(res2._sum.amount || 0),
      }));
    });

    const trend = await Promise.all(trendPromises);

    // Payment mode breakdown for today
    const modeBreakdown = await prisma.feePayment.groupBy({
      by: ['paymentMode'],
      where: { status: 'COMPLETED', paymentDate: { gte: today, lt: tomorrow } },
      _sum: { amount: true },
      _count: { id: true },
    });

    res.json({
      success: true,
      summary: {
        todayCollection: parseFloat(todayAgg?._sum?.amount || 0),
        yearCollection: parseFloat(yearAgg?._sum?.amount || 0),
        pendingAmount: parseFloat(pendingAgg?._sum?.amount || 0),
        txToday: todayPayments.length,
      },
      todayTransactions: todayPayments.map(p => ({
        id: p.id,
        receipt: p.receiptNumber,
        studentName: p.student ? `${p.student.user.firstName} ${p.student.user.lastName}` : 'Unknown',
        class: p.student?.currentClass?.name || 'N/A',
        amount: parseFloat(p.amount || 0),
        mode: p.paymentMode,
        time: p.paymentDate,
      })),
      defaulters: defaulterDetails,
      trend,
      modeBreakdown: modeBreakdown.map(m => ({
        mode: m.paymentMode,
        amount: m._sum.amount || 0,
        count: m._count.id,
      })),
    });
  } catch (error) {
    logger.error('Error in getAccountantStats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch accountant statistics', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivities,
  getUpcomingExams,
  getFeeCollectionSummary,
  getInventoryAlerts,
  getAccountantStats
};
