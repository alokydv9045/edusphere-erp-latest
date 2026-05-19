import apiClient from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roles?: string[];
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  emailVerified?: boolean;
  lastLogin?: string;
  lastPasswordChange?: string;
  createdAt?: string;
  isActive: boolean;
  teacher?: { id: string; assignedScannerId: string | null };
  staff?: { id: string; assignedScannerId: string | null };
}

export interface AuthResponse {
  user: User;
  message: string;
}

// CQ-6: Helper to safely read/write localStorage with validation
const STORAGE_KEY = 'user';

const safeSetUser = (user: User): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // localStorage full or unavailable — degrade gracefully
    console.warn('[Auth] Could not persist user to localStorage');
  }
};

const safeClearUser = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore removal errors
  }
};

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/login', credentials);
    if (data.user) safeSetUser(data.user);
    return data;
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/register', userData);
    if (data.user) safeSetUser(data.user);
    return data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      safeClearUser();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(STORAGE_KEY);
    if (!userStr) return null;
    try {
      const parsed = JSON.parse(userStr);
      // Basic shape validation — reject if essential fields missing
      if (!parsed || !parsed.id || !parsed.email || !parsed.role) {
        safeClearUser();
        return null;
      }
      return parsed as User;
    } catch {
      safeClearUser();
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    // Note: We can't check the HttpOnly cookie from JS.
    // We rely on the existence of the user object or the /me call.
    return !!localStorage.getItem(STORAGE_KEY);
  },

  getProfile: async (): Promise<{ user: User }> => {
    const { data } = await apiClient.get('/auth/me');
    // CQ-6: Sync localStorage with fresh server data on every profile fetch
    if (data?.user) {
      safeSetUser(data.user);
    }
    return data;
  },
};
