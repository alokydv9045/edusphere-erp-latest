const prisma = require('../config/database');

// Initialize leave balances for an employee for the current academic year
const initializeLeaveBalances = async (req, res) => {
    try {
        const { employeeId, academicYearId } = req.body;

        if (!employeeId || !academicYearId) {
            return res.status(400).json({ error: 'Employee ID and Academic Year ID are required' });
        }

        // Default quotas (could be moved to a config table later)
        const defaultQuotas = [
            { type: 'CL', total: 12 },
            { type: 'SL', total: 10 },
            { type: 'EL', total: 15 },
        ];

        const balances = await Promise.all(
            defaultQuotas.map(async (quota) => {
                return await prisma.leaveBalance.upsert({
                    where: {
                        employeeId_leaveType_academicYearId: {
                            employeeId,
                            leaveType: quota.type,
                            academicYearId
                        }
                    },
                    update: { total: quota.total },
                    create: {
                        employeeId,
                        leaveType: quota.type,
                        academicYearId,
                        total: quota.total,
                        used: 0,
                        pending: 0
                    }
                });
            })
        );

        res.json({ message: 'Leave balances initialized', balances });
    } catch (error) {
        console.error('Initialize leave balances error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get leave balances for an employee (with auto-initialization)
const getMyBalances = async (req, res) => {
    try {
        const { userId } = req.user;
        const { academicYearId } = req.query;

        // 1. Get current academic year if not provided
        let targetYearId = academicYearId;
        if (!targetYearId) {
            const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
            if (!currentYear) return res.status(404).json({ error: 'No current academic year found' });
            targetYearId = currentYear.id;
        }

        // 2. Check if balances exist
        let balances = await prisma.leaveBalance.findMany({
            where: { employeeId: userId, academicYearId: targetYearId },
            include: { academicYear: { select: { name: true, isCurrent: true } } }
        });

        // 3. Auto-initialize if empty
        if (balances.length === 0) {
            const defaultQuotas = [
                { type: 'CL', total: 12 },
                { type: 'SL', total: 10 },
                { type: 'EL', total: 15 },
            ];

            await Promise.all(defaultQuotas.map(quota =>
                prisma.leaveBalance.create({
                    data: {
                        employeeId: userId,
                        leaveType: quota.type,
                        academicYearId: targetYearId,
                        total: quota.total,
                        used: 0,
                        pending: 0
                    }
                })
            ));

            // Fetch again after creation
            balances = await prisma.leaveBalance.findMany({
                where: { employeeId: userId, academicYearId: targetYearId },
                include: { academicYear: { select: { name: true, isCurrent: true } } }
            });
        }

        res.json({ balances });
    } catch (error) {
        console.error('Get leave balances error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Submit a leave request (Stateful transition PENDING -> PENDING_HOD -> PENDING_PRINCIPAL -> APPROVED)
const createLeaveRequest = async (req, res) => {
    try {
        const { userId, role } = req.user;
        const { leaveType, startDate, endDate, reason, priority = 'NORMAL' } = req.body;

        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        // 1. Verify balance
        const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
        if (!currentYear) return res.status(400).json({ error: 'No current academic year found' });

        let balance = await prisma.leaveBalance.findFirst({
            where: {
                employeeId: userId,
                leaveType,
                academicYearId: currentYear.id
            }
        });

        // Auto-initialize if missing
        if (!balance && leaveType !== 'UNPAID') {
            const defaultQuotas = { 'CL': 12, 'SL': 10, 'EL': 15, 'MATERNITY': 180 };
            balance = await prisma.leaveBalance.create({
                data: {
                    employeeId: userId,
                    leaveType,
                    academicYearId: currentYear.id,
                    total: defaultQuotas[leaveType] || 0,
                    used: 0,
                    pending: 0
                }
            });
        }

        if (leaveType !== 'UNPAID' && (!balance || (balance.total - balance.used - balance.pending) <= 0)) {
            return res.status(400).json({ error: `Insufficient ${leaveType} balance` });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (leaveType !== 'UNPAID' && (balance.total - balance.used - balance.pending) < days) {
            return res.status(400).json({ error: `Requested ${days} days exceeds remaining balance` });
        }

        // 2. Create the service request
        const request = await prisma.serviceRequest.create({
            data: {
                requestNumber: `LV-${Date.now().toString().slice(-6)}`,
                requesterId: userId,
                type: 'LEAVE',
                subject: `${leaveType} Request: ${startDate} to ${endDate}`,
                description: reason,
                priority,
                startDate: start,
                endDate: end,
                status: (role === 'TEACHER') ? 'PENDING_HOD' : 'PENDING_PRINCIPAL', // Teachers go to HOD first, Staff to Principal
            }
        });

        // 3. Mark balance as pending
        if (leaveType !== 'UNPAID') {
            await prisma.leaveBalance.update({
                where: { id: balance.id },
                data: { pending: { increment: days } }
            });
        }

        res.status(201).json({ message: 'Leave request submitted', request });
    } catch (error) {
        console.error('Create leave request error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Process leave request (HOD -> Principal -> HR)
const processLeaveRequest = async (req, res) => {
    try {
        const { userId, role } = req.user;
        const { id } = req.params;
        const { status, remarks } = req.body; // status: APPROVED, REJECTED, or next level state

        const request = await prisma.serviceRequest.findUnique({
            where: { id },
            include: { requester: true }
        });

        if (!request || request.type !== 'LEAVE') {
            return res.status(404).json({ error: 'Leave request not found' });
        }

        // Permission check based on workflow level
        if (request.status === 'PENDING_HOD' && role !== 'HOD' && role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Only HOD can approve this stage' });
        }
        if (request.status === 'PENDING_PRINCIPAL' && role !== 'PRINCIPAL' && role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Only Principal can approve this stage' });
        }

        let finalStatus = status;

        // Workflow Logic
        if (status === 'APPROVED' && request.status === 'PENDING_HOD') {
            finalStatus = 'PENDING_PRINCIPAL'; // Move to next level
        }

        const updated = await prisma.serviceRequest.update({
            where: { id },
            data: {
                status: finalStatus,
                reviewerRemarks: remarks,
                reviewerId: userId,
                reviewedAt: new Date()
            }
        });

        // If REJECTED, restore balance
        if (status === 'REJECTED') {
            const leaveType = request.subject.split(' ')[0]; // Extract LV-CL -> CL
            const days = Math.ceil((request.endDate - request.startDate) / (1000 * 60 * 60 * 24)) + 1;

            const balance = await prisma.leaveBalance.findFirst({
                where: { employeeId: request.requesterId, leaveType, academicYear: { isCurrent: true } }
            });

            if (balance) {
                await prisma.leaveBalance.update({
                    where: { id: balance.id },
                    data: { pending: { decrement: days } }
                });
            }
        }

        // If fully APPROVED, deduct from balance
        if (status === 'APPROVED' && finalStatus === 'APPROVED') {
            const leaveType = request.subject.split(' ')[0].replace(':', ''); // Extract from "CL Request: ..."
            const days = Math.ceil((request.endDate - request.startDate) / (1000 * 60 * 60 * 24)) + 1;

            const balance = await prisma.leaveBalance.findFirst({
                where: { employeeId: request.requesterId, leaveType: leaveType, academicYear: { isCurrent: true } }
            });

            if (balance) {
                await prisma.leaveBalance.update({
                    where: { id: balance.id },
                    data: {
                        used: { increment: days },
                        pending: { decrement: days }
                    }
                });
            }
        }

        res.json({ message: `Leave request ${finalStatus}`, request: updated });
    } catch (error) {
        console.error('Process leave error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

module.exports = {
    initializeLeaveBalances,
    getMyBalances,
    createLeaveRequest,
    processLeaveRequest
};
