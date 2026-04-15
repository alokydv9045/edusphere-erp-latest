import apiClient from './client';

export const transportAPI = {
  // --- Vehicles ---
  getVehicles: (params?: any) => apiClient.get('/transport/vehicles', { params }),
  getVehicleById: (id: string) => apiClient.get(`/transport/vehicles/${id}`),
  createVehicle: (data: any) => apiClient.post('/transport/vehicles', data),
  updateVehicle: (id: string, data: any) => apiClient.put(`/transport/vehicles/${id}`, data),

  // --- Routes ---
  getRoutes: () => apiClient.get('/transport/routes'),
  getRouteById: (id: string) => apiClient.get(`/transport/routes/${id}`),
  createRoute: (data: any) => apiClient.post('/transport/routes', data),
  updateRoute: (id: string, data: any) => apiClient.put(`/transport/routes/${id}`, data),

  // --- Allocations ---
  getNearestStops: (studentId: string, routeId: string) => 
    apiClient.get('/transport/suggestions/nearest-stops', { params: { studentId, routeId } }),
  getAllocations: (params?: any) => apiClient.get('/transport/allocations', { params }),
  allocateStudent: (data: any) => apiClient.post('/transport/allocate', data),

  // --- Trips ---
  getDriverAssignment: () => apiClient.get('/transport/driver/assignment'),
  startTrip: (data: any) => apiClient.post('/transport/trips/start', data),
  stopTrip: (id: string) => apiClient.post(`/transport/trips/${id}/stop`),
  updateLocation: (data: { tripId: string; latitude: number; longitude: number; speed?: number }) => 
    apiClient.post('/transport/trips/update-location', data),
  
  logMaintenance: (id: string, data: any) => apiClient.post(`/transport/vehicles/${id}/maintenance`, data),
  logFuel: (id: string, data: any) => apiClient.post(`/transport/vehicles/${id}/fuel`, data),

  // --- Dashboard ---
  getStats: () => apiClient.get('/transport/stats'),
  getGlobalLogs: () => apiClient.get('/transport/logs'),
  getActiveTrip: () => apiClient.get('/transport/trips/active'),
  getMyAllocation: () => apiClient.get('/transport/allocations/my'),
  getSettings: () => apiClient.get('/transport/settings'),
  updateSettings: (data: any) => apiClient.post('/transport/settings', data),
};
