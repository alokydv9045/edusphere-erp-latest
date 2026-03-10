const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Get all enquiries with filters
 */
const getEnquiries = async (req, res) => {
    try {
        const { status, classId, source, search } = req.query;

        const where = {};
        if (status) where.status = status;
        if (classId) where.classId = classId;
        if (source) where.source = source;
        if (search) {
            where.OR = [
                { studentName: { contains: search, mode: 'insensitive' } },
                { parentName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        const enquiries = await prisma.enquiry.findMany({
            where,
            include: {
                class: { select: { name: true } },
                academicYear: { select: { name: true } },
                _count: { select: { followUps: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, enquiries });
    } catch (error) {
        logger.error('Error fetching enquiries:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch enquiries' });
    }
};

/**
 * Create new enquiry
 */
const createEnquiry = async (req, res) => {
    try {
        const { studentName, parentName, phone, email, classId, source, academicYearId } = req.body;

        if (!studentName || !parentName || !phone || !classId || !academicYearId) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        const enquiry = await prisma.enquiry.create({
            data: {
                studentName,
                parentName,
                phone,
                email,
                classId,
                source: source || 'WALK_IN',
                academicYearId,
                status: 'PENDING'
            }
        });

        res.status(201).json({ success: true, message: 'Enquiry created successfully', enquiry });
    } catch (error) {
        logger.error('Error creating enquiry:', error);
        res.status(500).json({ success: false, message: 'Failed to create enquiry' });
    }
};

/**
 * Get enquiry by ID with follow-ups
 */
const getEnquiryById = async (req, res) => {
    try {
        const { id } = req.params;
        const enquiry = await prisma.enquiry.findUnique({
            where: { id },
            include: {
                class: true,
                academicYear: true,
                followUps: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!enquiry) {
            return res.status(404).json({ success: false, message: 'Enquiry not found' });
        }

        res.json({ success: true, enquiry });
    } catch (error) {
        logger.error('Error fetching enquiry details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch enquiry details' });
    }
};

/**
 * Update enquiry status or details
 */
const updateEnquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const enquiry = await prisma.enquiry.update({
            where: { id },
            data: updates
        });

        res.json({ success: true, message: 'Enquiry updated successfully', enquiry });
    } catch (error) {
        logger.error('Error updating enquiry:', error);
        res.status(500).json({ success: false, message: 'Failed to update enquiry' });
    }
};

/**
 * Add follow-up record
 */
const addFollowUp = async (req, res) => {
    try {
        const { id } = req.params;
        const { remark, nextFollowUpDate } = req.body;
        const staffId = req.user.userId;

        const [followUp, enquiry] = await prisma.$transaction([
            prisma.enquiryFollowUp.create({
                data: {
                    enquiryId: id,
                    staffId,
                    remark,
                    nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null
                }
            }),
            prisma.enquiry.update({
                where: { id },
                data: { status: 'FOLLOW_UP' }
            })
        ]);

        res.status(201).json({ success: true, message: 'Follow-up added successfully', followUp });
    } catch (error) {
        logger.error('Error adding follow-up:', error);
        res.status(500).json({ success: false, message: 'Failed to add follow-up' });
    }
};

/**
 * Delete enquiry
 */
const deleteEnquiry = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.enquiry.delete({ where: { id } });
        res.json({ success: true, message: 'Enquiry deleted successfully' });
    } catch (error) {
        logger.error('Error deleting enquiry:', error);
        res.status(500).json({ success: false, message: 'Failed to delete enquiry' });
    }
};

module.exports = {
    getEnquiries,
    createEnquiry,
    getEnquiryById,
    updateEnquiry,
    addFollowUp,
    deleteEnquiry
};
