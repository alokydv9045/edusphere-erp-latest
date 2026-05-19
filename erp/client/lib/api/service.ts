import apiClient from './client';

export interface ServiceRequest {
  id: string;
  requestNumber: string;
  requesterId: string;
  type: 'LEAVE' | 'CERTIFICATE' | 'ID_CARD' | 'COMPLAINT' | 'OTHER';
  subject: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESOLVED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  startDate?: string;
  endDate?: string;
  attachmentUrl?: string;
  reviewerId?: string;
  reviewerRemarks?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  requester?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar?: string;
  };
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ServiceQueryParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  priority?: string;
  search?: string;
  myRequests?: boolean;
}

export interface CreateServiceRequestData {
  type: 'LEAVE' | 'CERTIFICATE' | 'ID_CARD' | 'COMPLAINT' | 'OTHER' | string;
  subject: string;
  description: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | string;
  startDate?: string;
  endDate?: string;
  attachmentUrl?: string;
}

export interface UpdateServiceRequestData {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESOLVED' | string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | string;
  reviewerRemarks?: string;
}

export const serviceAPI = {
  getAll: async (params?: ServiceQueryParams): Promise<ServiceRequest[]> => {
    const { data } = await apiClient.get('/services', { params });
    return data.requests || [];
  },

  create: async (requestData: CreateServiceRequestData): Promise<{ message: string, request: ServiceRequest }> => {
    const { data } = await apiClient.post('/services', requestData);
    return data;
  },

  update: async (id: string, updates: UpdateServiceRequestData): Promise<{ message: string, request: ServiceRequest }> => {
    const { data } = await apiClient.patch(`/services/${id}`, updates);
    return data;
  },
};
