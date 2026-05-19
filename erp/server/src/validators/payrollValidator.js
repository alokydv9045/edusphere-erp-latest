const { z } = require('zod');

/**
 * Validator schemas for Payroll routes
 */

const generatePayrollSchema = z.object({
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2020).max(2100),
    employeeIds: z.array(z.string().min(1)).optional(),
    department: z.string().optional(),
});

const updatePayrollSchema = z.object({
    basicSalary: z.number().min(0).optional(),
    allowances: z.number().min(0).optional(),
    deductions: z.number().min(0).optional(),
    bonus: z.number().min(0).optional(),
    tax: z.number().min(0).optional(),
    remarks: z.string().optional(),
    status: z.enum(['DRAFT', 'APPROVED', 'PAID', 'CANCELLED']).optional(),
});

const approvePayrollSchema = z.object({
    payrollIds: z.array(z.string().min(1)).min(1, 'At least one payroll ID is required'),
    remarks: z.string().optional(),
});

module.exports = {
    generatePayrollSchema,
    updatePayrollSchema,
    approvePayrollSchema,
};
