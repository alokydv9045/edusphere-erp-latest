import apiClient from './client';

export interface VehicleData {
  registrationNumber: string;
  name?: string;
  capacity: number | string;
  year?: number | string;
  model?: string;
  make?: string;
  driverId?: string;
  status?: string;
  insuranceExpiry?: string;
  fitnessExpiry?: string;
  permitExpiry?: string;
  fuelType?: string;
  gpsDeviceId?: string;
}

export interface MaintenanceLogData {
  date?: string;
  serviceDate?: string;
  description?: string;
  cost?: number | string;
  serviceType?: string;
  odometerReading?: number | string;
  vendorName?: string;
  nextServiceDate?: string;
  remarks?: string;
}

export interface FuelLogData {
  date: string;
  quantity: number;
  cost: number;
  odometer: number;
}

export interface StopData {
  id?: string;
  name: string;
  pickupTime?: string;
  dropTime?: string;
  arrivalTime?: string;
  order?: number;
  feeAmount?: number | string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  address?: string;
}

export interface RouteData {
  name: string;
  description?: string;
  startLocation?: string;
  endLocation?: string;
  vehicleId?: string;
  stops?: StopData[] | any[];
  distance?: number | string;
  estimatedDuration?: number | string;
}

export interface AllocationData {
  studentId: string;
  routeId: string;
  stopId: string;
  academicYearId?: string;
  effectiveDate?: string;
  status?: string;
  monthlyFee?: number | string;
}

export interface StartTripData {
  routeId: string;
  vehicleId: string;
  tripType?: 'PICKUP' | 'DROP' | string;
  type?: 'PICKUP' | 'DROP' | string;
  scheduledTime?: string;
}

export interface LocationData {
  tripId: string;
  latitude: number;
  longitude: number;
  speed?: number;
}

export interface TransportSettings {
  gpsUpdateIntervalSeconds?: number;
  overspeedThresholdKmh?: number;
  enableAlerts?: boolean;
  geofenceThreshold?: number;
  strictRouteDeviation?: boolean;
  pushNotifications?: boolean;
  emailSummaries?: boolean;
  autoAttendanceMarking?: boolean;
  maxSpeedKmh?: number;
}

export interface TransportQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  routeId?: string;
}

export const transportAPI = {
  // VEHICLES
  getVehicles: async (params?: TransportQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/transport/vehicles', { params });
    return data;
  },
  createVehicle: async (vehicleData: VehicleData): Promise<any> => {
    const { data } = await apiClient.post('/transport/vehicles', vehicleData);
    return data;
  },
  updateVehicle: async (id: string, vehicleData: Partial<VehicleData>): Promise<any> => {
    const { data } = await apiClient.put(`/transport/vehicles/${id}`, vehicleData);
    return data;
  },
  deleteVehicle: async (id: string): Promise<any> => {
    const { data } = await apiClient.delete(`/transport/vehicles/${id}`);
    return data;
  },
  getVehicleById: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/transport/vehicles/${id}`);
    return data;
  },
  logMaintenance: async (id: string, maintenanceData: MaintenanceLogData): Promise<any> => {
    const { data } = await apiClient.post(`/transport/vehicles/${id}/maintenance`, maintenanceData);
    return data;
  },
  logFuel: async (id: string, fuelData: FuelLogData): Promise<any> => {
    const { data } = await apiClient.post(`/transport/vehicles/${id}/fuel`, fuelData);
    return data;
  },

  // ROUTES & STOPS
  getRoutes: async (params?: TransportQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/transport/routes', { params });
    return data;
  },
  createRoute: async (routeData: RouteData): Promise<any> => {
    const { data } = await apiClient.post('/transport/routes', routeData);
    return data;
  },
  updateRoute: async (id: string, routeData: Partial<RouteData>): Promise<any> => {
    const { data } = await apiClient.put(`/transport/routes/${id}`, routeData);
    return data;
  },
  getRouteById: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/transport/routes/${id}`);
    return data;
  },

  // DRIVERS
  getDrivers: async (): Promise<any> => {
    const { data } = await apiClient.get('/transport/drivers');
    return data;
  },

  // ALLOCATIONS
  getAllocations: async (params?: TransportQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/transport/allocations', { params });
    return data;
  },
  assignStudent: async (allocationData: AllocationData): Promise<any> => {
    const { data } = await apiClient.post('/transport/allocations', allocationData);
    return data;
  },
  removeAssignment: async (studentId: string): Promise<any> => {
    const { data } = await apiClient.delete(`/transport/allocations/${studentId}`);
    return data;
  },

  // DASHBOARD
  getStats: async (): Promise<any> => {
    const { data } = await apiClient.get('/transport/dashboard/stats');
    return data;
  },

  // STUDENT/PARENT VIEW
  getMyTransport: async (): Promise<any> => {
    const { data } = await apiClient.get('/transport/my-transport');
    return data;
  },
  getActiveTrip: async (): Promise<any> => {
    const { data } = await apiClient.get('/transport/active-trip');
    return data;
  },

  // DRIVER OPS
  getDriverAssignment: async (): Promise<any> => {
    const { data } = await apiClient.get('/transport/driver/assignment');
    return data;
  },
  startTrip: async (tripData: StartTripData): Promise<any> => {
    const { data } = await apiClient.post('/transport/trips/start', tripData);
    return data;
  },
  stopTrip: async (tripId: string): Promise<any> => {
    const { data } = await apiClient.post(`/transport/trips/${tripId}/stop`);
    return data;
  },
  updateLocation: async (locationData: LocationData): Promise<any> => {
    const { data } = await apiClient.post('/transport/trips/location', locationData);
    return data;
  },
  getGlobalLogs: async (params?: TransportQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/transport/logs', { params });
    return data;
  },
  getSettings: async (): Promise<any> => {
    const { data } = await apiClient.get('/transport/settings');
    return data;
  },
  updateSettings: async (settingsData: TransportSettings): Promise<any> => {
    const { data } = await apiClient.put('/transport/settings', settingsData);
    return data;
  }
};
