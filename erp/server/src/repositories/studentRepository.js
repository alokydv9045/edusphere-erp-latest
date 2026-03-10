const prisma = require('../config/database');

class StudentRepository {
    /**
     * Find students with filtering and pagination
     */
    async findManyWithFilters(where, skip, take) {
        const students = await prisma.student.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        dateOfBirth: true,
                        gender: true,
                    },
                },
                currentClass: { select: { id: true, name: true } },
                section: { select: { id: true, name: true } },
                academicYear: { select: { id: true, name: true } },
            },
            skip,
            take,
            orderBy: { createdAt: 'desc' },
        });

        const total = await prisma.student.count({ where });

        return [students, total];
    }

    /**
     * Find a single student by ID
     */
    async findById(id) {
        return prisma.student.findUnique({
            where: { id },
            // FIXED N+1 QUERY: Fetching all relations in one query
            include: {
                user: true,
                currentClass: true,
                section: true,
                academicYear: true,
                parents: {
                    include: {
                        parent: true,
                    },
                },
                rfidCard: true,
                documents: true,
            },
        });
    }

    /**
     * Find a student by admission number
     */
    async findByAdmissionNumber(admissionNumber) {
        return prisma.student.findUnique({
            where: { admissionNumber },
        });
    }

    /**
     * Find a student by User ID
     */
    async findByUserId(userId) {
        return prisma.student.findFirst({
            where: { userId },
            include: {
                user: true,
                currentClass: true,
                section: true,
                academicYear: true,
                parents: {
                    include: {
                        parent: true,
                    },
                },
                rfidCard: true,
                documents: true,
            },
        });
    }

    /**
     * Create a basic student
     */
    async create(data) {
        return prisma.student.create({
            data,
            include: {
                user: true,
                currentClass: true,
                section: true,
                academicYear: true,
            },
        });
    }

    /**
     * Update student details
     */
    async update(id, data) {
        return prisma.student.update({
            where: { id },
            data,
            include: {
                user: true,
                currentClass: true,
                section: true,
            },
        });
    }

    /**
     * Get student attendance with date filters
     */
    async getAttendance(studentId, dateFilters) {
        const where = { studentId, ...dateFilters };
        return prisma.attendanceRecord.findMany({
            where,
            orderBy: { date: 'desc' },
        });
    }

    /**
     * Get student count for a specific class and section
     */
    async countByClassAndSection(classId, sectionId) {
        return prisma.student.count({
            where: { currentClassId: classId, sectionId },
        });
    }

    /**
     * Get the global Prisma client or transaction client
     * Used for passing the transaction context down from the service
     */
    getClient(tx) {
        return tx || prisma;
    }
}

module.exports = new StudentRepository();
