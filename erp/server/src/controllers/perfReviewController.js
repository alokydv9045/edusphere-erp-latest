const prisma = require('../config/database');

// Create a new performance review (Principal/Admin)
const createPerformanceReview = async (req, res) => {
    try {
        const { employeeId, periodStart, periodEnd, ratings, strengths, improvements, comments } = req.body;
        const reviewerId = req.user.userId;

        if (!employeeId || !periodStart || !periodEnd || !ratings) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        const review = await prisma.performanceReview.create({
            data: {
                employeeId,
                reviewerId,
                periodStart: new Date(periodStart),
                periodEnd: new Date(periodEnd),
                ratings, // Json object: { academic: 4, discipline: 5, punctuality: 4 }
                strengths,
                improvements,
                comments,
                status: 'SUBMITTED'
            }
        });

        res.status(201).json({ message: 'Performance review submitted', review });
    } catch (error) {
        console.error('Create performance review error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get reviews for an employee (self view or manager view)
const getEmployeeReviews = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { userId, role } = req.user;

        // Security check: Teachers can only view their own reviews
        if (role === 'TEACHER' && employeeId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const reviews = await prisma.performanceReview.findMany({
            where: { employeeId },
            include: {
                reviewer: { select: { firstName: true, lastName: true, role: true } }
            },
            orderBy: { reviewDate: 'desc' }
        });

        res.json({ reviews });
    } catch (error) {
        console.error('getEmployeeReviews error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Ack review (Employee)
const acknowledgeReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;

        const review = await prisma.performanceReview.findUnique({ where: { id } });
        if (!review || review.employeeId !== userId) {
            return res.status(404).json({ error: 'Review not found' });
        }

        const updated = await prisma.performanceReview.update({
            where: { id },
            data: { status: 'ACKNOWLEDGED' }
        });

        res.json({ message: 'Review acknowledged', review: updated });
    } catch (error) {
        console.error('acknowledgeReview error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createPerformanceReview,
    getEmployeeReviews,
    acknowledgeReview
};
