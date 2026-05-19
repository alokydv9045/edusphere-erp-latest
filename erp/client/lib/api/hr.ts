import apiClient from './client';

export interface EmployeeData {
  id?: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  qualification?: string;
  experience?: number | string;
  specialization?: string;
  joiningDate?: string;
  basicSalary?: number | string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  assignedScannerId?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bankName?: string;
  bankAccount?: string;
  ifscCode?: string;
  panNumber?: string;
  aadharNumber?: string;
  status?: string;
  isActive?: boolean;
}

export interface LeaveRequestData {
  startDate: string;
  endDate: string;
  leaveType: string;
  reason?: string;
  attachmentUrl?: string;
  metadata?: Record<string, unknown>;
  halfDay?: boolean;
  halfDayType?: 'FIRST_HALF' | 'SECOND_HALF';
}

export interface PerformanceReviewData {
  employeeId: string;
  academicYearId?: string;
  period?: string;
  periodStart?: string;
  periodEnd?: string;
  rating?: number;
  ratings?: Record<string, number>;
  strengths?: string;
  improvements?: string;
  comments?: string;
  feedback?: string;
  goals?: string;
  status?: string;
}

export interface HRQueryParams {
  page?: number;
  limit?: number;
  department?: string;
  search?: string;
  status?: string;
  type?: string;
  role?: string;
}

export const hrAPI = {
  getEmployees: async (params?: HRQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/hr', { params });
    return data;
  },
  getEmployee: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/hr/${id}`);
    return data;
  },
  createEmployee: async (employee: EmployeeData): Promise<any> => {
    const { data } = await apiClient.post('/hr', employee);
    return data;
  },
  updateEmployee: async (id: string, updates: Partial<EmployeeData>): Promise<any> => {
    const { data } = await apiClient.put(`/hr/${id}`, updates);
    return data;
  },
  toggleStatus: async (id: string, payload: { isActive: boolean; status?: string }): Promise<any> => {
    const { data } = await apiClient.patch(`/hr/${id}/status`, payload);
    return data;
  },

  // Leave Management
  initializeLeaves: async (payload: { employeeId: string; academicYearId: string }): Promise<any> => {
    const { data } = await apiClient.post('/hr/leaves/initialize', payload);
    return data;
  },
  getMyLeaveBalances: async (academicYearId?: string): Promise<any> => {
    const { data } = await apiClient.get('/hr/leaves/my-balances', { params: { academicYearId } });
    return data;
  },
  requestLeave: async (leaveData: LeaveRequestData): Promise<any> => {
    const { data } = await apiClient.post('/hr/leaves/request', leaveData);
    return data;
  },
  processLeave: async (id: string, payload: { status: string; remarks?: string }): Promise<any> => {
    const { data } = await apiClient.post(`/hr/leaves/${id}/process`, payload);
    return data;
  },

  // Performance Reviews
  createReview: async (reviewData: PerformanceReviewData): Promise<any> => {
    const { data } = await apiClient.post('/hr/reviews', reviewData);
    return data;
  },
  getEmployeeReviews: async (employeeId: string): Promise<any> => {
    const { data } = await apiClient.get(`/hr/${employeeId}/reviews`);
    return data;
  },
  acknowledgeReview: async (id: string): Promise<any> => {
    const { data } = await apiClient.patch(`/hr/reviews/${id}/acknowledge`);
    return data;
  },
};
