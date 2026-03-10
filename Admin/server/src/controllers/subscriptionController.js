const prisma = require('../config/database');

const getAllSubscriptions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      planType
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (planType) {
      where.planType = planType;
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          school: {
            select: {
              id: true,
              name: true,
              schoolCode: true
            }
          },
          invoices: {
            where: { status: 'PAID' },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.subscription.count({ where })
    ]);

    // Transform data
    const transformedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      schoolId: sub.schoolId,
      school: sub.school,
      planType: sub.planType,
      billingCycle: sub.billingCycle,
      maxStudents: sub.maxStudents,
      maxTeachers: sub.maxTeachers,
      maxAdmins: sub.maxAdmins,
      features: sub.features,
      pricePerMonth: sub.pricePerMonth,
      currency: sub.currency,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate.toISOString(),
      autoRenew: sub.autoRenew,
      status: sub.status,
      lastPaymentDate: sub.lastPaymentDate?.toISOString(),
      nextBillingDate: sub.nextBillingDate.toISOString(),
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString()
    }));

    res.json({
      subscriptions: transformedSubscriptions,
      total
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
};

const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            schoolCode: true
          }
        },
        invoices: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({
      id: subscription.id,
      schoolId: subscription.schoolId,
      school: subscription.school,
      planType: subscription.planType,
      billingCycle: subscription.billingCycle,
      maxStudents: subscription.maxStudents,
      maxTeachers: subscription.maxTeachers,
      maxAdmins: subscription.maxAdmins,
      features: subscription.features,
      pricePerMonth: subscription.pricePerMonth,
      currency: subscription.currency,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      autoRenew: subscription.autoRenew,
      status: subscription.status,
      lastPaymentDate: subscription.lastPaymentDate?.toISOString(),
      nextBillingDate: subscription.nextBillingDate.toISOString(),
      invoices: subscription.invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        totalAmount: inv.totalAmount,
        status: inv.status,
        paymentDate: inv.paymentDate?.toISOString(),
        createdAt: inv.createdAt.toISOString()
      })),
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
};

const createSubscription = async (req, res) => {
  try {
    const {
      schoolId,
      planType,
      billingCycle,
      maxStudents,
      maxTeachers,
      maxAdmins,
      features,
      pricePerMonth,
      startDate,
      endDate
    } = req.body;

    const subscription = await prisma.subscription.create({
      data: {
        schoolId,
        planType,
        billingCycle: billingCycle || 'MONTHLY',
        maxStudents: maxStudents || 500,
        maxTeachers: maxTeachers || 50,
        maxAdmins: maxAdmins || 5,
        features: features || [],
        pricePerMonth,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        nextBillingDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            schoolCode: true
          }
        }
      }
    });

    res.status(201).json({
      id: subscription.id,
      schoolId: subscription.schoolId,
      school: subscription.school,
      planType: subscription.planType,
      billingCycle: subscription.billingCycle,
      maxStudents: subscription.maxStudents,
      maxTeachers: subscription.maxTeachers,
      maxAdmins: subscription.maxAdmins,
      features: subscription.features,
      pricePerMonth: subscription.pricePerMonth,
      currency: subscription.currency,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      autoRenew: subscription.autoRenew,
      status: subscription.status,
      lastPaymentDate: subscription.lastPaymentDate?.toISOString(),
      nextBillingDate: subscription.nextBillingDate.toISOString(),
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};

const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      planType,
      billingCycle,
      maxStudents,
      maxTeachers,
      maxAdmins,
      features,
      pricePerMonth,
      status,
      autoRenew
    } = req.body;

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        planType,
        billingCycle,
        maxStudents,
        maxTeachers,
        maxAdmins,
        features,
        pricePerMonth,
        status,
        autoRenew
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            schoolCode: true
          }
        }
      }
    });

    res.json({
      id: subscription.id,
      schoolId: subscription.schoolId,
      school: subscription.school,
      planType: subscription.planType,
      billingCycle: subscription.billingCycle,
      maxStudents: subscription.maxStudents,
      maxTeachers: subscription.maxTeachers,
      maxAdmins: subscription.maxAdmins,
      features: subscription.features,
      pricePerMonth: subscription.pricePerMonth,
      currency: subscription.currency,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      autoRenew: subscription.autoRenew,
      status: subscription.status,
      lastPaymentDate: subscription.lastPaymentDate?.toISOString(),
      nextBillingDate: subscription.nextBillingDate.toISOString(),
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Subscription not found' });
    } else {
      res.status(500).json({ error: 'Failed to update subscription' });
    }
  }
};

module.exports = {
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription
};