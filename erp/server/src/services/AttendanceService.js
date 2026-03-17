const { checkGeofence } = require('../utils/geoUtils');
const { parseQRPayload } = require('../utils/qrGenerator');
const AttendanceRepository = require('../repositories/AttendanceRepository');
const { getConfigValue } = require('../utils/configHelper');
const { DEFAULTS, ATTENDANCE_STATUS, ROLES } = require('../constants');
const AppError = require('../utils/AppError');

/**
 * Service for Attendance related business logic
 */
class AttendanceService {
    async markAttendance(data, userId) {
        const { studentId, date, status, scannedByRFID, deviceId, remarks } = data;
        
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        const existing = await AttendanceRepository.findAttendance(studentId, attendanceDate, ROLES.STUDENT);
        if (existing) throw new AppError('Attendance already marked for this date', 400);

        return AttendanceRepository.createAttendance({
            studentId,
            attendeeType: ROLES.STUDENT,
            date: attendanceDate,
            checkInTime: status === ATTENDANCE_STATUS.PRESENT || status === ATTENDANCE_STATUS.LATE ? new Date() : null,
            status,
            scannedByRFID: scannedByRFID || false,
            deviceId,
            markedBy: userId,
            remarks
        });
    }

    async getAttendanceByDate(query) {
        const { date, classId, sectionId, attendeeType = ROLES.STUDENT } = query;
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        if (attendeeType === ROLES.STUDENT) {
            const studentWhere = {};
            if (classId) studentWhere.currentClassId = classId;
            if (sectionId) studentWhere.sectionId = sectionId;

            const students = await AttendanceRepository.findActiveStudents(studentWhere);
            const records = await AttendanceRepository.findAttendanceRecords({
                date: attendanceDate,
                attendeeType: ROLES.STUDENT,
                studentId: { in: students.map(s => s.id) }
            });

            const attendanceMap = new Map();
            records.forEach(r => attendanceMap.set(r.studentId, r));

            const attendance = students.map(student => ({
                student,
                attendance: attendanceMap.get(student.id) || null
            }));

            const stats = {
                total: students.length,
                present: records.filter(a => a.status === ATTENDANCE_STATUS.PRESENT).length,
                absent: records.filter(a => a.status === ATTENDANCE_STATUS.ABSENT).length,
                late: records.filter(a => a.status === ATTENDANCE_STATUS.LATE).length,
                marked: records.length,
                unmarked: students.length - records.length
            };

            return { attendance, stats };
        } else {
            // Staff/Teacher logic
            let entities = [];
            if (attendeeType === ROLES.TEACHER) {
                entities = await AttendanceRepository.findTeachersForSlot();
            } else {
                entities = await AttendanceRepository.findStaffForSlot();
            }

            const entityIds = entities.map(e => e.id);
            const records = await AttendanceRepository.findAttendanceRecords({
                date: attendanceDate,
                attendeeType,
                ...(attendeeType === ROLES.TEACHER ? { teacherId: { in: entityIds } } : { staffId: { in: entityIds } })
            });

            const attendanceMap = new Map();
            records.forEach(r => attendanceMap.set(attendeeType === ROLES.TEACHER ? r.teacherId : r.staffId, r));

            const attendance = entities.map(entity => ({
                entity,
                attendance: attendanceMap.get(entity.id) || null
            }));

            const stats = {
                total: entities.length,
                present: records.filter(a => a.status === ATTENDANCE_STATUS.PRESENT).length,
                absent: records.filter(a => a.status === ATTENDANCE_STATUS.ABSENT).length,
                late: records.filter(a => a.status === ATTENDANCE_STATUS.LATE).length,
                marked: records.length,
            };

            return { attendance, stats, isMarked: records.length > 0 };
        }
    }

    async handleRFIDScan(cardNumber, deviceId) {
        const rfidCard = await AttendanceRepository.findRFIDCard(cardNumber);
        if (!rfidCard || !rfidCard.isActive) throw new AppError('Invalid or inactive RFID card', 404);
        if (!rfidCard.studentId) throw new AppError('Card not assigned to student', 400);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await AttendanceRepository.findAttendance(rfidCard.studentId, today, ROLES.STUDENT);
        if (existing) {
            const updated = await AttendanceRepository.updateAttendance(existing.id, { checkOutTime: new Date() });
            return { message: 'Check-out recorded', attendance: updated, student: rfidCard.student, action: 'checkout' };
        }

        const now = new Date();
        const schoolStartTime = await getConfigValue('school_start_time', DEFAULTS.SCHOOL_START_TIME);
        const [hours, minutes] = schoolStartTime.split(':');
        const startTime = new Date(today);
        startTime.setHours(parseInt(hours), parseInt(minutes), 0);

        const isLate = now > startTime;
        const status = isLate ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT;

        const attendance = await AttendanceRepository.createAttendance({
            studentId: rfidCard.studentId,
            attendeeType: ROLES.STUDENT,
            date: today,
            checkInTime: now,
            status,
            scannedByRFID: true,
            deviceId: deviceId || 'UNKNOWN'
        });

        return { message: isLate ? 'Late arrival recorded' : 'Attendance marked', attendance, student: rfidCard.student, action: 'checkin', isLate };
    }

    async bulkMarkAttendance(date, attendanceData, userId) {
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        const existingRecords = await AttendanceRepository.findAttendanceRecords({
            date: attendanceDate,
            attendeeType: ROLES.STUDENT,
            studentId: { in: attendanceData.map(a => a.studentId) }
        });

        const existingMap = new Map();
        existingRecords.forEach(r => existingMap.set(r.studentId, r));

        const results = await Promise.all(attendanceData.map(async ({ studentId, status }) => {
            try {
                const existing = existingMap.get(studentId);
                if (existing) {
                    return await AttendanceRepository.updateAttendance(existing.id, {
                        status,
                        checkInTime: (status === ATTENDANCE_STATUS.PRESENT || status === ATTENDANCE_STATUS.LATE) ? new Date() : null,
                        markedBy: userId
                    });
                } else {
                    return await AttendanceRepository.createAttendance({
                        studentId,
                        attendeeType: ROLES.STUDENT,
                        date: attendanceDate,
                        checkInTime: (status === ATTENDANCE_STATUS.PRESENT || status === ATTENDANCE_STATUS.LATE) ? new Date() : null,
                        status,
                        markedBy: userId
                    });
                }
            } catch (err) {
                return { studentId, error: err.message };
            }
        }));

        return {
            successful: results.filter(r => !r.error).length,
            failed: results.filter(r => r.error).length,
            failures: results.filter(r => r.error)
        };
    }

    async getAttendanceReport(query) {
        const { startDate, endDate, classId, sectionId } = query;
        const where = { attendeeType: ROLES.STUDENT };
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const studentWhere = {};
        if (classId) studentWhere.currentClassId = classId;
        if (sectionId) studentWhere.sectionId = sectionId;

        const students = await AttendanceRepository.findActiveStudents(studentWhere);
        const records = await AttendanceRepository.findAttendanceRecords({
            ...where,
            studentId: { in: students.map(s => s.id) }
        });

        const report = students.map(student => {
            const studentRecords = records.filter(r => r.studentId === student.id);
            return {
                student,
                stats: {
                    total: studentRecords.length,
                    present: studentRecords.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length,
                    absent: studentRecords.filter(r => r.status === ATTENDANCE_STATUS.ABSENT).length,
                    late: studentRecords.filter(r => r.status === ATTENDANCE_STATUS.LATE).length,
                    percentage: studentRecords.length > 0
                        ? (((studentRecords.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length + 
                            studentRecords.filter(r => r.status === ATTENDANCE_STATUS.LATE).length) / studentRecords.length) * 100).toFixed(2)
                        : 0
                }
            };
        });

        return { report };
    }

    async createSlot(data, userId) {
        const { date, classId, sectionId, subjectId, attendeeType } = data;
        const slotDate = new Date(date);
        slotDate.setHours(0, 0, 0, 0);
        const type = attendeeType || ROLES.STUDENT;

        const existing = await AttendanceRepository.findAttendanceSlot({
            date: slotDate,
            attendeeType: type,
            classId: classId || null,
            sectionId: sectionId || null,
            subjectId: subjectId || null
        });

        if (existing) throw new AppError(`An attendance slot already exists for this ${type.toLowerCase()} list on this date`, 400);

        return AttendanceRepository.createAttendanceSlot({
            date: slotDate,
            attendeeType: type,
            classId: classId || null,
            sectionId: sectionId || null,
            subjectId: subjectId || null,
            createdBy: userId,
            status: 'OPEN'
        });
    }

    async getSlots(query) {
        const { date, classId, subjectId, attendeeType } = query;
        const where = {};
        if (date) {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            where.date = d;
        }
        if (classId) where.classId = classId;
        if (subjectId) where.subjectId = subjectId;
        if (attendeeType) where.attendeeType = attendeeType;

        return AttendanceRepository.findAttendanceSlots(where);
    }

    async getSlotWithEntities(id) {
        const slot = await AttendanceRepository.findAttendanceSlotById(id);
        if (!slot) throw new AppError('Slot not found', 404);

        let entities = [];
        let attendanceMap = {};

        if (slot.attendeeType === ROLES.STUDENT) {
            const students = await AttendanceRepository.findStudentsForSlot(slot.classId, slot.sectionId);
            entities = students.map(s => ({
                id: s.id,
                name: `${s.user.firstName} ${s.user.lastName}`,
                identifier: s.admissionNumber,
                type: 'STUDENT'
            }));
            slot.records.forEach(r => attendanceMap[r.studentId] = r.status);
        } else if (slot.attendeeType === ROLES.TEACHER) {
            const teachers = await AttendanceRepository.findTeachersForSlot();
            entities = teachers.map(t => ({
                id: t.id,
                name: `${t.user.firstName} ${t.user.lastName}`,
                identifier: t.employeeId,
                type: 'TEACHER'
            }));
            slot.records.forEach(r => attendanceMap[r.teacherId] = r.status);
        } else {
            const staff = await AttendanceRepository.findStaffForSlot();
            entities = staff.map(s => ({
                id: s.id,
                name: `${s.user.firstName} ${s.user.lastName}`,
                identifier: s.employeeId,
                type: 'STAFF'
            }));
            slot.records.forEach(r => attendanceMap[r.staffId] = r.status);
        }

        return { slot, entities, attendance: attendanceMap };
    }

    async deleteSlot(id) {
        const slot = await AttendanceRepository.findAttendanceSlotById(id);
        if (!slot) throw new AppError('Slot not found', 404);
        if (slot.status === 'COMPLETED') throw new AppError('Cannot delete a completed slot', 400);
        if (slot._count.records > 0) throw new AppError('Cannot delete slot with existing attendance records', 400);

        return AttendanceRepository.deleteAttendanceSlot(id);
    }

    async submitSlotAttendance(id, attendanceData, userId) {
        const slot = await AttendanceRepository.findAttendanceSlotById(id);
        if (!slot) throw new AppError('Slot not found', 404);

        await AttendanceRepository.executeTransaction(async (tx) => {
            await tx.attendanceRecord.deleteMany({ where: { slotId: id } });
            await tx.attendanceRecord.createMany({
                data: attendanceData.map(({ entityId, status }) => ({
                    attendeeType: slot.attendeeType,
                    ...(slot.attendeeType === ROLES.STUDENT ? { studentId: entityId } : {}),
                    ...(slot.attendeeType === ROLES.TEACHER ? { teacherId: entityId } : {}),
                    ...(slot.attendeeType === ROLES.STAFF ? { staffId: entityId } : {}),
                    date: slot.date,
                    status,
                    slotId: id,
                    subjectId: slot.subjectId,
                    markedBy: userId,
                    checkInTime: (status === ATTENDANCE_STATUS.PRESENT || status === ATTENDANCE_STATUS.LATE) ? new Date() : null
                }))
            });
            await tx.attendanceSlot.update({
                where: { id },
                data: { status: 'COMPLETED', closedAt: new Date() }
            });
        });

        return { count: attendanceData.length };
    }
    async submitStaffAttendance(data, userId) {
        const { date, attendanceData, attendeeType } = data;
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        await AttendanceRepository.executeTransaction(async (tx) => {
            const userIds = attendanceData.map(d => d.userId);
            if (attendeeType === ROLES.TEACHER) {
                await tx.attendanceRecord.deleteMany({
                    where: { date: attendanceDate, attendeeType: ROLES.TEACHER, teacher: { userId: { in: userIds } } }
                });
            } else {
                await tx.attendanceRecord.deleteMany({
                    where: { date: attendanceDate, attendeeType: ROLES.STAFF, staff: { userId: { in: userIds } } }
                });
            }

            const records = [];
            for (const d of attendanceData) {
                let entityId = null;
                if (attendeeType === ROLES.TEACHER) {
                    const teacher = await tx.teacher.findUnique({ where: { userId: d.userId } });
                    if (teacher) entityId = teacher.id;
                } else {
                    const staff = await tx.staff.findUnique({ where: { userId: d.userId } });
                    if (staff) entityId = staff.id;
                }

                if (!entityId) continue;

                records.push({
                    attendeeType,
                    ...(attendeeType === ROLES.TEACHER ? { teacherId: entityId } : { staffId: entityId }),
                    date: attendanceDate,
                    status: d.status,
                    remarks: d.remarks || null,
                    markedBy: userId,
                    checkInTime: (d.status === ATTENDANCE_STATUS.PRESENT || d.status === ATTENDANCE_STATUS.LATE) ? new Date() : null
                });
            }

            if (records.length > 0) {
                await tx.attendanceRecord.createMany({ data: records });
            }
        });

        return { count: attendanceData.length };
    }

    async handleQRScan(data, userId) {
        const { qrPayload, scannerId, scanLat, scanLng, action, classId, sectionId } = data;

        const scanUserId = parseQRPayload(qrPayload);
        if (!scanUserId) throw new AppError('Invalid or unreadable QR code', 400);

        const scanner = await AttendanceRepository.findScannerById(scannerId);
        if (!scanner) throw new AppError('Scanner not found', 404);
        if (!scanner.isActive) throw new AppError('This scanner is currently inactive', 403);

        const scanUser = await AttendanceRepository.findUserById(scanUserId);
        if (!scanUser || !scanUser.isActive) throw new AppError('User not found or inactive', 404);

        if (!scanner.allowedRoles.includes(scanUser.role)) {
            throw new AppError(`This scanner is not configured for ${scanUser.role} role`, 403);
        }

        const assignedScannerId = scanUser.teacher?.assignedScannerId || scanUser.staff?.assignedScannerId;
        if (assignedScannerId && assignedScannerId !== scannerId) {
            const assignedScanner = await AttendanceRepository.findScannerById(assignedScannerId);
            throw new AppError(`You are assigned to scan at: ${assignedScanner?.name || 'a different scanner'}`, 403);
        }

        if (scanner.geofenceEnabled && scanner.latitude && scanner.longitude) {
            if (!scanLat || !scanLng) throw new AppError('Location access required for this scanner', 403);
            const isInside = checkGeofence(scanLat, scanLng, scanner.latitude, scanner.longitude, scanner.geofenceRadius || 100);
            if (!isInside) throw new AppError('You are outside the allowed scanning area', 403);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const entityId = scanUser.student?.id || scanUser.teacher?.id || scanUser.staff?.id;
        const attendeeType = scanUser.role === ROLES.STUDENT ? ROLES.STUDENT : (scanUser.role === ROLES.TEACHER ? ROLES.TEACHER : ROLES.STAFF);

        // Auto-handle slot
        let slotId = null;
        const effectiveClassId = classId || scanUser.student?.currentClassId || null;
        const effectiveSectionId = sectionId || scanUser.student?.sectionId || null;

        // Upsert slot using repository (I'll need to add a method for this or use transact)
        const slot = await AttendanceRepository.findAttendanceSlot({
            date: today,
            attendeeType,
            classId: effectiveClassId,
            sectionId: effectiveSectionId
        }) || await AttendanceRepository.createAttendanceSlot({
            date: today,
            attendeeType,
            classId: effectiveClassId,
            sectionId: effectiveSectionId,
            createdBy: scanner.createdBy || userId,
            status: 'OPEN'
        });
        slotId = slot.id;

        const existing = await AttendanceRepository.findAttendance(entityId, today, attendeeType);

        if (action === 'checkout' || (existing && !existing.checkOutTime)) {
             if (!existing) throw new AppError('No check-in record found for today', 400);
             if (existing.checkOutTime) throw new AppError('Already checked out', 400);
             const updated = await AttendanceRepository.updateAttendance(existing.id, { 
                 checkOutTime: new Date(),
                 scanLatitude: scanLat,
                 scanLongitude: scanLng
             });
             return { message: 'Check-out recorded', attendance: updated, user: scanUser, action: 'checkout' };
        }

        if (existing) throw new AppError('Attendance already marked for today', 400);

        const now = new Date();
        const schoolStartTime = await getConfigValue('school_start_time', DEFAULTS.SCHOOL_START_TIME);
        const [hours, minutes] = schoolStartTime.split(':');
        const startTime = new Date(today);
        startTime.setHours(parseInt(hours), parseInt(minutes), 0);

        const isLate = now > startTime;
        const attendance = await AttendanceRepository.createAttendance({
            ...(attendeeType === ROLES.STUDENT ? { studentId: entityId } : {}),
            ...(attendeeType === ROLES.TEACHER ? { teacherId: entityId } : {}),
            ...(attendeeType === ROLES.STAFF ? { staffId: entityId } : {}),
            attendeeType,
            date: today,
            checkInTime: now,
            status: isLate ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT,
            deviceId: scannerId,
            scannedByQR: true,
            scannerId,
            slotId,
            scanLatitude: scanLat,
            scanLongitude: scanLng,
            remarks: `Scanned at QR Scanner: ${scanner.name}`
        });

        return { message: isLate ? 'Late arrival recorded' : 'Attendance marked', attendance, user: scanUser, action: 'checkin', isLate };
    }

    async getAttendanceAnalytics(query) {
        const { classId, sectionId, startDate, endDate, attendeeType = 'STUDENT' } = query;

        const now = new Date();
        const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const studentWhere = { status: 'ACTIVE' };
        if (classId) studentWhere.currentClassId = classId;
        if (sectionId) studentWhere.sectionId = sectionId;

        const students = await AttendanceRepository.findActiveStudents(studentWhere);
        const studentIds = students.map(s => s.id);

        const records = await AttendanceRepository.findAttendanceRecords({
            attendeeType,
            date: { gte: start, lte: end },
            studentId: { in: studentIds }
        });

        const dateStudentMap = {};
        records.forEach(r => {
            const dateKey = r.date.toISOString().split('T')[0];
            if (!dateStudentMap[dateKey]) dateStudentMap[dateKey] = {};
            dateStudentMap[dateKey][r.studentId] = r.status;
        });

        const dailyBreakdown = [];
        const cursor = new Date(start);
        while (cursor <= end) {
            const dateKey = cursor.toISOString().split('T')[0];
            const dayRecords = dateStudentMap[dateKey] || {};
            const statuses = Object.values(dayRecords);
            const isWeekend = cursor.getDay() === 0 || cursor.getDay() === 6;

            dailyBreakdown.push({
                date: dateKey,
                dayLabel: cursor.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                dayName: cursor.toLocaleDateString('en-IN', { weekday: 'short' }),
                isWeekend,
                marked: statuses.length > 0,
                present: statuses.filter(s => s === ATTENDANCE_STATUS.PRESENT).length,
                absent: statuses.filter(s => s === ATTENDANCE_STATUS.ABSENT).length,
                late: statuses.filter(s => s === ATTENDANCE_STATUS.LATE).length,
                total: students.length
            });
            cursor.setDate(cursor.getDate() + 1);
        }

        const studentMatrix = students.map(student => {
            const studentRecords = records.filter(r => r.studentId === student.id);
            const byDate = {};
            studentRecords.forEach(r => byDate[r.date.toISOString().split('T')[0]] = r.status);

            const markedDates = studentRecords.length;
            const presentDays = studentRecords.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length;
            const absentDays = studentRecords.filter(r => r.status === ATTENDANCE_STATUS.ABSENT).length;
            const lateDays = studentRecords.filter(r => r.status === ATTENDANCE_STATUS.LATE).length;
            const attendancePct = markedDates > 0 ? Math.round(((presentDays + lateDays) / markedDates) * 100) : 0;

            return {
                studentId: student.id,
                admissionNumber: student.admissionNumber,
                name: `${student.user.firstName} ${student.user.lastName}`,
                records: byDate,
                stats: { presentDays, absentDays, lateDays, markedDates, attendancePct }
            };
        });

        const markedDays = dailyBreakdown.filter(d => d.marked).length;
        const workingDays = dailyBreakdown.filter(d => !d.isWeekend).length;
        const totalPresents = dailyBreakdown.reduce((acc, d) => acc + (d.present + d.late), 0);
        const totalPossible = workingDays * students.length;
        const avgAttendancePct = totalPossible > 0 ? Math.round((totalPresents / totalPossible) * 100) : 0;

        return {
            dateRange: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] },
            summary: { totalStudents: students.length, workingDays, markedDays, avgAttendancePct },
            dailyBreakdown,
            studentMatrix
        };
    }
}

module.exports = new AttendanceService();
