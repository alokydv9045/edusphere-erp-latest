const { z } = require('zod');

/**
 * Validator schemas for Inventory routes
 */

const createItemSchema = z.object({
    name: z.string().min(1, 'Item name is required'),
    category: z.string().min(1, 'Category is required'),
    quantity: z.number().int().min(0, 'Quantity must be a non-negative integer').or(z.string().regex(/^\d+$/)),
    unit: z.string().optional(),
    minStockLevel: z.number().int().min(0).optional().or(z.string().regex(/^\d+$/)),
    location: z.string().optional(),
    description: z.string().optional(),
    cost: z.number().min(0).optional().or(z.string().regex(/^\d+(\.\d+)?$/)),
    supplier: z.string().optional(),
});

const updateItemSchema = createItemSchema.partial();

const stockMovementSchema = z.object({
    itemId: z.string().min(1, 'Item ID is required'),
    type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER']),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').or(z.string().regex(/^\d+$/)),
    reason: z.string().optional(),
    referenceNumber: z.string().optional(),
});

module.exports = {
    createItemSchema,
    updateItemSchema,
    stockMovementSchema,
};
