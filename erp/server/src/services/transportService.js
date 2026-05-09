const prisma = require('../config/database');

class TransportService {
  // ==========================================
  // VEHICLES
  // ==========================================
  async getVehicles() {
    return await prisma.vehicle.findMany({
      include: {
        primaryDriver: {
          select: { id: true, user: { select: { firstName: true, lastName: true, phone: true } } }
        },
        trips: {
          where: { status: 'IN_PROGRESS' },
          include: { route: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createVehicle(data) {
    return await prisma.vehicle.create({
      data: {
        registrationNo: data.registrationNo,
        chassisNo: data.chassisNo,
        engineNo: data.engineNo,
        model: data.model,
        make: data.make,
        capacity: data.capacity,
        vehicleType: data.vehicleType,
        fuelType: data.fuelType || 'DIESEL',
        ownershipType: data.ownershipType || 'SCHOOL_OWNED',
        registrationExpiry: data.registrationExpiry ? new Date(data.registrationExpiry) : null,
        insurancePolicy: data.insurancePolicy,
        insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : null,
        fitnessExpiry: data.fitnessExpiry ? new Date(data.fitnessExpiry) : null,
        permitExpiry: data.permitExpiry ? new Date(data.permitExpiry) : null,
        pucExpiry: data.pucExpiry ? new Date(data.pucExpiry) : null,
        status: data.status || 'ACTIVE',
        driverId: data.driverId || null
      }
    });
  }

  async updateVehicle(id, data) {
    return await prisma.vehicle.update({
      where: { id },
      data: {
        ...data,
        registrationExpiry: data.registrationExpiry ? new Date(data.registrationExpiry) : undefined,
        insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : undefined,
        fitnessExpiry: data.fitnessExpiry ? new Date(data.fitnessExpiry) : undefined,
        permitExpiry: data.permitExpiry ? new Date(data.permitExpiry) : undefined,
        pucExpiry: data.pucExpiry ? new Date(data.pucExpiry) : undefined,
      }
    });
  }

  async deleteVehicle(id) {
    // Soft delete if possible, but schema shows hard delete via onDelete: Cascade on some relations.
    // For safety, we can just mark it INACTIVE or delete it. The user requested "Use soft delete".
    // VehicleStatus has OUT_OF_SERVICE.
    return await prisma.vehicle.update({
      where: { id },
      data: { status: 'OUT_OF_SERVICE' }
    });
  }

  // ==========================================
  // ROUTES & STOPS
  // ==========================================
  async getRoutes() {
    return await prisma.transportRoute.findMany({
      include: {
        stops: { orderBy: { order: 'asc' } },
        _count: { select: { allocations: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createRoute(data) {
    const { stops, ...routeData } = data;
    return await prisma.transportRoute.create({
      data: {
        ...routeData,
        stops: stops && stops.length > 0 ? {
          create: stops.map((stop, index) => ({
            name: stop.name,
            latitude: stop.latitude || 0,
            longitude: stop.longitude || 0,
            arrivalTime: stop.arrivalTime,
            order: index + 1
          }))
        } : undefined
      },
      include: { stops: true }
    });
  }

  async updateRoute(id, data) {
    const { stops, ...routeData } = data;
    
    // If stops are provided, we recreate them to maintain order
    if (stops) {
      await prisma.routeStop.deleteMany({ where: { routeId: id } });
    }

    return await prisma.transportRoute.update({
      where: { id },
      data: {
        ...routeData,
        ...(stops && {
          stops: {
            create: stops.map((stop, index) => ({
              name: stop.name,
              latitude: stop.latitude || 0,
              longitude: stop.longitude || 0,
              arrivalTime: stop.arrivalTime,
              order: index + 1
            }))
          }
        })
      },
      include: { stops: true }
    });
  }

  // ==========================================
  // DRIVERS
  // ==========================================
  async getDrivers() {
    // Drivers are Staff members linked to Vehicles or having the 'DRIVER' role.
    // Let's get all staff who are active and have 'DRIVER' role.
    return await prisma.staff.findMany({
      where: {
        status: 'ACTIVE',
        user: {
          roles: { has: 'DRIVER' }
        }
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, phone: true, email: true }
        },
        managedVehicles: { select: { id: true, registrationNo: true } }
      }
    });
  }

  // ==========================================
  // ALLOCATIONS (Student -> Route -> Stop)
  // ==========================================
  async getAllocations() {
    return await prisma.transportAllocation.findMany({
      include: {
        student: { select: { id: true, admissionNumber: true, user: { select: { firstName: true, lastName: true } } } },
        route: { select: { id: true, name: true } },
        stop: { select: { id: true, name: true, arrivalTime: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getStudentAllocation(studentId) {
    return await prisma.transportAllocation.findUnique({
      where: { studentId },
      include: {
        route: true,
        stop: true
      }
    });
  }

  async assignStudent(data) {
    // Upsert allocation
    const allocation = await prisma.transportAllocation.upsert({
      where: { studentId: data.studentId },
      update: {
        routeId: data.routeId,
        stopId: data.stopId,
        academicYearId: data.academicYearId,
        status: 'ACTIVE'
      },
      create: {
        studentId: data.studentId,
        routeId: data.routeId,
        stopId: data.stopId,
        academicYearId: data.academicYearId,
        status: 'ACTIVE'
      }
    });

    // Handle Transport Fee Integration automatically
    if (data.feeStructureId && data.academicYearId) {
      const feeStructure = await prisma.feeStructure.findUnique({
        where: { id: data.feeStructureId }
      });
      
      if (feeStructure) {
        await prisma.studentFeeLedger.upsert({
          where: {
            studentId_academicYearId_feeStructureId: {
              studentId: data.studentId,
              academicYearId: data.academicYearId,
              feeStructureId: data.feeStructureId
            }
          },
          update: {},
          create: {
            studentId: data.studentId,
            academicYearId: data.academicYearId,
            feeStructureId: data.feeStructureId,
            totalPayable: feeStructure.totalAmount,
            totalPending: feeStructure.totalAmount,
            status: 'PENDING'
          }
        });
      }
    }

    return allocation;
  }

  async removeStudentAssignment(studentId) {
    return await prisma.transportAllocation.update({
      where: { studentId },
      data: { status: 'CANCELLED' }
    });
  }

  // ==========================================
  // DASHBOARD ANALYTICS
  // ==========================================
  async getDashboardStats() {
    const totalVehicles = await prisma.vehicle.count({ where: { status: { in: ['ACTIVE', 'MAINTENANCE'] } } });
    const vehiclesUnderMaintenance = await prisma.vehicle.count({ where: { status: 'MAINTENANCE' } });
    const activeRoutes = await prisma.transportRoute.count();
    const studentsUsingTransport = await prisma.transportAllocation.count({ where: { status: 'ACTIVE' } });

    // Pending transport fees
    // We assume 'TRANSPORT' is the name or description of the fee structure.
    // Or we look at FeeStructureItem with headName = 'TRANSPORT'
    const pendingTransportFeesAgg = await prisma.studentFeeLedger.aggregate({
      _sum: { totalPending: true },
      where: {
        status: { in: ['PENDING', 'PARTIALLY_PAID'] },
        feeStructure: {
          items: {
            some: { headName: 'TRANSPORT' }
          }
        }
      }
    });

    return {
      totalVehicles,
      vehiclesUnderMaintenance,
      activeRoutes,
      studentsUsingTransport,
      pendingTransportFees: pendingTransportFeesAgg._sum.totalPending || 0
    };
  }
}

module.exports = new TransportService();
