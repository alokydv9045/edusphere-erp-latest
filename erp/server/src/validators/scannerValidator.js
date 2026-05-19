const { z } = require('zod');

/**
 * Validator schemas for Scanner routes
 */

const createScannerSchema = z.object({
    name: z.string().min(1, 'Scanner name is required'),
    location: z.string().optional(),
    scannerType: z.enum(['ENTRY', 'EXIT', 'BOTH']).optional(),
    latitude: z.union([z.number(), z.string()]).optional().nullable(),
    longitude: z.union([z.number(), z.string()]).optional().nullable(),
    geofenceRadius: z.union([z.number().int().min(1), z.string().regex(/^\d+$/)]).optional(),
    allowedRoles: z.array(z.string().min(1)).min(1, 'At least one allowed role must be specified'),
    isActive: z.boolean().optional(),
});

const updateScannerSchema = createScannerSchema.partial();

module.exports = {
    createScannerSchema,
    updateScannerSchema,
};
