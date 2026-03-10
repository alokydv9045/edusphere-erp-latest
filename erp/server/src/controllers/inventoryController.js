const prisma = require('../config/database');

// Get all inventory items
const getInventoryItems = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 25 } = req.query;

    const where = {};
    if (category) where.category = category;
    // FIXED: InventoryItem has 'isActive: Boolean', not 'status'
    if (status === 'active') where.isActive = true;
    else if (status === 'inactive') where.isActive = false;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { itemCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await prisma.inventoryItem.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.inventoryItem.count({ where });

    res.json({
      items,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get inventory items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single inventory item
const getInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({ item });
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create inventory item
const createInventoryItem = async (req, res) => {
  try {
    const {
      itemCode,
      name,
      description,
      category,
      unit,
      quantity,
      minStockLevel,
      maxStockLevel,
      unitPrice,
      location,
    } = req.body;

    if (!itemCode || !name || !category || !unit) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Check if item code exists
    const existing = await prisma.inventoryItem.findUnique({
      where: { itemCode },
    });

    if (existing) {
      return res.status(400).json({ error: 'Item code already exists' });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        itemCode,
        name,
        description,
        category,
        unit,
        quantity: quantity ? parseInt(quantity) : 0,
        minStockLevel: minStockLevel ? parseInt(minStockLevel) : 0,
        // FIXED: 'maxStockLevel' does not exist in schema
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        location,
      },
    });

    res.status(201).json({
      message: 'Inventory item created successfully',
      item,
    });
  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update inventory item
const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const item = await prisma.inventoryItem.findUnique({ where: { id } });

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // FIXED: InventoryItem has no 'status' or 'maxStockLevel' fields
    const allowedUpdates = [
      'name',
      'description',
      'category',
      'unit',
      'minStockLevel',
      'unitPrice',
      'location',
      'isActive',
    ];

    const updateData = {};
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        if (key === 'minStockLevel' || key === 'maxStockLevel') {
          updateData[key] = parseInt(updates[key]);
        } else if (key === 'unitPrice') {
          updateData[key] = parseFloat(updates[key]);
        } else {
          updateData[key] = updates[key];
        }
      }
    });

    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: 'Inventory item updated successfully',
      item: updatedItem,
    });
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Record stock movement
const recordStockMovement = async (req, res) => {
  try {
    const { itemId, movementType, quantity, referenceNumber, remarks } = req.body;

    if (!itemId || !movementType || !quantity) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const qty = parseInt(quantity);
    let newQuantity = item.quantity;

    // Calculate new quantity based on movement type
    if (movementType === 'IN' || movementType === 'PURCHASE') {
      newQuantity += qty;
    } else if (movementType === 'OUT' || movementType === 'ISSUE' || movementType === 'DAMAGE') {
      if (qty > item.quantity) {
        return res.status(400).json({ error: 'Insufficient stock quantity' });
      }
      newQuantity -= qty;
    }

    // Create movement record
    const movement = await prisma.stockMovement.create({
      data: {
        itemId,
        movementType,
        quantity: qty,
        previousQuantity: item.quantity,
        newQuantity,
        referenceNumber,
        remarks,
        performedBy: req.user.userId,
      },
      include: {
        item: true,
      },
    });

    // Update item quantity
    // FIXED: 'lastRestockedAt' does not exist in InventoryItem schema
    await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        quantity: newQuantity,
      },
    });

    res.status(201).json({
      message: 'Stock movement recorded successfully',
      movement,
    });
  } catch (error) {
    console.error('Record stock movement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get stock movements
const getStockMovements = async (req, res) => {
  try {
    const { itemId, movementType, startDate, endDate, page = 1, limit = 25 } = req.query;

    const where = {};
    if (itemId) where.itemId = itemId;
    if (movementType) where.movementType = movementType;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            itemCode: true,
            name: true,
            category: true,
            unit: true,
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.stockMovement.count({ where });

    res.json({
      movements,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get low stock items
const getLowStockItems = async (req, res) => {
  try {
    // FIXED: InventoryItem has 'isActive: Boolean' not 'status'
    // FIXED: raw SQL removed 'status = ACTIVE' filter that doesn't exist
    const lowStockItems = await prisma.$queryRaw`
      SELECT * FROM "InventoryItem"
      WHERE quantity <= "minStockLevel"
      AND "isActive" = true
      ORDER BY quantity ASC
    `;

    res.json({
      items: lowStockItems,
      total: lowStockItems.length,
    });
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get inventory summary
const getInventorySummary = async (req, res) => {
  try {
    // FIXED: InventoryItem uses 'isActive' not 'status'
    const totalItems = await prisma.inventoryItem.count();
    const activeItems = await prisma.inventoryItem.count({ where: { isActive: true } });
    // FIXED: 'prisma.inventoryItem.fields.minStockLevel' is not valid Prisma API
    // Use raw query for cross-column comparison instead
    const lowStockItemsResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "InventoryItem" WHERE quantity <= "minStockLevel" AND "isActive" = true
    `;
    const lowStockItems = parseInt(lowStockItemsResult[0]?.count || 0);
    const outOfStockItems = await prisma.inventoryItem.count({
      where: { isActive: true, quantity: 0 },
    });

    // Calculate total inventory value
    const items = await prisma.inventoryItem.findMany({
      where: { isActive: true },
      select: { quantity: true, unitPrice: true },
    });

    const inventoryValue = items.reduce((sum, item) => {
      // FIXED: unitPrice is nullable in schema
      return sum + item.quantity * (item.unitPrice || 0);
    }, 0);

    res.json({
      summary: {
        totalItems,
        activeItems,
        lowStockItems,
        outOfStockItems,
        inventoryValue: parseFloat(inventoryValue.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Get inventory summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  recordStockMovement,
  getStockMovements,
  getLowStockItems,
  getInventorySummary,
};
