import apiClient from './client';

export interface AnnouncementData {
  title: string;
  content: string;
  targetRole?: string;
  targetClassId?: string;
  expiresAt?: string;
  expiryDate?: string;
  targetAudience?: string | string[];
  priority?: string;
  attachments?: string[];
  isActive?: boolean;
}

export interface EnquiryData {
  studentName: string;
  parentName: string;
  email?: string;
  phone: string;
  targetClass?: string;
  classId?: string;
  academicYearId?: string;
  previousSchool?: string;
  source?: string;
  status?: string;
  assignedToId?: string;
  notes?: string;
  isConverted?: boolean;
  convertedAt?: string;
  convertedStudentId?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

export interface FollowUpData {
  date?: string;
  notes?: string;
  remark?: string;
  nextFollowUpDate?: string;
  status?: string;
  outcome?: string;
  contactedBy?: string;
  contactMethod?: string;
}

export interface CommunicationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export const announcementAPI = {
  getAll: async (params?: CommunicationQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/announcements', { params });
    return data;
  },

  getActive: async (): Promise<any> => {
    const { data } = await apiClient.get('/announcements/active');
    return data;
  },

  getById: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/announcements/${id}`);
    return data;
  },

  create: async (announcementData: AnnouncementData): Promise<any> => {
    const { data } = await apiClient.post('/announcements', announcementData);
    return data;
  },

  update: async (id: string, updates: Partial<AnnouncementData>): Promise<any> => {
    const { data } = await apiClient.put(`/announcements/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<any> => {
    const { data } = await apiClient.delete(`/announcements/${id}`);
    return data;
  },
};

export const enquiryAPI = {
  getAll: async (params?: CommunicationQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/enquiries', { params });
    return data;
  },
  getById: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/enquiries/${id}`);
    return data;
  },
  create: async (enquiryData: EnquiryData): Promise<any> => {
    const { data } = await apiClient.post('/enquiries', enquiryData);
    return data;
  },
  update: async (id: string, updates: Partial<EnquiryData>): Promise<any> => {
    const { data } = await apiClient.put(`/enquiries/${id}`, updates);
    return data;
  },
  delete: async (id: string): Promise<any> => {
    const { data } = await apiClient.delete(`/enquiries/${id}`);
    return data;
  },
  addFollowUp: async (id: string, followUpData: FollowUpData): Promise<any> => {
    const { data } = await apiClient.post(`/enquiries/${id}/follow-up`, followUpData);
    return data;
  },
};
