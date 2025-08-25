export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  permissions: string[];
  branch: {
    name: string;
    code: string;
  };
  lastLoginAt: string;
  preferences?: any;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
}

export type Role = 'agent' | 'manager' | 'vp' | 'director' | 'admin';

export interface DashboardKPI {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: string;
}

export interface RecentActivity {
  id: string;
  type: 'booking' | 'deal' | 'property' | 'communication';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}