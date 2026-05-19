import apiClient from './client';

export interface StudentDocumentUploadPayload {
  file: File;
  documentType: string;
  documentName: string;
}

export interface ScannerData {
  id?: string;
  name?: string;
  location?: string;
  scannerType?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  geofenceRadius?: number | string;
  allowedRoles?: string[];
  isActive?: boolean;
  ipAddress?: string;
  status?: string;
}

export interface ScannerQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export const documentAPI = {
  upload: async (studentId: string, payload: StudentDocumentUploadPayload): Promise<any> => {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('documentType', payload.documentType);
    formData.append('documentName', payload.documentName);

    const { data } = await apiClient.post(`/students/${studentId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getAll: async (studentId: string): Promise<any> => {
    const { data } = await apiClient.get(`/students/${studentId}/documents`);
    return data;
  },

  delete: async (documentId: string): Promise<any> => {
    const { data } = await apiClient.delete(`/students/documents/${documentId}`);
    return data;
  },
};

export const scannerAPI = {
  getAll: async (params?: ScannerQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/scanners', { params });
    return data;
  },
  getById: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/scanners/${id}`);
    return data;
  },
  create: async (scannerData: ScannerData): Promise<any> => {
    const { data } = await apiClient.post('/scanners', scannerData);
    return data;
  },
  update: async (id: string, updates: Partial<ScannerData>): Promise<any> => {
    const { data } = await apiClient.put(`/scanners/${id}`, updates);
    return data;
  },
  delete: async (id: string): Promise<any> => {
    const { data } = await apiClient.delete(`/scanners/${id}`);
    return data;
  },
  getStats: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/scanners/${id}/stats`);
    return data;
  },
};
