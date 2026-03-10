const prisma = require('../config/database');
const { getConfigValue } = require('../utils/configHelper');
const { DEFAULTS, ATTENDANCE_STATUS, ROLES } = require('../constants');
const { checkGeofence } = require('../utils/geoUtils');
const { parseQRPayload } = require('../utils/qrGenerator');

// Mark attendance (manual or RFID)
const markAttendance = async (req, res) => {
  try {
    const { studentId, date, status, scannedByRFID, deviceId, remarks } = req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists for this date
    const existing = await prisma.attendanceRecord.findFirst({
      where: {
        studentId,
        date: attendanceDate,
        attendeeType: ROLES.STUDENT,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Attendance already marked for this date' });
    }

    const attendance = await prisma.attendanceRecord.create({
      data: {
        studentId,
        attendeeType: ROLES.STUDENT,
        date: attendanceDate,
        checkInTime: status === ATTENDANCE_STATUS.PRESENT || status === ATTENDANCE_STATUS.LATE ? new Date() : null,
        status,
        scannedByRFID: scannedByRFID || false,
        deviceId,
        markedBy: req.user.userId,
        remarks,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance,
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get attendance for a date
const getAttendanceByDate = async (req, res) => {
  try {
    const { date, classId, sectionId } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const where = {
      date: attendanceDate,
      attendeeType: ROLES.STUDENT,
    };

    // Build student filter
    const studentWhere = {};
    if (classId) studentWhere.currentClassId = classId;
    if (sectionId) studentWhere.sectionId = sectionId;

    // Get all students matching criteria
    const students = await prisma.student.findMany({
      where: {
        ...studentWhere,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        currentClass: {
          select: { id: true, name: true },
        },
        section: {
          select: { id: true, name: true },
        },
      },
    });

    // Get attendance records for this date
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        ...where,
        studentId: {
          in: students.map((s) => s.id),
        },
      },
    });

    // Map attendance to students
    const attendanceMap = new Map();
    attendanceRecords.forEach((record) => {
      attendanceMap.set(record.studentId, record);
    });

    const result = students.map((student) => ({
      student,
      attendance: attendanceMap.get(student.id) || null,
    }));

    // Calculate statistics
    const stats = {
      total: students.length,
      present: attendanceRecords.filter((a) => a.status === ATTENDANCE_STATUS.PRESENT).length,
      absent: students.length - attendanceRecords.length,
      late: attendanceRecords.filter((a) => a.status === ATTENDANCE_STATUS.LATE).length,
      marked: attendanceRecords.length,
      unmarked: students.length - attendanceRecords.length,
    };

    res.json({ attendance: result, stats });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// RFID scan handler
const handleRFIDScan = async (req, res) => {
  try {
    const { cardNumber, deviceId } = req.body;

    if (!cardNumber) {
      return res.status(400).json({ error: 'Card number is required' });
    }

    // Find RFID card
    const rfidCard = await prisma.rFIDCard.findUnique({
      where: { cardNumber },
      include: {
        student: {
          include: {
            user: true,
            currentClass: true,
            section: true,
          },
        },
      },
    });

    if (!rfidCard || !rfidCard.isActive) {
      return res.status(404).json({ error: 'Invalid or inactive RFID card' });
    }

    if (!rfidCard.studentId) {
      return res.status(400).json({ error: 'Card not assigned to student' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already marked today
    const existing = await prisma.attendanceRecord.findFirst({
      where: {
        studentId: rfidCard.studentId,
        attendeeType: ROLES.STUDENT,
        date: today,
      },
    });

    if (existing) {
      // Update check-out time
      const updated = await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: { checkOutTime: new Date() },
      });

      return res.json({
        message: 'Check-out recorded',
        attendance: updated,
        student: rfidCard.student,
        action: 'checkout',
      });
    }

    // Determine if late
    const now = new Date();
    const schoolStartTime = await getConfigValue('school_start_time', DEFAULTS.SCHOOL_START_TIME);
    const [hours, minutes] = schoolStartTime.split(':');
    const startTime = new Date(today);
    startTime.setHours(parseInt(hours), parseInt(minutes), 0);

    const isLate = now > startTime;

    // Mark attendance
    const attendance = await prisma.attendanceRecord.create({
      data: {
        studentId: rfidCard.studentId,
        attendeeType: ROLES.STUDENT,
        date: today,
        checkInTime: now,
        status: isLate ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT,
        scannedByRFID: true,
        deviceId: deviceId || 'UNKNOWN',
      },
    });

    res.status(201).json({
      message: isLate ? 'Late arrival recorded' : 'Attendance marked',
      attendance,
      student: rfidCard.student,
      action: 'checkin',
      isLate,
    });
  } catch (error) {
    console.error('RFID scan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk mark attendance
const bulkMarkAttendance = async (req, res) => {
  try {
    const { date, attendanceData } = req.body;

    if (!date || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Fetch existing records for checking
    const existingRecords = await prisma.attendanceRecord.findMany({
      where: {
        date: attendanceDate,
        attendeeType: ROLES.STUDENT,
        studentId: { in: attendanceData.map((a) => a.studentId) },
      },
    });

    const existingMap = new Map();
    existingRecords.forEach((r) => existingMap.set(r.studentId, r));

    const results = await Promise.all(
      attendanceData.map(async ({ studentId, status }) => {
        try {
          const existing = existingMap.get(studentId);
          if (existing) {
            // Update existing attendance
            return await prisma.attendanceRecord.update({
              where: { id: existing.id },
              data: {
                status,
                checkInTime: status === ATTENDANCE_STATUS.PRESENT || status === ATTENDANCE_STATUS.LATE ? new Date() : null,
                markedBy: req.user.userId,
              },
            });
          } else {
            // Create new attendance
            return await prisma.attendanceRecord.create({
              data: {
                studentId,
                attendeeType: ROLES.STUDENT,
                date: attendanceDate,
                checkInTime: status === ATTENDANCE_STATUS.PRESENT || status === ATTENDANCE_STATUS.LATE ? new Date() : null,
                status,
                markedBy: req.user.userId,
              },
            });
          }
        } catch (err) {
          return { studentId, error: err.message };
        }
      })
    );

    const successful = results.filter((r) => !r.error);
    const failed = results.filter((r) => r.error);

    res.json({
      message: `Marked attendance for ${successful.length} students`,
      successful: successful.length,
      failed: failed.length,
      failures: failed,
    });
  } catch (error) {
    console.error('Bulk mark attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get attendance report
const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, classId, sectionId, format = 'json' } = req.query;

    const where = {
      attendeeType: ROLES.STUDENT,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const studentWhere = {};
    if (classId) studentWhere.currentClassId = classId;
    if (sectionId) studentWhere.sectionId = sectionId;

    const students = await prisma.student.findMany({
      where: { ...studentWhere, status: 'ACTIVE' },
      include: {
        user: true,
        currentClass: true,
        section: true,
      },
    });

    // Get attendance records
    const records = await prisma.attendanceRecord.findMany({
      where: {
        ...where,
        studentId: {
          in: students.map((s) => s.id),
        },
      },
    });

    // Calculate statistics per student
    const studentStats = students.map((student) => {
      const studentRecords = records.filter((r) => r.studentId === student.id);
      return {
        student,
        stats: {
          total: studentRecords.length,
          present: studentRecords.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT).length,
          absent: studentRecords.filter((r) => r.status === ATTENDANCE_STATUS.ABSENT).length,
          late: studentRecords.filter((r) => r.status === ATTENDANCE_STATUS.LATE).length,
          percentage: studentRecords.length > 0
            ? ((studentRecords.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT).length / studentRecords.length) * 100).toFixed(2)
            : 0,
        },
      };
    });

    res.json({ report: studentStats });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Attendance Slots ─────────────────────────────────────────────────

// Create a daily attendance slot for a class
const createSlot = async (req, res) => {
  try {
    const { date, classId, sectionId, attendeeType } = req.body;

    if (!date || (!classId && attendeeType === ROLES.STUDENT)) {
      return res.status(400).json({ error: 'Date and class are required' });
    }

    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);

    const type = attendeeType || ROLES.STUDENT;

    // Check for duplicate
    const existing = await prisma.attendanceSlot.findFirst({
      where: {
        date: slotDate,
        attendeeType: type,
        classId: classId || null,
        sectionId: sectionId || null,
      },
    });

    if (existing) {
      return res.status(400).json({ error: `An attendance slot already exists for this ${type.toLowerCase()} list on this date` });
    }

    const slot = await prisma.attendanceSlot.create({
      data: {
        date: slotDate,
        attendeeType: type,
        classId: classId || null,
        sectionId: sectionId || null,
        createdBy: req.user.userId,
        status: 'OPEN',
      },
      include: {
        class: true,
        section: true,
      },
    });

    res.status(201).json({ message: 'Attendance slot created', slot });
  } catch (error) {
    console.error('Create slot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// List attendance slots (by date, classId)
const getSlots = async (req, res) => {
  try {
    const { date, classId, attendeeType } = req.query;

    const where = {};
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      where.date = d;
    }
    if (classId) where.classId = classId;
    if (attendeeType) where.attendeeType = attendeeType;

    const slots = await prisma.attendanceSlot.findMany({
      where,
      include: {
        class: true,
        section: true,
        _count: {
          select: { records: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ slots });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a single slot with its student list and any existing attendance
const getSlotWithStudents = async (req, res) => {
  try {
    const { id } = req.params;

    const slot = await prisma.attendanceSlot.findUnique({
      where: { id },
      include: {
        class: true,
        section: true,
        records: true,
      },
    });

    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    let entities = [];
    let attendanceMap = {};

    if (slot.attendeeType === ROLES.STUDENT) {
      // Fetch students for this class/section
      const studentWhere = { currentClassId: slot.classId, status: 'ACTIVE' };
      if (slot.sectionId) studentWhere.sectionId = slot.sectionId;

      const students = await prisma.student.findMany({
        where: studentWhere,
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
          section: {
            select: { id: true, name: true },
          },
        },
        orderBy: { admissionNumber: 'asc' },
      });

      entities = students.map(s => ({
        id: s.id,
        name: `${s.user.firstName} ${s.user.lastName}`,
        identifier: s.admissionNumber,
        type: 'STUDENT'
      }));

      slot.records.forEach((r) => {
        attendanceMap[r.studentId] = r.status;
      });
    } else if (slot.attendeeType === ROLES.TEACHER) {
      const teachers = await prisma.teacher.findMany({
        where: { status: 'ACTIVE' },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { employeeId: 'asc' }
      });

      entities = teachers.map(t => ({
        id: t.id,
        name: `${t.user.firstName} ${t.user.lastName}`,
        identifier: t.employeeId,
        type: 'TEACHER'
      }));

      slot.records.forEach((r) => {
        attendanceMap[r.teacherId] = r.status;
      });
    } else {
      const staff = await prisma.staff.findMany({
        where: { status: 'ACTIVE' },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { employeeId: 'asc' }
      });

      entities = staff.map(s => ({
        id: s.id,
        name: `${s.user.firstName} ${s.user.lastName}`,
        identifier: s.employeeId,
        type: 'STAFF'
      }));

      slot.records.forEach((r) => {
        attendanceMap[r.staffId] = r.status;
      });
    }

    res.json({ slot, entities, attendance: attendanceMap });
  } catch (error) {
    console.error('Get slot with entities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a slot (only if OPEN and no records)
const deleteSlot = async (req, res) => {
  try {
    const { id } = req.params;

    const slot = await prisma.attendanceSlot.findUnique({
      where: { id },
      include: { _count: { select: { records: true } } },
    });

    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    if (slot.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot delete a completed slot' });
    }

    if (slot._count.records > 0) {
      return res.status(400).json({ error: 'Cannot delete slot with existing attendance records' });
    }

    await prisma.attendanceSlot.delete({ where: { id } });
    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    console.error('Delete slot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Submit attendance for a slot — single batch transaction
const submitSlotAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendanceData } = req.body;
    // attendanceData: [{ entityId, status }]

    if (!attendanceData || !Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({ error: 'Attendance data is required' });
    }

    const slot = await prisma.attendanceSlot.findUnique({ where: { id } });
    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    // Run everything in one transaction
    await prisma.$transaction(async (tx) => {
      // Delete any existing records for this slot (in case of re-submit)
      await tx.attendanceRecord.deleteMany({ where: { slotId: id } });

      // Bulk-create all attendance records
      await tx.attendanceRecord.createMany({
        data: attendanceData.map(({ entityId, status }) => ({
          attendeeType: slot.attendeeType,
          ...(slot.attendeeType === ROLES.STUDENT ? { studentId: entityId } : {}),
          ...(slot.attendeeType === ROLES.TEACHER ? { teacherId: entityId } : {}),
          ...(slot.attendeeType === ROLES.STAFF ? { staffId: entityId } : {}),
          date: slot.date,
          status,
          slotId: id,
          markedBy: req.user.userId,
          checkInTime: status === ATTENDANCE_STATUS.PRESENT || status === ATTENDANCE_STATUS.LATE ? new Date() : null,
        })),
      });

      // Mark slot as completed
      await tx.attendanceSlot.update({
        where: { id },
        data: { status: 'COMPLETED', closedAt: new Date() },
      });
    });

    res.json({
      message: `Attendance saved for ${attendanceData.length} entries`,
      count: attendanceData.length,
    });
  } catch (error) {
    console.error('Submit slot attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Submit batch attendance for staff/teachers
const submitStaffAttendance = async (req, res) => {
  try {
    const { date, attendanceData, attendeeType } = req.body;
    // attendanceData: [{ employeeId, userId, status, remarks }]
    // attendeeType: 'TEACHER' or 'STAFF'

    if (!date || !attendanceData || !Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({ error: 'Attendance data and date are required' });
    }

    if (![ROLES.TEACHER, ROLES.STAFF].includes(attendeeType)) {
      return res.status(400).json({ error: 'Invalid attendee type for staff attendance' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Run in transaction to ensure consistent state
    await prisma.$transaction(async (tx) => {
      // 1. Remove existing records for these employees on this date to allow re-submission
      const userIds = attendanceData.map(d => d.userId);

      if (attendeeType === ROLES.TEACHER) {
        await tx.attendanceRecord.deleteMany({
          where: {
            date: attendanceDate,
            attendeeType: ROLES.TEACHER,
            teacher: { userId: { in: userIds } }
          }
        });
      } else {
        await tx.attendanceRecord.deleteMany({
          where: {
            date: attendanceDate,
            attendeeType: ROLES.STAFF,
            staff: { userId: { in: userIds } }
          }
        });
      }

      // 2. Prepare records
      // We need to fetch the Teacher/Staff IDs correctly from User IDs
      const records = [];

      for (const data of attendanceData) {
        let teacherId = null;
        let staffId = null;

        if (attendeeType === ROLES.TEACHER) {
          const teacher = await tx.teacher.findUnique({ where: { userId: data.userId } });
          if (teacher) teacherId = teacher.id;
        } else {
          const staff = await tx.staff.findUnique({ where: { userId: data.userId } });
          if (staff) staffId = staff.id;
        }

        if (!teacherId && !staffId) continue; // Skip if identity not found

        records.push({
          attendeeType,
          teacherId,
          staffId,
          date: attendanceDate,
          status: data.status,
          remarks: data.remarks || null,
          markedBy: req.user.userId,
          checkInTime: (data.status === ATTENDANCE_STATUS.PRESENT || data.status === ATTENDANCE_STATUS.LATE) ? new Date() : null,
        });
      }

      // 3. Create records
      if (records.length > 0) {
        await tx.attendanceRecord.createMany({
          data: records
        });
      }
    });

    res.json({
      message: `Batch attendance saved for ${attendanceData.length} ${attendeeType.toLowerCase()}s`,
      count: attendanceData.length,
    });
  } catch (error) {
    console.error('Submit staff attendance error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// QR scan handler — used by kiosk/scanner page
// POST /api/attendance/qr-scan
// Body: { qrPayload, scannerId, scanLat, scanLng }
const handleQRScan = async (req, res) => {
  try {
    const { qrPayload, scannerId, scanLat, scanLng, action, date, attendeeType: sessionAttendeeType, classId, sectionId } = req.body;

    // 1. Validate inputs
    if (!qrPayload || !scannerId) {
      return res.status(400).json({ error: 'qrPayload and scannerId are required' });
    }

    // 2. Parse QR payload -> userId
    const userId = parseQRPayload(qrPayload);
    if (!userId) {
      return res.status(400).json({ error: 'Invalid or unreadable QR code' });
    }

    // 3. Validate scanner
    const scanner = await prisma.qRScanner.findUnique({ where: { id: scannerId } });
    if (!scanner) {
      return res.status(404).json({ error: 'Scanner not found' });
    }
    if (!scanner.isActive) {
      return res.status(403).json({ error: 'This scanner is currently inactive' });
    }

    // 4. Fetch user + role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, firstName: true, lastName: true, role: true, roles: true, avatar: true, isActive: true,
        student: { select: { id: true, currentClassId: true, sectionId: true } },
        teacher: { select: { id: true, assignedScannerId: true } },
        staff: { select: { id: true, assignedScannerId: true } },
      },
    });
    if (!user || !user.isActive) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }

    // 4.1 Check scanner assignment (for Teachers and Staff)
    const assignedScannerId = user.teacher?.assignedScannerId || user.staff?.assignedScannerId;
    if (assignedScannerId && assignedScannerId !== scannerId) {
      const assignedScanner = await prisma.qRScanner.findUnique({
        where: { id: assignedScannerId },
        select: { name: true }
      });
      return res.status(403).json({
        error: `You are assigned to scan at: ${assignedScanner?.name || 'a different scanner'}`,
        assignedScannerId,
        assignedScannerName: assignedScanner?.name || 'Assigned Scanner'
      });
    }

    // 5. Check role is allowed by the scanner
    if (!scanner.allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `This scanner is not configured for ${user.role} role`,
        allowedRoles: scanner.allowedRoles,
      });
    }

    // 6. Geofence check
    const parsedLat = scanLat != null ? parseFloat(scanLat) : null;
    const parsedLng = scanLng != null ? parseFloat(scanLng) : null;
    const geo = checkGeofence(scanner, parsedLat, parsedLng);
    if (!geo.valid) {
      return res.status(403).json({
        error: geo.reason,
        distanceMetres: geo.distanceMetres,
        geofenceRadius: scanner.geofenceRadius,
      });
    }

    // 7. Session parameters & Slot Integration
    const scanDate = date ? new Date(date) : new Date();
    scanDate.setHours(0, 0, 0, 0);
    const now = new Date();

    // Determine attendeeType and linked id
    let attendeeType, studentId, teacherId, staffId;
    if (user.role === ROLES.STUDENT && user.student) {
      attendeeType = ROLES.STUDENT; studentId = user.student.id;
    } else if (user.role === ROLES.TEACHER && user.teacher) {
      attendeeType = ROLES.TEACHER; teacherId = user.teacher.id;
    } else if (user.staff) {
      attendeeType = ROLES.STAFF; staffId = user.staff.id;
    } else {
      attendeeType = ROLES.STAFF; // fallback for admin-type roles
    }

    // Verify session attendee type matches user
    if (sessionAttendeeType && sessionAttendeeType !== attendeeType) {
      return res.status(403).json({ error: `This session is for ${sessionAttendeeType}s, but you are a ${attendeeType}` });
    }

    // 8. Find/Create Slot automatically
    let slotId = null;
    if (action) {
      // For students, use their current class/section automatically if available
      const effectiveClassId = classId || user.student?.currentClassId || null;
      const effectiveSectionId = sectionId || user.student?.sectionId || null;

      const slot = await prisma.attendanceSlot.upsert({
        where: {
          date_attendeeType_classId_sectionId: {
            date: scanDate,
            attendeeType,
            classId: effectiveClassId,
            sectionId: effectiveSectionId,
          }
        },
        update: {},
        create: {
          date: scanDate,
          attendeeType,
          classId: effectiveClassId,
          sectionId: effectiveSectionId,
          createdBy: scanner.createdBy,
          status: 'OPEN'
        }
      });
      slotId = slot.id;
    }

    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        date: scanDate,
        attendeeType,
        ...(studentId ? { studentId } : {}),
        ...(teacherId ? { teacherId } : {}),
        ...(staffId ? { staffId } : {}),
        ...(slotId ? { slotId } : {}),
      },
    });

    let scanAction, record;

    // Use explicit action from request or fallback to auto-toggle logic
    const requestedAction = action || (existingRecord ? 'checkout' : 'checkin');

    if (requestedAction === 'checkin') {
      if (existingRecord) {
        return res.status(400).json({ error: 'You have already checked in for this session' });
      }

      const schoolStartTime = await getConfigValue('school_start_time', DEFAULTS.SCHOOL_START_TIME);
      const [h, m] = schoolStartTime.split(':');
      const startTime = new Date(scanDate);
      startTime.setHours(parseInt(h), parseInt(m), 0);
      const isLate = now > startTime;

      record = await prisma.attendanceRecord.create({
        data: {
          attendeeType,
          ...(studentId ? { studentId } : {}),
          ...(teacherId ? { teacherId } : {}),
          ...(staffId ? { staffId } : {}),
          date: scanDate,
          checkInTime: now,
          status: isLate ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT,
          scannedByQR: true,
          scannerId,
          slotId,
          scanLatitude: parsedLat,
          scanLongitude: parsedLng,
          geofenceValid: geo.distanceMetres != null ? true : null,
        },
      });
      scanAction = 'checkin';
    } else if (requestedAction === 'checkout') {
      if (!existingRecord) {
        return res.status(400).json({ error: 'No check-in record found. Please check-in first.' });
      }
      if (existingRecord.checkOutTime) {
        return res.status(400).json({ error: 'You have already checked out for this session' });
      }

      record = await prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: {
          checkOutTime: now,
          scanLatitude: parsedLat,
          scanLongitude: parsedLng,
        },
      });
      scanAction = 'checkout';
    }

    // 9. Emit Socket.IO event for real-time dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('attendance:qr-scan', {
        action: scanAction,
        user: { id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role, avatar: user.avatar },
        record,
        scanner: { id: scanner.id, name: scanner.name, scannerType: scanner.scannerType },
        distanceMetres: geo.distanceMetres,
        timestamp: now.toISOString(),
      });
    }

    // 10. Respond
    const statusCode = scanAction === 'checkin' ? 201 : 200;
    res.status(statusCode).json({
      action: scanAction,
      message: scanAction === 'checkin' ? 'Check-in recorded' : 'Check-out recorded',
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role, avatar: user.avatar },
      record,
      distanceMetres: geo.distanceMetres,
      scanner: { id: scanner.id, name: scanner.name },
    });
  } catch (error) {
    console.error('QR scan error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = {
  markAttendance,
  getAttendanceByDate,
  handleRFIDScan,
  handleQRScan,
  bulkMarkAttendance,
  getAttendanceReport,
  createSlot,
  getSlots,
  getSlotWithStudents,
  deleteSlot,
  submitSlotAttendance,
  submitStaffAttendance,
};
