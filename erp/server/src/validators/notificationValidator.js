const { z } = require('zod');

/**
 * Validator schemas for Notification routes
 */

const bulkSendSchema = z.object({
    target: z.enum(['ALL_STUDENTS', 'CLASS', 'SECTION', 'INDIVIDUAL']),
    classId: z.string().optional(),
    sectionId: z.string().optional(),
    studentId: z.string().optional(),
    message: z.string().min(1, 'Message is required'),
    notifType: z.string().optional(),
    scheduledAt: z.string().optional(),
});

const createTemplateSchema = z.object({
    templateName: z.string().min(1, 'Template name is required'),
    templateType: z.string().min(1, 'Template type is required'),
    messageBody: z.string().min(1, 'Message body is required'),
    variables: z.array(z.string()).optional(),
});

const updateTemplateSchema = z.object({
    templateName: z.string().min(1).optional(),
    messageBody: z.string().min(1).optional(),
    variables: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});

const updateSettingsSchema = z.object({
    emailEnabled: z.boolean().optional(),
    smsEnabled: z.boolean().optional(),
    pushEnabled: z.boolean().optional(),
    whatsappEnabled: z.boolean().optional(),
    defaultChannel: z.string().optional(),
    dailyLimit: z.number().int().min(0).optional(),
    retryAttempts: z.number().int().min(0).max(10).optional(),
});

module.exports = {
    bulkSendSchema,
    createTemplateSchema,
    updateTemplateSchema,
    updateSettingsSchema,
};
