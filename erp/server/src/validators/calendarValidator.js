const { z } = require('zod');

/**
 * Validator schemas for Calendar routes
 */

const createEventSchema = z.object({
    title: z.string().min(1, 'Event title is required'),
    description: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
    type: z.string().optional(),
    isHoliday: z.boolean().optional(),
    targetAudience: z.union([z.string(), z.array(z.string())]).optional(),
    color: z.string().optional(),
    isRecurring: z.boolean().optional(),
    recurrencePattern: z.string().optional(),
});

const updateEventSchema = createEventSchema.partial();

module.exports = {
    createEventSchema,
    updateEventSchema,
};
