const prisma = require('../config/database');

const generateRequestNumber = () => {
    return `SR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
};

// Get service requests (Students see their own, Admins see all)
const getServiceRequests = async (req, res) => {
    try {
        const { role, userId } = req.user;
        const { status, type } = req.query;

        const where = {};
        if (status) where.status = status;
        if (type) where.type = type;

        // Student can only see their own requests
        if (role === 'STUDENT') {
            where.requesterId = userId;
        }

        const requests = await prisma.serviceRequest.findMany({
            where,
            include: {
                requester: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        avatar: true,
                    }
                },
                reviewer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(requests);
    } catch (error) {
        console.error('Get service requests error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create a new service request
const createServiceRequest = async (req, res) => {
    try {
        const { userId } = req.user;
        const { type, subject, description, priority, startDate, endDate, attachmentUrl } = req.body;

        if (!type || !subject || !description) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        const request = await prisma.serviceRequest.create({
            data: {
                requestNumber: generateRequestNumber(),
                requesterId: userId,
                type,
                subject,
                description,
                priority: priority || 'NORMAL',
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                attachmentUrl,
            }
        });

        res.status(201).json({ message: 'Request submitted successfully', request });
    } catch (error) {
        console.error('Create service request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update request status (Admin/Teacher only)
const updateServiceRequest = async (req, res) => {
    try {
        const { userId } = req.user;
        const { id } = req.params;
        const { status, reviewerRemarks } = req.body;

        const request = await prisma.serviceRequest.findUnique({ where: { id } });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const updatedRequest = await prisma.serviceRequest.update({
            where: { id },
            data: {
                status,
                reviewerRemarks,
                reviewerId: userId,
                reviewedAt: new Date(),
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        avatar: true,
                    }
                },
                reviewer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });

        res.json({ message: 'Request updated successfully', request: updatedRequest });
    } catch (error) {
        console.error('Update service request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getServiceRequests,
    createServiceRequest,
    updateServiceRequest,
};
