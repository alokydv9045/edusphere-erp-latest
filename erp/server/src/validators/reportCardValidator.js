const { z } = require('zod');

/**
 * Validator schemas for Report Card routes
 */

const generateReportCardSchema = z.object({
    examId: z.string().min(1, 'Exam ID is required'),
    studentIds: z.array(z.string().min(1)).min(1, 'At least one student ID is required'),
    templateId: z.string().optional(),
    includeRanking: z.boolean().optional(),
    includeRemarks: z.boolean().optional(),
});

const approveReportCardSchema = z.object({
    remarks: z.string().optional(),
});

const bulkApproveSchema = z.object({
    reportCardIds: z.array(z.string().min(1)).min(1, 'At least one report card ID is required'),
});

const templateSchema = z.object({
    name: z.string().min(1, 'Template name is required'),
    description: z.string().optional(),
    headerConfig: z.any().optional(),
    footerConfig: z.any().optional(),
    gradeTableConfig: z.any().optional(),
    layoutConfig: z.any().optional(),
    isDefault: z.boolean().optional(),
});

module.exports = {
    generateReportCardSchema,
    approveReportCardSchema,
    bulkApproveSchema,
    templateSchema,
};
