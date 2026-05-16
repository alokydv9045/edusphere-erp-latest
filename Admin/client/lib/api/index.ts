import apiClient from './client';

// ============================================
// TYPES
// ============================================

export interface School {
  id: string;
  code: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  deploymentStatus: 'PENDING' | 'DEPLOYED' | 'FAILED' | 'INACTIVE';
  dbHost?: string;
  dbName?: string;
  dbUser?: string;
  subscription?: Subscription;
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchoolData {
  code: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  dbHost: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  subscriptionPlanId: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface UpdateSchoolData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

export interface Subscription {
  id: string;
  schoolId: string;
  planId: string;
  plan: SubscriptionPlan;
  school?: School;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  maxStudents: number;
  maxTeachers: number;
  features: string[];
  monthlyPrice: number;
  yearlyPrice: number;
  isActive: boolean;
}

export interface CreateSubscriptionData {
  schoolId: string;
  planId: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  schoolId: string;
  school?: School;
  subscriptionId: string;
  subscription?: Subscription;
  amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoice?: Invoice;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  paidAt: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'SUPPORT_ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminUserData {
  name: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'SUPPORT_ADMIN';
}

export interface UpdateAdminUserData {
  name?: string;
  email?: string;
  role?: 'SUPER_ADMIN' | 'SUPPORT_ADMIN';
  isActive?: boolean;
}

export interface Analytics {
  totalSchools: number;
  activeSchools: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalStudents: number;
  recentSchools: School[];
  revenueChart: {
    month: string;
    revenue: number;
  }[];
  subscriptionDistribution: {
    plan: string;
    count: number;
  }[];
  schoolsGrowth: {
    month: string;
    count: number;
  }[];
}

export interface ActivityLog {
  id: string;
  schoolId: string;
  action: string;
  description: string;
  performedBy: string;
  createdAt: string;
}

export interface UsageStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  storageUsed: number;
  apiCallsThisMonth: number;
}

// ============================================
// Schools API
// ============================================

export const schoolAPI = {
  // Get all schools
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ schools: School[]; total: number }> => {
    const response = await apiClient.get('/schools', { params });
    return response.data;
  },

  // Get school by ID
  getById: async (id: string): Promise<School> => {
    const response = await apiClient.get(`/schools/${id}`);
    return response.data;
  },

  // Create new school
  create: async (data: CreateSchoolData): Promise<School> => {
    const response = await apiClient.post('/schools', data);
    return response.data;
  },

  // Update school
  update: async (id: string, data: UpdateSchoolData): Promise<School> => {
    const response = await apiClient.patch(`/schools/${id}`, data);
    return response.data;
  },

  // Delete school
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/schools/${id}`);
  },

  // Activate school
  activate: async (id: string): Promise<School> => {
    const response = await apiClient.post(`/schools/${id}/activate`);
    return response.data;
  },

  // Deactivate school
  deactivate: async (id: string): Promise<School> => {
    const response = await apiClient.post(`/schools/${id}/deactivate`);
    return response.data;
  },

  // Get school activity logs
  getActivityLogs: async (id: string): Promise<ActivityLog[]> => {
    const response = await apiClient.get(`/schools/${id}/activity-logs`);
    return response.data;
  },

  // Get school usage stats
  getUsageStats: async (id: string): Promise<UsageStats> => {
    const response = await apiClient.get(`/schools/${id}/usage-stats`);
    return response.data;
  },
};

// ============================================
// Subscriptions API
// ============================================

export const subscriptionAPI = {
  // Get all subscriptions
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ subscriptions: Subscription[]; total: number }> => {
    const response = await apiClient.get('/subscriptions', { params });
    return response.data;
  },

  // Get subscription by ID
  getById: async (id: string): Promise<Subscription> => {
    const response = await apiClient.get(`/subscriptions/${id}`);
    return response.data;
  },

  // Create subscription
  create: async (data: CreateSubscriptionData): Promise<Subscription> => {
    const response = await apiClient.post('/subscriptions', data);
    return response.data;
  },

  // Update subscription
  update: async (
    id: string,
    data: Partial<CreateSubscriptionData>
  ): Promise<Subscription> => {
    const response = await apiClient.patch(`/subscriptions/${id}`, data);
    return response.data;
  },

  // Cancel subscription
  cancel: async (id: string): Promise<Subscription> => {
    const response = await apiClient.post(`/subscriptions/${id}/cancel`);
    return response.data;
  },

  // Renew subscription
  renew: async (id: string, endDate: string): Promise<Subscription> => {
    const response = await apiClient.post(`/subscriptions/${id}/renew`, {
      endDate,
    });
    return response.data;
  },

  // Get subscription plans
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await apiClient.get('/subscription-plans');
    return response.data;
  },
};

// ============================================
// Invoices API
// ============================================

export const invoiceAPI = {
  // Get all invoices
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ invoices: Invoice[]; total: number }> => {
    const response = await apiClient.get('/invoices', { params });
    return response.data;
  },

  // Get invoice by ID
  getById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get(`/invoices/${id}`);
    return response.data;
  },

  // Get invoice by school
  getBySchool: async (schoolId: string): Promise<Invoice[]> => {
    const response = await apiClient.get(`/schools/${schoolId}/invoices`);
    return response.data;
  },

  // Mark invoice as paid
  markAsPaid: async (
    id: string,
    paymentData: {
      paymentMethod: string;
      transactionId?: string;
    }
  ): Promise<Invoice> => {
    const response = await apiClient.post(
      `/invoices/${id}/mark-paid`,
      paymentData
    );
    return response.data;
  },

  // Get payment history
  getPayments: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ payments: Payment[]; total: number }> => {
    const response = await apiClient.get('/payments', { params });
    return response.data;
  },

  // Export invoices
  exportInvoices: async (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<Blob> => {
    const response = await apiClient.get('/invoices/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

// ============================================
// Admin Users API
// ============================================

export const adminUserAPI = {
  // Get all admin users
  getAll: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
  }): Promise<{ users: AdminUser[]; total: number }> => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  // Get admin user by ID
  getById: async (id: string): Promise<AdminUser> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // Create admin user
  create: async (data: CreateAdminUserData): Promise<AdminUser> => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  // Update admin user
  update: async (id: string, data: UpdateAdminUserData): Promise<AdminUser> => {
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data;
  },

  // Delete admin user
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  // Activate admin user
  activate: async (id: string): Promise<AdminUser> => {
    const response = await apiClient.post(`/users/${id}/activate`);
    return response.data;
  },

  // Deactivate admin user
  deactivate: async (id: string): Promise<AdminUser> => {
    const response = await apiClient.post(`/users/${id}/deactivate`);
    return response.data;
  },
};

// ============================================
// Profile API
// ============================================

export const profileAPI = {
  // Get profile
  getProfile: async (): Promise<AdminUser> => {
    const response = await apiClient.get('/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: {
    name: string;
    email: string;
  }): Promise<AdminUser> => {
    const response = await apiClient.put('/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    const response = await apiClient.post('/profile/change-password', data);
    return response.data;
  },
};

// ============================================
// Analytics API
// ============================================

export const analyticsAPI = {
  // Get dashboard analytics
  getDashboard: async (): Promise<Analytics> => {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  },

  // Get revenue analytics
  getRevenue: async (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month' | 'year';
  }): Promise<{ month: string; revenue: number }[]> => {
    const response = await apiClient.get('/analytics/revenue', { params });
    return response.data;
  },

  // Get schools growth
  getSchoolsGrowth: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ month: string; count: number }[]> => {
    const response = await apiClient.get('/analytics/schools-growth', {
      params,
    });
    return response.data;
  },

  // Get student enrollment trends
  getStudentTrends: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ month: string; count: number }[]> => {
    const response = await apiClient.get('/analytics/student-trends', {
      params,
    });
    return response.data;
  },

  // Get subscription distribution
  getSubscriptionDistribution: async (): Promise<
    { plan: string; count: number }[]
  > => {
    const response = await apiClient.get(
      '/analytics/subscription-distribution'
    );
    return response.data;
  },
};

// Export all APIs
export { authAPI } from './auth';
export { default as apiClient } from './client';

