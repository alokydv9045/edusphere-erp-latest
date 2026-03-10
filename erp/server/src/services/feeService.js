const feeRepo = require('../repositories/feeRepository');
const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');

class FeeService {
    /**
     * Get all fee structures with filters
     */
    async getFeeStructures(filters) {
        const { classId, academicYearId, isActive } = filters;

        const where = {};
        if (classId) where.classId = classId;
        if (academicYearId) where.academicYearId = academicYearId;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const feeStructures = await feeRepo.findFeeStructures(where);

        // Enrich with Class and Academic Year
        const enrichedStructures = await Promise.all(
            feeStructures.map(async (structure) => {
                let classDetails = null;
                let academicYearDetails = null;
                if (structure.classId) {
                    classDetails = await feeRepo.findClassById(structure.classId);
                }
                if (structure.academicYearId) {
                    academicYearDetails = await feeRepo.findAcademicYearById(structure.academicYearId);
                }
                return {
                    ...structure,
                    amount: structure.totalAmount, // Alias for frontend compatibility
                    class: classDetails,
                    academicYear: academicYearDetails,
                };
            })
        );

        const total = enrichedStructures.length;
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 10;

        return {
            structures: enrichedStructures,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        };
    }

    /**
     * Get students with fee status for Fee Management listing
     */
    async getFeeStudents(query) {
        const {
            search,
            classId,
            sectionId,
            status, // PAID, PENDING, or OVERDUE
            page = 1,
            limit = 10
        } = query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = { status: 'ACTIVE' }; // Only active students

        if (classId) where.currentClassId = classId;
        if (sectionId) where.sectionId = sectionId;

        if (search) {
            where.OR = [
                { admissionNumber: { contains: search, mode: 'insensitive' } },
                { user: { firstName: { contains: search, mode: 'insensitive' } } },
                { user: { lastName: { contains: search, mode: 'insensitive' } } },
                { rollNumber: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [students, total] = await feeRepo.getFeeStudentsList(where, skip, take);

        // Compute fee status per student based on ledgers
        const enrichedStudents = students.map(student => {
            let totalPayable = 0;
            let totalPaid = 0;
            let totalPending = 0;

            if (student.feeLedgers && student.feeLedgers.length > 0) {
                totalPayable = student.feeLedgers.reduce((sum, l) => sum + (l.totalPayable || 0), 0);
                totalPaid = student.feeLedgers.reduce((sum, l) => sum + (l.totalPaid || 0), 0);
                totalPending = student.feeLedgers.reduce((sum, l) => sum + (l.totalPending || 0), 0);
            }

            let computedStatus = 'PAID';
            if (totalPayable === 0) {
                computedStatus = 'N/A';
            } else if (totalPending > 0) {
                computedStatus = totalPaid > 0 ? 'PARTIAL' : 'PENDING';
            }

            return {
                id: student.id,
                admissionNumber: student.admissionNumber,
                rollNumber: student.rollNumber,
                name: `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.trim(),
                className: student.currentClass?.name || 'N/A',
                sectionName: student.section?.name || 'N/A',
                totalPayable,
                totalPaid,
                totalPending,
                feeStatus: computedStatus
            };
        });

        // Filter by computed fee status if provided
        let resultStudents = enrichedStudents;
        if (status) {
            resultStudents = resultStudents.filter(s => {
                if (status === 'PAID') return s.feeStatus === 'PAID';
                if (status === 'PENDING') return s.feeStatus === 'PENDING' || s.feeStatus === 'PARTIAL';
                return true;
            });
        }

        return {
            students: resultStudents,
            pagination: {
                total,
                pages: Math.ceil(total / take),
                page: parseInt(page),
                limit: take
            }
        };
    }

    /**
     * Create new fee structure
     */
    async createFeeStructure(data) {
        // Allow multiple structures (e.g., Tuition, Transport, Exam). 
        // Only prevent duplicates if the name matches for the exact same class/year scope.
        const existing = await feeRepo.findFeeStructures({
            name: data.name,
            classId: data.classId,
            academicYearId: data.academicYearId,
            isActive: true
        });

        if (existing && existing.length > 0) {
            throw new ValidationError(`An active fee structure named '${data.name}' already exists for this class and academic year`);
        }

        const totalAmount = data.feeHeads.reduce((sum, head) => sum + parseFloat(head.amount || 0), 0);

        const feeStructureData = {
            name: data.name,
            description: data.description,
            classId: data.classId,
            academicYearId: data.academicYearId,
            totalAmount,
            frequency: data.frequency,
            dueDay: parseInt(data.dueDay) || 10,
            earlyPaymentDiscount: parseFloat(data.earlyPaymentDiscount || 0),
            latePaymentPenalty: parseFloat(data.latePaymentPenalty || 0),
            items: {
                create: data.feeHeads.map(item => ({
                    headName: item.headName,
                    amount: parseFloat(item.amount || 0),
                })),
            },
        };

        const structure = await feeRepo.createFeeStructure(feeStructureData);

        // Retrospective sync for existing students in the class
        await this._syncStudentsWithStructure(structure);

        return structure;
    }

    /**
     * Internal helper to sync students with a fee structure
     * @private
     */
    async _syncStudentsWithStructure(structure) {
        try {
            const students = await feeRepo.findActiveStudentsForSync(structure.classId);
            if (students.length > 0) {
                const studentIds = students.map(s => s.id);
                await feeRepo.syncStudentFeeLedgers(studentIds, structure);
                console.log(`[FeeService] Synced ${students.length} students with structure ${structure.name}`);
            }
        } catch (err) {
            console.error('[FeeService] Failed to sync students with structure:', err.message);
            // We don't throw here to avoid failing the main creation process, 
            // but in a production app we might want to queue this or retry.
        }
    }

    /**
     * Get fee structure by ID
     */
    async getFeeStructureById(id) {
        const structure = await feeRepo.findFeeStructureById(id);
        if (!structure) {
            throw new NotFoundError('Fee structure not found');
        }

        // Add amount alias for frontend
        return {
            ...structure,
            amount: structure.totalAmount
        };
    }

    /**
     * Update fee structure
     */
    async updateFeeStructure(id, data) {
        const structure = await feeRepo.findFeeStructureById(id);
        if (!structure) {
            throw new NotFoundError('Fee structure not found');
        }

        const updateData = {
            name: data.name,
            description: data.description,
            classId: data.classId === 'all' ? null : data.classId,
            academicYearId: data.academicYearId,
            frequency: data.frequency,
            dueDay: parseInt(data.dueDay) || 10,
            earlyPaymentDiscount: parseFloat(data.earlyPaymentDiscount || 0),
            latePaymentPenalty: parseFloat(data.latePaymentPenalty || 0),
        };

        if (data.feeHeads) {
            updateData.totalAmount = data.feeHeads.reduce((sum, head) => sum + parseFloat(head.amount || 0), 0);
            updateData.items = {
                create: data.feeHeads.map(item => ({
                    headName: item.headName,
                    amount: parseFloat(item.amount || 0),
                })),
            };
        }

        const updatedStructure = await feeRepo.updateFeeStructure(id, updateData);

        // Re-sync if amount or class changed
        await this._syncStudentsWithStructure(updatedStructure);

        return updatedStructure;
    }

    /**
     * Delete fee structure
     */
    async deleteFeeStructure(id) {
        const structure = await feeRepo.findFeeStructureById(id);
        if (!structure) {
            throw new NotFoundError('Fee structure not found');
        }

        // Safety check: Don't delete if it has ledgers or payments
        // For simplicity in this ERP, we might just allow it if no payments exist
        // or just let Prisma throw a foreign key error which our error handler handles.

        return feeRepo.deleteFeeStructure(id);
    }

    /**
     * Get paginated fee payments
     */
    async getFeePayments(filters) {
        const { studentId, academicYearId, status, startDate, endDate, page = 1, limit = 25 } = filters;

        const where = {};
        if (studentId) where.studentId = studentId;
        if (academicYearId) where.academicYearId = academicYearId;
        if (status) where.status = status;

        if (startDate || endDate) {
            where.paymentDate = {};
            if (startDate) where.paymentDate.gte = new Date(startDate);
            if (endDate) where.paymentDate.lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [payments, total] = await feeRepo.findFeePayments(where, skip, parseInt(limit));

        return {
            payments,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        };
    }

    /**
     * Create a new fee payment
     */
    async createFeePayment(data, userId) {
        const parsedAmount = parseFloat(data.amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            throw new ValidationError('Invalid amount value');
        }

        const result = await feeRepo.createFeePaymentTx(
            data.studentId,
            data.ledgerId,
            parsedAmount,
            data.paymentMode,
            data.transactionId,
            data.forMonth,
            data.forYear,
            userId
        );

        const paymentWithDetails = await feeRepo.findPaymentById(result.payment.id);
        return paymentWithDetails;
    }

    /**
     * Get student fee status (ledgers and summary)
     */
    async getStudentFeeStatus(studentId, academicYearId) {
        const ledgers = await feeRepo.findStudentLedgers(studentId, academicYearId);
        if (!ledgers) {
            throw new Error('Database schema mismatch. Please run "npm run prisma:push && npm run prisma:generate" in the server terminal to apply fee system updates.');
        }

        const student = await feeRepo.findStudentForFeeStatus(studentId);
        if (!student) {
            throw new NotFoundError('Student not found');
        }

        const totalPayable = ledgers.reduce((sum, l) => sum + l.totalPayable, 0);
        const totalPaid = ledgers.reduce((sum, l) => sum + l.totalPaid, 0);
        const totalPending = ledgers.reduce((sum, l) => sum + l.totalPending, 0);

        const recentPaymentsData = await feeRepo.findFeePayments({ studentId }, 0, 5);

        return {
            student,
            ledgers,
            recentPayments: recentPaymentsData[0],
            summary: {
                totalFees: totalPayable,
                totalPaid,
                totalDue: totalPending,
            },
        };
    }

    /**
     * Request a fee adjustment
     */
    async requestAdjustment(data, userId) {
        const adjustmentData = {
            studentId: data.studentId,
            ledgerId: data.ledgerId,
            type: data.type,
            amount: parseFloat(data.amount),
            reason: data.reason,
            status: 'PENDING',
            requestedBy: userId,
        };

        return feeRepo.createFeeAdjustment(adjustmentData);
    }

    /**
     * Approve or reject a fee adjustment
     */
    async approveAdjustment(id, status, userId) {
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            throw new ValidationError('Invalid status');
        }

        return feeRepo.processAdjustmentTx(id, status, userId);
    }

    /**
     * Process a refund
     */
    async processRefund(data, userId) {
        const parsedAmount = parseFloat(data.amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            throw new ValidationError('Invalid refund amount');
        }

        return feeRepo.processRefundTx(data.originalReceiptNumber, parsedAmount, data.reason, userId);
    }

    /**
     * Get adjustments list
     */
    async getAdjustments(filters) {
        const { status, type } = filters;
        const where = {};
        if (status) where.status = status;
        if (type) where.type = type;

        return feeRepo.findAdjustments(where);
    }

    /**
     * Get admin dashboard fee stats
     */
    async getFeeStats() {
        const summaryData = await feeRepo.getFeeStats();

        const totalCollected = summaryData[0]?._sum?.amount || 0;
        const totalPending = summaryData[1]?._sum?.totalPending || 0;
        const defaulters = summaryData[2]?.map(l => ({
            name: `${l.student.user.firstName} ${l.student.user.lastName}`,
            class: l.student.currentClass?.name || 'N/A',
            amount: l.totalPending,
        })) || [];

        const collectionRate = totalCollected + totalPending > 0
            ? (totalCollected / (totalCollected + totalPending)) * 100
            : 0;

        const trendData = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);

            const monthName = d.toLocaleString('default', { month: 'short' });
            const monthCollection = await feeRepo.getMonthlyCollection(start, end);

            trendData.push({
                month: monthName,
                collected: monthCollection?._sum?.amount || 0,
            });
        }

        return {
            summary: {
                totalCollected,
                pending: totalPending,
                collectionRate: Math.round(collectionRate * 10) / 10,
            },
            trend: trendData,
            defaulters,
        };
    }
}

module.exports = new FeeService();
