const { z } = require('zod');

/**
 * Validator schemas for Announcement routes
 */

const createAnnouncementSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    targetRole: z.string().optional(),
    targetClassId: z.string().optional(),
    expiresAt: z.string().optional(),
    expiryDate: z.string().optional(),
    targetAudience: z.union([z.string(), z.array(z.string())]).optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
});

const updateAnnouncementSchema = createAnnouncementSchema.partial();

module.exports = {
    createAnnouncementSchema,
    updateAnnouncementSchema,
};
