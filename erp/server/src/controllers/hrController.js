const prisma = require('../config/database');
const bcrypt = require('bcrypt');

// ── Helper: generate a unique Employee ID (with retry for race-safety) ────
const generateEmployeeId = async (maxRetries = 5) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const count = await prisma.user.count({
            where: { role: { in: ['TEACHER', 'LIBRARIAN', 'ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'] } },
        });
        const suffix = attempt > 0 ? Math.floor(Math.random() * 100) : 0;
        const id = `EMP${String(count + 1 + suffix).padStart(4, '0')}`;

        // Check uniqueness across both Teacher and Staff tables
        const existsInTeacher = await prisma.teacher.findUnique({ where: { employeeId: id } });
        const existsInStaff = await prisma.staff.findUnique({ where: { employeeId: id } });
        if (!existsInTeacher && !existsInStaff) return id;
    }
    // Fallback: timestamp-based ID
    return `EMP${Date.now().toString(36).toUpperCase()}`;
};

// ── Get all employees (Teachers + Staff merged) ───────────────────────────
const getEmployees = async (req, res) => {
    try {
        const { search, status, type, page = 1, limit = 25 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const HR_EMPLOYEE_ROLES = ['TEACHER', 'LIBRARIAN', 'ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

        // Use OR to catch users via primary role OR multi-role array
        const roleCondition = {
            OR: [
                { role: { in: HR_EMPLOYEE_ROLES } },
                { roles: { hasSome: HR_EMPLOYEE_ROLES } },
            ],
        };

        const conditions = [roleCondition];

        if (status === 'ACTIVE') conditions.push({ isActive: true });
        if (status === 'INACTIVE') conditions.push({ isActive: false });

        if (search) {
            conditions.push({
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { teacher: { employeeId: { contains: search, mode: 'insensitive' } } },
                    { staff: { employeeId: { contains: search, mode: 'insensitive' } } },
                ],
            });
        }

        if (type === 'TEACHER') {
            conditions.push({
                OR: [{ role: 'TEACHER' }, { roles: { has: 'TEACHER' } }],
            });
        } else if (type === 'STAFF') {
            const staffRoles = ['LIBRARIAN', 'ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'];
            conditions.push({
                AND: [
                    // Not a pure teacher
                    { NOT: { AND: [{ role: 'TEACHER' }, { teacher: { isNot: null } }] } },
                    // Has at least one staff role
                    {
                        OR: [
                            { role: { in: staffRoles } },
                            { roles: { hasSome: staffRoles } },
                        ],
                    },
                ],
            });
        }

        const where = { AND: conditions };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                    roles: true,
                    isActive: true,
                    createdAt: true,
                    staff: {
                        select: {
                            id: true,
                            employeeId: true,
                            joiningDate: true,
                            designation: true,
                            department: true,
                            status: true,
                            assignedScanner: { select: { id: true, name: true } },
                        },
                    },
                    teacher: {
                        select: {
                            id: true,
                            employeeId: true,
                            joiningDate: true,
                            qualification: true,
                            specialization: true,
                            experience: true,
                            status: true,
                            assignedScanner: { select: { id: true, name: true } },
                        },
                    },
                    salaryStructure: {
                        select: { basicSalary: true, grossSalary: true },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            employees: users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('getEmployees error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// ── Get single employee ───────────────────────────────────────────────────
const getEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                teacher: { include: { subjects: { include: { subject: true } }, assignedClass: true, assignedScanner: true } },
                staff: { include: { assignedScanner: true } },
                salaryStructure: true,
                payrolls: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 12 },
            },
        });

        if (!user) return res.status(404).json({ error: 'Employee not found' });
        res.json({ employee: user });
    } catch (error) {
        console.error('getEmployee error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ── Create employee ───────────────────────────────────────────────────────
const createEmployee = async (req, res) => {
    try {
        const {
            firstName, lastName, email, password, phone, gender, address, dateOfBirth,
            role = 'TEACHER',
            qualification, experience, specialization,
            joiningDate,
            designation, department,
            assignedScannerId,
        } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: 'firstName, lastName, email, and password are required' });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const employeeId = await generateEmployeeId();
        const joinDate = joiningDate ? new Date(joiningDate) : new Date();

        let result;

        if (role === 'TEACHER') {
            result = await prisma.teacher.create({
                data: {
                    employeeId,
                    joiningDate: joinDate,
                    qualification: qualification || '',
                    experience: experience ? parseInt(experience) : null,
                    specialization: specialization || null,
                    assignedScannerId: assignedScannerId || null,
                    user: {
                        create: {
                            email, password: hashedPassword, firstName, lastName,
                            phone: phone || null, gender: gender || null,
                            address: address || null,
                            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                            role: 'TEACHER', roles: ['TEACHER'],
                        },
                    },
                },
                include: { user: true },
            });
        } else {
            result = await prisma.staff.create({
                data: {
                    employeeId,
                    joiningDate: joinDate,
                    designation: designation || role,
                    department: department || null,
                    assignedScannerId: assignedScannerId || null,
                    user: {
                        create: {
                            email, password: hashedPassword, firstName, lastName,
                            phone: phone || null, gender: gender || null,
                            address: address || null,
                            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                            role, roles: [role],
                        },
                    },
                },
                include: { user: true },
            });
        }

        // ── Leave balance initialization ───────────────────────
        try {
            const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
            if (currentYear) {
                const userId = result.user ? result.user.id : result.userId;
                const employeeId = userId; // In this schema, relations are on userId

                // Default quotas
                const defaultQuotas = [
                    { type: 'CL', total: 12 },
                    { type: 'SL', total: 10 },
                    { type: 'EL', total: 15 },
                ];

                await Promise.all(
                    defaultQuotas.map(q =>
                        prisma.leaveBalance.create({
                            data: {
                                employeeId: employeeId,
                                leaveType: q.type,
                                academicYearId: currentYear.id,
                                total: q.total
                            }
                        })
                    )
                );
            }
        } catch (initErr) {
            console.error('Failed to initialize leave balances for new employee:', initErr);
            // Don't fail the whole request, but log it
        }

        res.status(201).json({ message: 'Employee created successfully', employee: result });
    } catch (error) {
        console.error('createEmployee error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// ── Update employee ───────────────────────────────────────────────────────
const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, phone, gender, address,
            qualification, specialization, experience,
            designation, department, status,
            assignedScannerId } = req.body;

        const user = await prisma.user.findUnique({
            where: { id },
            include: { teacher: true, staff: true },
        });
        if (!user) return res.status(404).json({ error: 'Employee not found' });

        const userUpdate = {};
        if (firstName !== undefined) userUpdate.firstName = firstName;
        if (lastName !== undefined) userUpdate.lastName = lastName;
        if (phone !== undefined) userUpdate.phone = phone;
        if (gender !== undefined) userUpdate.gender = gender;
        if (address !== undefined) userUpdate.address = address;

        if (Object.keys(userUpdate).length > 0) {
            await prisma.user.update({ where: { id }, data: userUpdate });
        }

        if (user.teacher) {
            const teacherUpdate = {};
            if (qualification !== undefined) teacherUpdate.qualification = qualification;
            if (specialization !== undefined) teacherUpdate.specialization = specialization;
            if (experience !== undefined) teacherUpdate.experience = parseInt(experience);
            if (status !== undefined) teacherUpdate.status = status;
            if (assignedScannerId !== undefined) teacherUpdate.assignedScannerId = assignedScannerId || null;
            if (Object.keys(teacherUpdate).length > 0) {
                await prisma.teacher.update({ where: { id: user.teacher.id }, data: teacherUpdate });
            }
        }

        if (user.staff) {
            const staffUpdate = {};
            if (designation !== undefined) staffUpdate.designation = designation;
            if (department !== undefined) staffUpdate.department = department;
            if (status !== undefined) staffUpdate.status = status;
            if (assignedScannerId !== undefined) staffUpdate.assignedScannerId = assignedScannerId || null;
            if (Object.keys(staffUpdate).length > 0) {
                await prisma.staff.update({ where: { id: user.staff.id }, data: staffUpdate });
            }
        }

        const updated = await prisma.user.findUnique({
            where: { id },
            include: { teacher: true, staff: true },
        });

        res.json({ message: 'Employee updated successfully', employee: updated });
    } catch (error) {
        console.error('updateEmployee error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ── Toggle active/inactive status ─────────────────────────────────────────
const toggleEmployeeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive, status } = req.body;

        const user = await prisma.user.findUnique({
            where: { id },
            include: { teacher: true, staff: true },
        });
        if (!user) return res.status(404).json({ error: 'Employee not found' });

        const newActive = typeof isActive === 'boolean' ? isActive : !user.isActive;
        await prisma.user.update({ where: { id }, data: { isActive: newActive } });

        const employeeStatus = status || (newActive ? 'ACTIVE' : 'RESIGNED');

        if (user.teacher) {
            await prisma.teacher.update({
                where: { id: user.teacher.id },
                data: { status: employeeStatus },
            });
        }
        if (user.staff) {
            await prisma.staff.update({
                where: { id: user.staff.id },
                data: { status: employeeStatus },
            });
        }

        res.json({ message: `Employee ${newActive ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
        console.error('toggleEmployeeStatus error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee, toggleEmployeeStatus };
