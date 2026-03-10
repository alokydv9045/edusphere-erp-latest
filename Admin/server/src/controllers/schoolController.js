const prisma = require('../config/database');

const getAllSchools = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { schoolCode: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      if (status === 'active') {
        where.isActive = true;
        where.deploymentStatus = 'ACTIVE';
      } else if (status === 'inactive') {
        where.OR = [
          { isActive: false },
          { deploymentStatus: { not: 'ACTIVE' } }
        ];
      }
    }

    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            select: {
              planType: true,
              status: true,
              endDate: true
            }
          }
        }
      }),
      prisma.school.count({ where })
    ]);

    // Transform data to match frontend interface
    const transformedSchools = schools.map(school => ({
      id: school.id,
      code: school.schoolCode,
      name: school.name,
      email: school.email,
      phone: school.phone,
      address: school.address,
      isActive: school.isActive,
      deploymentStatus: school.deploymentStatus,
      dbHost: school.databaseUrl, // Simplified
      dbName: school.databaseName,
      dbUser: '', // Not stored
      subscription: school.subscription ? {
        id: school.subscription.id || '',
        planType: school.subscription.planType,
        status: school.subscription.status,
        endDate: school.subscription.endDate.toISOString()
      } : undefined,
      studentCount: 0, // TODO: Implement
      createdAt: school.createdAt.toISOString(),
      updatedAt: school.updatedAt.toISOString()
    }));

    res.json({
      schools: transformedSchools,
      total
    });
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
};

const getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        subscription: true,
        adminUsers: {
          include: {
            adminUser: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Transform
    const transformedSchool = {
      id: school.id,
      code: school.schoolCode,
      name: school.name,
      email: school.email,
      phone: school.phone,
      address: school.address,
      isActive: school.isActive,
      deploymentStatus: school.deploymentStatus,
      dbHost: school.databaseUrl,
      dbName: school.databaseName,
      dbUser: '',
      subscription: school.subscription ? {
        id: school.subscription.id,
        planType: school.subscription.planType,
        status: school.subscription.status,
        endDate: school.subscription.endDate.toISOString()
      } : undefined,
      studentCount: 0,
      createdAt: school.createdAt.toISOString(),
      updatedAt: school.updatedAt.toISOString()
    };

    res.json(transformedSchool);
  } catch (error) {
    console.error('Get school error:', error);
    res.status(500).json({ error: 'Failed to fetch school' });
  }
};

const createSchool = async (req, res) => {
  try {
    const {
      code,
      name,
      email,
      phone,
      address,
      dbHost,
      dbName,
      dbUser,
      dbPassword,
      subscriptionPlanId,
      adminName,
      adminEmail,
      adminPassword
    } = req.body;

    // Create school
    const school = await prisma.school.create({
      data: {
        schoolCode: code,
        name,
        email,
        phone,
        address,
        databaseUrl: dbHost,
        databaseName: dbName,
        deploymentStatus: 'PROVISIONING'
      }
    });

    // Create subscription if provided
    if (subscriptionPlanId) {
      await prisma.subscription.create({
        data: {
          schoolId: school.id,
          planType: subscriptionPlanId, // Assuming planId maps to enum
          billingCycle: 'MONTHLY',
          pricePerMonth: 0, // TODO: Get from plan
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    }

    // TODO: Create admin user for school

    res.status(201).json({
      id: school.id,
      code: school.schoolCode,
      name: school.name,
      email: school.email,
      phone: school.phone,
      address: school.address,
      isActive: school.isActive,
      deploymentStatus: school.deploymentStatus,
      dbHost: school.databaseUrl,
      dbName: school.databaseName,
      dbUser: '',
      subscription: null,
      studentCount: 0,
      createdAt: school.createdAt.toISOString(),
      updatedAt: school.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Create school error:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'School code or email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create school' });
    }
  }
};

const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, isActive } = req.body;

    const school = await prisma.school.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        address,
        isActive
      }
    });

    res.json({
      id: school.id,
      code: school.schoolCode,
      name: school.name,
      email: school.email,
      phone: school.phone,
      address: school.address,
      isActive: school.isActive,
      deploymentStatus: school.deploymentStatus,
      dbHost: school.databaseUrl,
      dbName: school.databaseName,
      dbUser: '',
      subscription: null,
      studentCount: 0,
      createdAt: school.createdAt.toISOString(),
      updatedAt: school.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Update school error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'School not found' });
    } else {
      res.status(500).json({ error: 'Failed to update school' });
    }
  }
};

const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.school.delete({
      where: { id }
    });

    res.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error('Delete school error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'School not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete school' });
    }
  }
};

module.exports = {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool
};