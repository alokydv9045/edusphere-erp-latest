import apiClient from './client';

export interface GenerateReportCardData {
  examId: string;
  classId?: string;
  sectionId?: string;
  templateId?: string;
  studentIds?: string[];
}

export interface ReportCardTemplateData {
  name: string;
  description?: string;
  layout: 'STANDARD' | 'COMPREHENSIVE' | 'MINIMAL';
  sections: string[];
  headerImage?: string;
  footerText?: string;
}

export interface ReportCardQueryParams {
  page?: number;
  limit?: number;
  classId?: string;
  sectionId?: string;
  examId?: string;
  status?: string;
  studentId?: string;
}

export const reportCardAPI = {
  getAll: async (params?: ReportCardQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/report-cards', { params });
    return data;
  },

  generate: async (generateData: GenerateReportCardData): Promise<any> => {
    const { data } = await apiClient.post('/report-cards/generate', generateData);
    return data;
  },

  submit: async (id: string): Promise<any> => {
    const { data } = await apiClient.put(`/report-cards/${id}/submit`);
    return data;
  },

  bulkSubmit: async (reportCardIds: string[]): Promise<any> => {
    const { data } = await apiClient.post('/report-cards/bulk-submit', { reportCardIds });
    return data;
  },

  approve: async (id: string): Promise<any> => {
    const { data } = await apiClient.put(`/report-cards/${id}/approve`);
    return data;
  },

  bulkApprove: async (reportCardIds: string[]): Promise<any> => {
    const { data } = await apiClient.post('/report-cards/bulk-approve', { reportCardIds });
    return data;
  },

  reject: async (id: string, remark: string): Promise<any> => {
    const { data } = await apiClient.put(`/report-cards/${id}/reject`, { remark });
    return data;
  },

  download: async (id: string): Promise<Blob> => {
    const { data } = await apiClient.get(`/report-cards/${id}/pdf`, {
      responseType: 'blob',
    });
    return data;
  },

  publish: async (reportCardIds: string[]): Promise<any> => {
    const { data } = await apiClient.post('/report-cards/publish', { reportCardIds });
    return data;
  },

  getTemplates: async (): Promise<any> => {
    const { data } = await apiClient.get('/report-cards/templates');
    return data;
  },

  updateTemplate: async (id: string, templateData: Partial<ReportCardTemplateData>): Promise<any> => {
    const { data } = await apiClient.put(`/report-cards/templates/${id}`, templateData);
    return data;
  },

  createTemplate: async (templateData: ReportCardTemplateData): Promise<any> => {
    const { data } = await apiClient.post('/report-cards/templates', templateData);
    return data;
  },
};
