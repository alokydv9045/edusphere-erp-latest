const prisma = require('../config/database');

// Get all terms
const getTerms = async (req, res) => {
    try {
        const { academicYearId } = req.query;

        const where = {};
        if (academicYearId) where.academicYearId = academicYearId;

        const terms = await prisma.term.findMany({
            where,
            include: {
                academicYear: { select: { name: true } },
                _count: { select: { exams: true } },
            },
            orderBy: { order: 'asc' },
        });

        res.json({ terms });
    } catch (error) {
        console.error('Get terms error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create term
const createTerm = async (req, res) => {
    try {
        const { name, termType, academicYearId, startDate, endDate, weightage, order } = req.body;

        if (!name || !termType || !academicYearId || !startDate || !endDate) {
            return res.status(400).json({ error: 'Required fields: name, termType, academicYearId, startDate, endDate' });
        }

        const term = await prisma.term.create({
            data: {
                name,
                termType,
                academicYearId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                weightage: parseFloat(weightage) || 100,
                order: parseInt(order) || 1,
            },
            include: {
                academicYear: { select: { name: true } },
            },
        });

        res.status(201).json({ message: 'Term created successfully', term });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'A term with this name already exists for this academic year' });
        }
        console.error('Create term error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update term
const updateTerm = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, termType, startDate, endDate, weightage, order } = req.body;

        const existing = await prisma.term.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Term not found' });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (termType) updateData.termType = termType;
        if (startDate) updateData.startDate = new Date(startDate);
        if (endDate) updateData.endDate = new Date(endDate);
        if (weightage !== undefined) updateData.weightage = parseFloat(weightage);
        if (order !== undefined) updateData.order = parseInt(order);

        const term = await prisma.term.update({
            where: { id },
            data: updateData,
            include: {
                academicYear: { select: { name: true } },
            },
        });

        res.json({ message: 'Term updated successfully', term });
    } catch (error) {
        console.error('Update term error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete term
const deleteTerm = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.term.findUnique({
            where: { id },
            include: { _count: { select: { exams: true } } },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Term not found' });
        }

        if (existing._count.exams > 0) {
            return res.status(400).json({ error: `Cannot delete term with ${existing._count.exams} linked exams. Remove exams first.` });
        }

        await prisma.term.delete({ where: { id } });

        res.json({ message: 'Term deleted successfully' });
    } catch (error) {
        console.error('Delete term error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getTerms,
    createTerm,
    updateTerm,
    deleteTerm,
};
