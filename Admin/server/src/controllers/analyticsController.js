const prisma = require('../config/database');

const getDashboard = async (req, res) => {
  try {
    // Get total schools
    const totalSchools = await prisma.school.count();

    // Get active schools
    const activeSchools = await prisma.school.count({
      where: { isActive: true, deploymentStatus: 'ACTIVE' }
    });

    // Get total subscriptions
    const totalSubscriptions = await prisma.subscription.count();

    // Get active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'ACTIVE' }
    });

    // Get total revenue (from paid invoices)
    const revenueResult = await prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { totalAmount: true }
    });
    const totalRevenue = revenueResult._sum.totalAmount || 0;

    // Get monthly revenue (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyRevenueResult = await prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: { totalAmount: true }
    });
    const monthlyRevenue = monthlyRevenueResult._sum.totalAmount || 0;

    // Total students - since students are in individual school DBs,
    // we'll use a placeholder or sum from school data if available
    const totalStudents = 0; // TODO: Implement cross-school aggregation

    // Recent schools
    const recentSchools = await prisma.school.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        schoolCode: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        deploymentStatus: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Revenue chart (last 12 months)
    const revenueChart = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthRevenue = await prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          paymentDate: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        _sum: { totalAmount: true }
      });

      revenueChart.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue._sum.totalAmount || 0
      });
    }

    // Subscription distribution
    const subscriptionDistribution = await prisma.subscription.groupBy({
      by: ['planType'],
      _count: { planType: true },
      where: { status: 'ACTIVE' }
    });

    const subDist = subscriptionDistribution.map(item => ({
      plan: item.planType,
      count: item._count.planType
    }));

    // Schools growth (last 12 months)
    const schoolsGrowth = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthCount = await prisma.school.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });

      schoolsGrowth.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: monthCount
      });
    }

    const analytics = {
      totalSchools,
      activeSchools,
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue,
      monthlyRevenue,
      totalStudents,
      recentSchools,
      revenueChart,
      subscriptionDistribution: subDist,
      schoolsGrowth
    };

    res.json(analytics);
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
};

const getRevenue = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;

    let start = startDate ? new Date(startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    let end = endDate ? new Date(endDate) : new Date();

    const revenueData = [];

    if (groupBy === 'month') {
      // Group by month
      const months = [];
      let current = new Date(start.getFullYear(), start.getMonth(), 1);

      while (current <= end) {
        months.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
      }

      for (const month of months) {
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        const revenue = await prisma.invoice.aggregate({
          where: {
            status: 'PAID',
            paymentDate: {
              gte: month,
              lte: monthEnd
            }
          },
          _sum: { totalAmount: true }
        });

        revenueData.push({
          month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: revenue._sum.totalAmount || 0
        });
      }
    }

    res.json(revenueData);
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
};

const getSchoolsGrowth = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let start = startDate ? new Date(startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    let end = endDate ? new Date(endDate) : new Date();

    const growthData = [];
    let current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

      const count = await prisma.school.count({
        where: {
          createdAt: {
            gte: current,
            lte: monthEnd
          }
        }
      });

      growthData.push({
        month: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count
      });

      current.setMonth(current.getMonth() + 1);
    }

    res.json(growthData);
  } catch (error) {
    console.error('Schools growth analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch schools growth analytics' });
  }
};

const getStudentTrends = async (req, res) => {
  try {
    // Since students are in individual school databases,
    // this would require cross-database queries or stored aggregates
    // For now, return empty array
    res.json([]);
  } catch (error) {
    console.error('Student trends analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch student trends analytics' });
  }
};

const getSubscriptionDistribution = async (req, res) => {
  try {
    const distribution = await prisma.subscription.groupBy({
      by: ['planType'],
      _count: { planType: true },
      where: { status: 'ACTIVE' }
    });

    const data = distribution.map(item => ({
      plan: item.planType,
      count: item._count.planType
    }));

    res.json(data);
  } catch (error) {
    console.error('Subscription distribution analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription distribution analytics' });
  }
};

module.exports = {
  getDashboard,
  getRevenue,
  getSchoolsGrowth,
  getStudentTrends,
  getSubscriptionDistribution
};