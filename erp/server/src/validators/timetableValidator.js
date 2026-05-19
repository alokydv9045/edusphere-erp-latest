const { z } = require('zod');

/**
 * Validator schemas for Timetable routes
 */

const createSlotSchema = z.object({
    classId: z.string().min(1, 'Class ID is required'),
    sectionId: z.string().min(1, 'Section ID is required'),
    subjectId: z.string().min(1, 'Subject ID is required'),
    teacherId: z.string().min(1, 'Teacher ID is required'),
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    roomNumber: z.string().optional(),
    slotType: z.enum(['REGULAR', 'LAB', 'LIBRARY', 'SPORTS', 'BREAK']).optional(),
});

const updateSlotSchema = createSlotSchema.partial();

const bulkCreateSchema = z.object({
    slots: z.array(createSlotSchema).min(1, 'At least one slot is required'),
});

module.exports = {
    createSlotSchema,
    updateSlotSchema,
    bulkCreateSchema,
};
