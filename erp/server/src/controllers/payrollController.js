const prisma = require('../config/database');

const HR_ROLES = ['SUPER_ADMIN', 'ADMIN'];

// ── Get salary structures (list) ──────────────────────────────────────────
const getSalaryStructures = async (req, res) => {
    try {
        const structures = await prisma.salaryStructure.findMany({
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, role: true, isActive: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ structures });
    } catch (error) {
        console.error('getSalaryStructures error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ── Set (upsert) salary structure for an employee ─────────────────────────
const setSalaryStructure = async (req, res) => {
    try {
        const { employeeId, basicSalary, allowances = 0, deductions = 0, effectiveFrom } = req.body;

        if (!employeeId || basicSalary === undefined) {
            return res.status(400).json({ error: 'employeeId and basicSalary are required' });
        }

        const grossSalary = parseFloat(basicSalary) + parseFloat(allowances) - parseFloat(deductions);

        const structure = await prisma.salaryStructure.upsert({
            where: { employeeId },
            create: {
                employeeId,
                basicSalary: parseFloat(basicSalary),
                allowances: parseFloat(allowances),
                deductions: parseFloat(deductions),
                grossSalary,
                effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
            },
            update: {
                basicSalary: parseFloat(basicSalary),
                allowances: parseFloat(allowances),
                deductions: parseFloat(deductions),
                grossSalary,
                effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        res.json({ message: 'Salary structure saved successfully', structure });
    } catch (error) {
        console.error('setSalaryStructure error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// ── Generate payroll for a given month/year ───────────────────────────────
const generatePayroll = async (req, res) => {
    try {
        const { month, year } = req.params;
        const m = parseInt(month);
        const y = parseInt(year);

        if (!m || !y || m < 1 || m > 12) {
            return res.status(400).json({ error: 'Valid month (1-12) and year are required' });
        }

        // Get all active employees with salary structures
        const structures = await prisma.salaryStructure.findMany({
            include: {
                employee: { select: { id: true, isActive: true, firstName: true, lastName: true } },
            },
        });

        const activeStructures = structures.filter((s) => s.employee.isActive);

        if (activeStructures.length === 0) {
            return res.status(400).json({ error: 'No active employees with salary structures found' });
        }

        // Create payroll records (skip if already exists for that month/year)
        const created = [];
        const skipped = [];

        // Month helpers
        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0);
        const daysInMonth = endDate.getDate();

        // Calculate total working days (excluding weekends)
        let workingDaysInMonth = 0;
        for (let d = 1; d <= daysInMonth; d++) {
            const day = new Date(y, m - 1, d).getDay();
            if (day !== 0 && day !== 6) workingDaysInMonth++;
        }

        for (const structure of activeStructures) {
            const existing = await prisma.payroll.findUnique({
                where: {
                    employeeId_month_year: {
                        employeeId: structure.employeeId,
                        month: m,
                        year: y,
                    },
                },
            });

            if (existing) {
                skipped.push(structure.employee.id);
                continue;
            }

            // ── Attendance Sync logic ──────────────────────────────────────
            // Count Present/Late days
            const presentRecords = await prisma.attendanceRecord.count({
                where: {
                    attendeeType: { in: ['TEACHER', 'STAFF'] },
                    OR: [
                        { teacher: { userId: structure.employeeId } },
                        { staff: { userId: structure.employeeId } }
                    ],
                    date: { gte: startDate, lte: endDate },
                    status: { in: ['PRESENT', 'LATE'] }
                }
            });

            // Count Absent days
            const absentRecords = await prisma.attendanceRecord.count({
                where: {
                    attendeeType: { in: ['TEACHER', 'STAFF'] },
                    OR: [
                        { teacher: { userId: structure.employeeId } },
                        { staff: { userId: structure.employeeId } }
                    ],
                    date: { gte: startDate, lte: endDate },
                    status: 'ABSENT'
                }
            });

            // Count Approved Leaves (Paid)
            const approvedLeaves = await prisma.serviceRequest.findMany({
                where: {
                    requesterId: structure.employeeId,
                    type: 'LEAVE',
                    status: 'APPROVED',
                    OR: [
                        { startDate: { gte: startDate, lte: endDate } },
                        { endDate: { gte: startDate, lte: endDate } }
                    ]
                }
            });

            let paidLeaveDays = 0;
            approvedLeaves.forEach(leave => {
                const lStart = new Date(Math.max(leave.startDate, startDate));
                const lEnd = new Date(Math.min(leave.endDate, endDate));
                const diff = Math.ceil((lEnd - lStart) / (1000 * 60 * 60 * 24)) + 1;
                // Only count paid leaves (extract type from subject)
                if (!leave.subject.includes('UNPAID')) {
                    paidLeaveDays += diff;
                }
            });

            const payableDays = Math.min(workingDaysInMonth, presentRecords + paidLeaveDays);
            const unpaidDays = Math.max(0, workingDaysInMonth - payableDays);

            const dailyRate = structure.grossSalary / (workingDaysInMonth || 30);
            const netSalary = Math.round((structure.grossSalary - (unpaidDays * dailyRate)) * 100) / 100;

            const payroll = await prisma.payroll.create({
                data: {
                    structureId: structure.id,
                    employeeId: structure.employeeId,
                    month: m,
                    year: y,
                    presentDays: presentRecords,
                    absentDays: absentRecords + unpaidDays - absentRecords, // Adjust to reflect total non-payable days
                    basicSalary: structure.basicSalary,
                    allowances: structure.allowances,
                    deductions: structure.deductions,
                    netSalary: netSalary,
                    status: 'PENDING',
                    remarks: `Auto-generated. Payable Days: ${payableDays} (Present: ${presentRecords}, Paid Leave: ${paidLeaveDays})`
                },
            });
            created.push(payroll.id);
        }

        res.json({
            message: `Payroll generated: ${created.length} created, ${skipped.length} already existed`,
            created: created.length,
            skipped: skipped.length,
        });
    } catch (error) {
        console.error('generatePayroll error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// ── Get payroll list for a month/year ────────────────────────────────────
const getPayrollList = async (req, res) => {
    try {
        const { month, year } = req.params;
        const m = parseInt(month);
        const y = parseInt(year);

        const payrolls = await prisma.payroll.findMany({
            where: { month: m, year: y },
            include: {
                employee: {
                    select: {
                        id: true, firstName: true, lastName: true, role: true, roles: true,
                        teacher: { select: { employeeId: true, specialization: true } },
                        staff: { select: { employeeId: true, designation: true } },
                    },
                },
            },
            orderBy: { employee: { firstName: 'asc' } },
        });

        const summary = {
            total: payrolls.length,
            paid: payrolls.filter((p) => p.status === 'PAID').length,
            pending: payrolls.filter((p) => p.status === 'PENDING').length,
            totalAmount: payrolls.reduce((sum, p) => sum + p.netSalary, 0),
            paidAmount: payrolls.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + p.netSalary, 0),
        };

        res.json({ payrolls, summary });
    } catch (error) {
        console.error('getPayrollList error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ── Mark payroll as paid ──────────────────────────────────────────────────
const markPaid = async (req, res) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;

        const payroll = await prisma.payroll.findUnique({ where: { id } });
        if (!payroll) return res.status(404).json({ error: 'Payroll record not found' });
        if (payroll.status === 'PAID') {
            return res.status(400).json({ error: 'Payroll already marked as paid' });
        }

        const updated = await prisma.payroll.update({
            where: { id },
            data: {
                status: 'PAID',
                paidAt: new Date(),
                paidBy: req.user.userId,
                remarks: remarks || null,
            },
        });

        res.json({ message: 'Payroll marked as paid', payroll: updated });
    } catch (error) {
        console.error('markPaid error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ── Update payroll present/absent days ────────────────────────────────────
const updatePayrollDays = async (req, res) => {
    try {
        const { id } = req.params;
        const { presentDays, absentDays, remarks } = req.body;

        const payroll = await prisma.payroll.findUnique({
            where: { id },
            include: { structure: true },
        });
        if (!payroll) return res.status(404).json({ error: 'Payroll record not found' });

        // Recompute net salary proportionally if days changed
        const pDays = presentDays !== undefined ? parseInt(presentDays) : payroll.presentDays;
        const aDays = absentDays !== undefined ? parseInt(absentDays) : payroll.absentDays;
        const totalDays = pDays + aDays;
        let netSalary = payroll.netSalary;
        if (totalDays > 0) {
            // Calculate actual weekdays in the payroll month for accurate per-day rate
            const daysInMonth = new Date(payroll.year, payroll.month, 0).getDate();
            let weekdays = 0;
            for (let d = 1; d <= daysInMonth; d++) {
                const day = new Date(payroll.year, payroll.month - 1, d).getDay();
                if (day !== 0 && day !== 6) weekdays++;
            }
            const workingDays = weekdays || 26; // fallback to 26 if computation fails
            const dailyRate = payroll.structure.grossSalary / workingDays;
            netSalary = Math.round(dailyRate * pDays * 100) / 100; // round to 2 decimals
        }

        const updated = await prisma.payroll.update({
            where: { id },
            data: {
                presentDays: presentDays !== undefined ? parseInt(presentDays) : payroll.presentDays,
                absentDays: absentDays !== undefined ? parseInt(absentDays) : payroll.absentDays,
                netSalary,
                remarks: remarks !== undefined ? remarks : payroll.remarks,
            },
        });

        res.json({ message: 'Payroll updated', payroll: updated });
    } catch (error) {
        console.error('updatePayrollDays error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ── Get payroll for logged in employee ──────────────────────────────────
const getMyPayroll = async (req, res) => {
    try {
        const { userId } = req.user;
        const payrolls = await prisma.payroll.findMany({
            where: { employeeId: userId },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
        });
        res.json(payrolls);
    } catch (error) {
        console.error('getMyPayroll error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getSalaryStructures,
    setSalaryStructure,
    generatePayroll,
    getPayrollList,
    markPaid,
    updatePayrollDays,
    getMyPayroll,
};
