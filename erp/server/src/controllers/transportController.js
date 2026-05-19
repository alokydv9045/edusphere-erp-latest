const transportService = require('../services/transportService');
const asyncHandler = require('../utils/asyncHandler');

// VEHICLES
const getVehicles = asyncHandler(async (req, res) => {
  const result = await transportService.getVehicles(req.query);
  res.json({ success: true, ...result });
});

const createVehicle = asyncHandler(async (req, res) => {
  const vehicle = await transportService.createVehicle(req.body);
  res.status(201).json({ success: true, vehicle });
});

const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await transportService.updateVehicle(req.params.id, req.body);
  res.json({ success: true, vehicle });
});

const deleteVehicle = asyncHandler(async (req, res) => {
  await transportService.deleteVehicle(req.params.id);
  res.json({ success: true, message: 'Vehicle deleted successfully' });
});

const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await transportService.getVehicleById(req.params.id);
  res.json({ success: true, vehicle });
});

const logMaintenance = asyncHandler(async (req, res) => {
  const log = await transportService.logMaintenance(req.params.id, req.body);
  res.status(201).json({ success: true, log });
});

const logFuel = asyncHandler(async (req, res) => {
  const log = await transportService.logFuel(req.params.id, req.body);
  res.status(201).json({ success: true, log });
});

// ROUTES
const getRoutes = asyncHandler(async (req, res) => {
  const result = await transportService.getRoutes(req.query);
  res.json({ success: true, ...result });
});

const createRoute = asyncHandler(async (req, res) => {
  const route = await transportService.createRoute(req.body);
  res.status(201).json({ success: true, route });
});

const updateRoute = asyncHandler(async (req, res) => {
  const route = await transportService.updateRoute(req.params.id, req.body);
  res.json({ success: true, route });
});

const getRouteById = asyncHandler(async (req, res) => {
  const route = await transportService.getRouteById(req.params.id);
  res.json({ success: true, route });
});

// DRIVERS
const getDrivers = asyncHandler(async (req, res) => {
  const drivers = await transportService.getDrivers();
  res.json({ success: true, drivers });
});

// ALLOCATIONS
const getAllocations = asyncHandler(async (req, res) => {
  const result = await transportService.getAllocations(req.query);
  res.json({ success: true, ...result });
});

const assignStudent = asyncHandler(async (req, res) => {
  const allocation = await transportService.assignStudent(req.body);
  res.status(201).json({ success: true, allocation });
});

const removeAssignment = asyncHandler(async (req, res) => {
  await transportService.removeStudentAssignment(req.params.studentId);
  res.json({ success: true, message: 'Assignment removed' });
});

// DASHBOARD
const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await transportService.getDashboardStats();
  res.json({ success: true, stats });
});

// STUDENT VIEW
const getMyTransport = asyncHandler(async (req, res) => {
  // Assuming req.user.studentId is available from auth middleware
  const studentId = req.user.studentId;
  if (!studentId) {
    return res.status(403).json({ success: false, error: 'User is not a student' });
  }
  const allocation = await transportService.getStudentAllocation(studentId);
  res.json({ success: true, allocation });
});

const getActiveTrip = asyncHandler(async (req, res) => {
  const trip = await transportService.getActiveTripForUser(req.user.userId, req.user.role);
  res.json({ success: true, trip });
});

// DRIVER OPS
const getDriverAssignment = asyncHandler(async (req, res) => {
  const assignment = await transportService.getDriverAssignment(req.user.userId);
  res.json({ success: true, ...assignment });
});

const startTrip = asyncHandler(async (req, res) => {
  const trip = await transportService.startTrip(req.body);
  res.status(201).json({ success: true, trip });
});

const stopTrip = asyncHandler(async (req, res) => {
  const trip = await transportService.stopTrip(req.params.tripId);
  res.json({ success: true, trip });
});

const updateLocation = asyncHandler(async (req, res) => {
  const log = await transportService.updateLocation(req.body.tripId, req.body);
  res.json({ success: true, log });
});

const getGlobalLogs = asyncHandler(async (req, res) => {
  const logs = await transportService.getGlobalLogs(req.query);
  res.json({ success: true, ...logs });
});

const getSettings = asyncHandler(async (req, res) => {
  const settings = await transportService.getTransportSettings();
  res.json({ success: true, settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await transportService.updateTransportSettings(req.body);
  res.json({ success: true, settings });
});

module.exports = {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleById,
  logMaintenance,
  logFuel,
  getRoutes,
  createRoute,
  updateRoute,
  getRouteById,
  getDrivers,
  getAllocations,
  assignStudent,
  removeAssignment,
  getDashboardStats,
  getMyTransport,
  getActiveTrip,
  getDriverAssignment,
  startTrip,
  stopTrip,
  updateLocation,
  getGlobalLogs,
  getSettings,
  updateSettings,
};
