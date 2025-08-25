import { LoginCredentials, LoginResponse, User, ApiError } from './types/auth';

const API_BASE_URL = 'http://localhost:8000/api';

export class AuthService {
  private static TOKEN_KEY = 'rea_invest_token';
  private static USER_KEY = 'rea_invest_user';

  /**
   * Store authentication token in localStorage
   */
  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  /**
   * Get authentication token from localStorage
   */
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  /**
   * Remove authentication token from localStorage
   */
  static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  /**
   * Store user data in localStorage
   */
  static setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  /**
   * Get user data from localStorage
   */
  static getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  }

  /**
   * Login user with credentials
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      if (data.success) {
        this.setToken(data.data.token);
        this.setUser(data.data.user);
      }

      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Network error occurred');
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.removeToken();
    }
  }

  /**
   * Get current user info from server
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.removeToken();
        }
        return null;
      }

      if (data.success && data.data.user) {
        this.setUser(data.data.user);
        return data.data.user;
      }

      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Make authenticated API request
   */
  static async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const defaultHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const mergedOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(url, mergedOptions);

    if (response.status === 401) {
      // Token expired or invalid, logout user
      this.removeToken();
      window.location.href = '/login';
    }

    return response;
  }

  /**
   * Get role-based dashboard redirect URL
   */
  static getDashboardUrl(role: string): string {
    switch (role.toLowerCase()) {
      case 'manager':
        return '/dashboard/manager';
      case 'agent':
        return '/dashboard/agent';
      case 'vp':
        return '/dashboard/vp';
      case 'director':
        return '/dashboard/director';
      case 'admin':
        return '/dashboard/admin';
      default:
        return '/dashboard';
    }
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(permission: string): boolean {
    const user = this.getUser();
    return user?.permissions?.includes(permission) || false;
  }

  /**
   * Check if user has any of the specified roles
   */
  static hasRole(...roles: string[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role.toLowerCase()) : false;
  }
}