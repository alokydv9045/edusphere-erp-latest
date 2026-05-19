const { z } = require('zod');

/**
 * Validator schemas for HR routes
 */

const createEmployeeSchema = z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().optional(),
    role: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    qualification: z.string().optional(),
    experience: z.union([z.number(), z.string()]).optional(),
    specialization: z.string().optional(),
    joiningDate: z.string().optional(),
    basicSalary: z.union([z.number(), z.string()]).optional(),
});

const updateEmployeeSchema = createEmployeeSchema.partial().omit({ password: true });

const leaveRequestSchema = z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    leaveType: z.string().min(1, 'Leave type is required'),
    reason: z.string().optional(),
    attachmentUrl: z.string().url().optional(),
});

const processLeaveSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    remarks: z.string().optional(),
});

const performanceReviewSchema = z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    academicYearId: z.string().optional(),
    period: z.string().optional(),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
    rating: z.number().min(0).max(10).optional(),
    ratings: z.record(z.string(), z.number()).optional(),
    strengths: z.string().optional(),
    improvements: z.string().optional(),
    comments: z.string().optional(),
    feedback: z.string().optional(),
    goals: z.string().optional(),
});

module.exports = {
    createEmployeeSchema,
    updateEmployeeSchema,
    leaveRequestSchema,
    processLeaveSchema,
    performanceReviewSchema,
};
