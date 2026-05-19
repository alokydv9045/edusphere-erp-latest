import apiClient from './client';

export interface Student {
  id: string;
  admissionNumber: string;
  rollNumber?: string;
  status: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodGroup?: string;
    avatar?: string;
  };
  currentClass?: {
    id: string;
    name: string;
  };
  currentClassId?: string;
  section?: {
    id: string;
    name: string;
  };
  sectionId?: string;
}

export interface CreateStudentData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  admissionNumber?: string;
  rollNumber?: string;
  currentClassId?: string;
  sectionId?: string;
  academicYearId?: string;
  joiningDate?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalConditions?: string;
  allergies?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  parentOccupation?: string;
  parentAddress?: string;
  nationality?: string;
  religion?: string;
  caste?: string;
  category?: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  guardianPhone?: string;
  previousSchool?: string;
  previousClass?: string;
  avatar?: string;
  status?: string;
}

export interface StudentQueryParams {
  page?: number;
  limit?: number;
  classId?: string;
  sectionId?: string;
  search?: string;
  status?: string;
}

export interface AttendanceQueryParams {
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
}

export interface StudentResponse {
  success: boolean;
  student?: Student;
  students?: Student[];
  total?: number;
  message?: string;
  pagination?: any;
  [key: string]: any;
}

export const studentAPI = {
  getAll: async (params?: StudentQueryParams): Promise<StudentResponse> => {
    const { data } = await apiClient.get('/students', { params });
    return data;
  },

  getById: async (id: string): Promise<StudentResponse> => {
    const { data } = await apiClient.get(`/students/${id}`);
    return data;
  },

  getMe: async (): Promise<StudentResponse> => {
    const { data } = await apiClient.get('/students/me');
    return data;
  },

  create: async (studentData: CreateStudentData): Promise<StudentResponse> => {
    const { data } = await apiClient.post('/students', studentData);
    return data;
  },

  register: async (studentData: CreateStudentData): Promise<StudentResponse> => {
    const { data } = await apiClient.post('/students/register', studentData);
    return data;
  },

  update: async (id: string, updates: Partial<CreateStudentData>): Promise<StudentResponse> => {
    const { data } = await apiClient.put(`/students/${id}`, updates);
    return data;
  },

  updateMe: async (updates: Partial<CreateStudentData>): Promise<StudentResponse> => {
    const { data } = await apiClient.put('/students/me', updates);
    return data;
  },

  delete: async (id: string): Promise<StudentResponse> => {
    const { data } = await apiClient.delete(`/students/${id}`);
    return data;
  },

  getAttendance: async (id: string, params?: AttendanceQueryParams): Promise<any> => {
    const { data } = await apiClient.get(`/students/${id}/attendance`, { params });
    return data;
  },

  getAttendanceReport: async (id: string, params?: AttendanceQueryParams): Promise<Blob> => {
    const { data } = await apiClient.get(`/students/${id}/attendance/report`, { 
      params, 
      responseType: 'blob' 
    });
    return data;
  },
};
