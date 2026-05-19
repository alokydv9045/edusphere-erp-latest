import apiClient from './client';

export interface StudentSummary {
  id: string;
  admissionNumber?: string;
  rollNumber?: string;
  status?: string;
  currentClassId?: string;
  sectionId?: string;
  currentClass?: { id: string; name: string };
  section?: { id: string; name: string };
  [key: string]: any;
}

export interface TeacherSummary {
  id: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  subjects?: Array<{ id: string; subject: { id: string; name: string } }>;
  [key: string]: any;
}

export interface StaffSummary {
  id: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  [key: string]: any;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'ACCOUNTANT' | 'LIBRARIAN' | 'INVENTORY_MANAGER' | 'HR_MANAGER' | 'ADMISSION_MANAGER';
  roles?: string[]; // Multi-role support
  phone?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  lastPasswordChange?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  qrCode?: string;
  qrIssued?: boolean;
  qrIssuedAt?: string | null;
  createdAt: string;
  student?: StudentSummary;
  teacher?: TeacherSummary;
  staff?: StaffSummary;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'ACCOUNTANT' | 'LIBRARIAN' | 'INVENTORY_MANAGER' | 'HR_MANAGER' | 'ADMISSION_MANAGER';
  roles?: string[]; 
  phone?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  username?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  role?: string;
  roles?: string[];
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface ChangePasswordData {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface GenericApiResponse {
  success: boolean;
  message?: string;
}

export interface UpdateUserResponse extends GenericApiResponse {
  user: User;
}

export interface ToggleQRResponse extends GenericApiResponse {
  qrIssued?: boolean;
  qrIssuedAt?: string | null;
}

export interface RegenerateQRResponse extends GenericApiResponse {
  qrCode?: string;
}

export const userAPI = {
  register: async (userData: CreateUserData): Promise<{ user: User; token: string }> => {
    const { data } = await apiClient.post('/auth/register', userData);
    return data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<{ users: User[]; total: number }> => {
    const { data } = await apiClient.get('/users', { params });
    return data;
  },

  getById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data.user;
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get('/auth/me');
    return data.user;
  },

  resetPassword: async (id: string, password: string): Promise<GenericApiResponse> => {
    const { data } = await apiClient.post(`/users/${id}/reset-password`, { password });
    return data;
  },

  update: async (id: string, updates: UpdateUserData): Promise<UpdateUserResponse> => {
    const { data } = await apiClient.put(`/users/${id}`, updates);
    return data;
  },

  updateRoles: async (
    id: string,
    roles: string[],
    primaryRole?: string
  ): Promise<UpdateUserResponse> => {
    const { data } = await apiClient.put(`/users/${id}/roles`, {
      roles,
      primaryRole: primaryRole ?? roles[0],
    });
    return data;
  },

  updateAvatar: async (id: string, file: File): Promise<UpdateUserResponse> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await apiClient.patch(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  changePassword: async (data: ChangePasswordData): Promise<GenericApiResponse> => {
    const res = await apiClient.post('/users/me/change-password', data);
    return res.data;
  },

  toggleQRIssued: async (id: string, issued: boolean): Promise<ToggleQRResponse> => {
    const { data } = await apiClient.post(`/users/${id}/qr/status`, { issued });
    return data;
  },

  regenerateQR: async (id: string): Promise<RegenerateQRResponse> => {
    const { data } = await apiClient.post(`/users/${id}/qr/regenerate`);
    return data;
  },
};
