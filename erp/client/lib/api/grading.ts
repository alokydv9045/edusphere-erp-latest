import apiClient from './client';

export interface TermData {
  name: string;
  startDate: string;
  endDate: string;
  academicYearId: string;
  weightage?: number;
}

export interface GradeEntry {
  grade: string;
  minPercent?: number | string;
  maxPercent?: number | string;
  gradePoint?: number | string;
  description?: string;
}

export interface GradeScaleItem {
  id?: string;
  name?: string;
  scaleType?: string;
  description?: string;
  isDefault?: boolean;
  entries?: GradeEntry[];
  grade?: string;
  minPercentage?: number;
  maxPercentage?: number;
  gradePoint?: number;
}

export interface TermQueryParams {
  academicYearId?: string;
  page?: number;
  limit?: number;
}

export const termAPI = {
  getAll: async (params?: TermQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/terms', { params });
    return data;
  },

  create: async (termData: TermData): Promise<any> => {
    const { data } = await apiClient.post('/terms', termData);
    return data;
  },

  update: async (id: string, updates: Partial<TermData>): Promise<any> => {
    const { data } = await apiClient.put(`/terms/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<any> => {
    const { data } = await apiClient.delete(`/terms/${id}`);
    return data;
  },
};

export const gradeScaleAPI = {
  getAll: async (): Promise<any> => {
    const { data } = await apiClient.get('/grade-scales');
    return data;
  },

  create: async (scaleData: GradeScaleItem): Promise<any> => {
    const { data } = await apiClient.post('/grade-scales', scaleData);
    return data;
  },

  update: async (id: string, updates: Partial<GradeScaleItem>): Promise<any> => {
    const { data } = await apiClient.put(`/grade-scales/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<any> => {
    const { data } = await apiClient.delete(`/grade-scales/${id}`);
    return data;
  },
};
