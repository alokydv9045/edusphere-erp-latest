import apiClient from './client';

export interface Teacher {
  id: string;
  employeeId: string;
  department?: string;
  designation?: string;
  qualification?: string;
  experience?: number;
  joiningDate?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  subjects?: Array<{
    id: string;
    subject: { id: string; name: string; code: string };
  }>;
}

export interface TeacherQueryParams {
  page?: number;
  limit?: number;
  department?: string;
  search?: string;
}

export interface CreateTeacherData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  employeeId: string;
  department?: string;
  designation?: string;
  qualification?: string;
  experience?: number | null;
  specialization?: string;
  joiningDate?: string;
  [key: string]: any;
}

export interface TeacherResponse {
  success: boolean;
  teacher?: Teacher;
  teachers?: Teacher[];
  total?: number;
  message?: string;
  pagination?: any;
  [key: string]: any;
}

export const teacherAPI = {
  getAll: async (params?: TeacherQueryParams): Promise<TeacherResponse> => {
    const { data } = await apiClient.get('/teachers', { params });
    return data;
  },

  getById: async (id: string): Promise<TeacherResponse> => {
    const { data } = await apiClient.get(`/teachers/${id}`);
    return data;
  },

  create: async (teacherData: CreateTeacherData): Promise<TeacherResponse> => {
    const { data } = await apiClient.post('/teachers', teacherData);
    return data;
  },

  update: async (id: string, updates: Partial<CreateTeacherData>): Promise<TeacherResponse> => {
    const { data } = await apiClient.put(`/teachers/${id}`, updates);
    return data;
  },

  assignSubject: async (id: string, subjectId: string): Promise<TeacherResponse> => {
    const { data } = await apiClient.post(`/teachers/${id}/subjects`, { subjectId });
    return data;
  },

  getMySchedule: async (): Promise<any> => {
    const { data } = await apiClient.get('/teachers/my-schedule');
    return data;
  },

  getMyClasses: async (): Promise<any> => {
    const { data } = await apiClient.get('/teachers/my-classes');
    return data;
  },
};
