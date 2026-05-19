import apiClient from './client';

export interface FeeHead {
  headName: string;
  amount: number | string;
}

export interface FeeStructureData {
  id?: string;
  name?: string;
  title?: string;
  amount?: number;
  description?: string;
  classId?: string | null;
  academicYearId?: string;
  dueDate?: string;
  dueDay?: number | string;
  frequency?: string;
  isMandatory?: boolean;
  feeHeads?: FeeHead[];
  earlyPaymentDiscount?: number | string;
  latePaymentPenalty?: number | string;
}

export interface FeePaymentData {
  studentId: string;
  amount: number;
  paymentMethod?: string;
  paymentMode?: string;
  ledgerId?: string;
  transactionId?: string;
  paymentDate?: string;
  remarks?: string;
  academicYearId?: string;
  forMonth?: number;
  forYear?: number;
}

export interface FeeAdjustmentData {
  studentId: string;
  type: string;
  ledgerId?: string;
  amount: number | string;
  reason: string;
}

export interface FeeRefundData {
  paymentId: string;
  amount: number;
  reason: string;
  paymentMethod?: string;
}

export interface FeeQueryParams {
  page?: number;
  limit?: number;
  classId?: string;
  sectionId?: string;
  studentId?: string;
  academicYearId?: string;
  status?: string;
  search?: string;
}

export const feeAPI = {
  getStructures: async (params?: FeeQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/fees/structures', { params });
    return data;
  },

  getStructureById: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/fees/structures/${id}`);
    return data;
  },

  createStructure: async (structureData: FeeStructureData): Promise<any> => {
    const { data } = await apiClient.post('/fees/structures', structureData);
    return data;
  },

  updateStructure: async (id: string, structureData: Partial<FeeStructureData>): Promise<any> => {
    const { data } = await apiClient.put(`/fees/structures/${id}`, structureData);
    return data;
  },

  deleteStructure: async (id: string): Promise<any> => {
    const { data } = await apiClient.delete(`/fees/structures/${id}`);
    return data;
  },

  getPayments: async (params?: FeeQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/fees/payments', { params });
    return data;
  },

  createPayment: async (paymentData: FeePaymentData): Promise<any> => {
    const { data } = await apiClient.post('/fees/payments', paymentData);
    return data;
  },

  getStudentStatus: async (studentId: string, params?: FeeQueryParams): Promise<any> => {
    const { data } = await apiClient.get(`/fees/students/${studentId}/status`, { params });
    return data;
  },

  getAdjustments: async (params?: FeeQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/fees/adjustments', { params });
    return data;
  },

  requestAdjustment: async (adjustmentData: FeeAdjustmentData): Promise<any> => {
    const { data } = await apiClient.post('/fees/adjustments/request', adjustmentData);
    return data;
  },

  approveAdjustment: async (id: string, statusData: { status: 'APPROVED' | 'REJECTED'; remarks?: string }): Promise<any> => {
    const { data } = await apiClient.put(`/fees/adjustments/${id}/approve`, statusData);
    return data;
  },

  processRefund: async (refundData: FeeRefundData): Promise<any> => {
    const { data } = await apiClient.post('/fees/refunds', refundData);
    return data;
  },
  getStats: async (): Promise<any> => {
    const { data } = await apiClient.get('/fees/stats');
    return data;
  },

  getFeeStudents: async (params?: FeeQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/fees/students', { params });
    return data;
  },
  downloadStatement: async (studentId: string): Promise<Blob> => {
    const response = await apiClient.get(`/fees/students/${studentId}/statement`, {
      responseType: 'blob',
    });
    return response.data;
  },
  getClassWiseReport: async (params?: FeeQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/fees/reports/class-wise', { params });
    return data;
  },
};
