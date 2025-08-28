'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  phone?: string;
  role: {
    name: string;
    displayName: string;
    permissions: string[];
    hierarchyLevel: number;
  };
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  lastLoginAt?: string;
  isActive: boolean;
}

interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Permissions
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  canAccess: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Token service for localStorage management
const tokenService = {
  TOKEN_KEY: 'rea_invest_token',
  
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
      (window as any).__REA_TOKEN = token;
    }
  },
  
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    const memoryToken = (window as any).__REA_TOKEN;
    if (memoryToken) return memoryToken;
    
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      (window as any).__REA_TOKEN = token;
    }
    return token;
  },
  
  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      delete (window as any).__REA_TOKEN;
    }
  },
  
  isExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  },
  
  getPayload(token: string): any | null {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
};

// Auth service for API calls
const authService = {
  async login(credentials: LoginRequest) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Giriş xətası');
    }
    
    return data;
  },
  
  async logout() {
    const token = tokenService.getToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout API error:', error);
      }
    }
  },
  
  async me() {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('Token yoxdur');
    }
    
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'İstifadəçi məlumatları alınmadı');
    }
    
    return data;
  }
};

// Helper functions
const getRoleDisplayName = (roleName: string): string => {
  const roleMap: Record<string, string> = {
    'admin': 'Admin',
    'director': 'Direktor',
    'vp': 'Sədr müavini',
    'manager': 'Manager',
    'agent': 'Agent'
  };
  return roleMap[roleName] || roleName;
};

const getHierarchyLevel = (roleName: string): number => {
  const hierarchyMap: Record<string, number> = {
    'agent': 1,
    'manager': 2,
    'vp': 3,
    'director': 4,
    'admin': 5
  };
  return hierarchyMap[roleName] || 1;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize auth state on app load
  useEffect(() => {
    initializeAuth();
  }, []);
  
  const initializeAuth = async () => {
    try {
      const token = tokenService.getToken();
      if (!token || tokenService.isExpired(token)) {
        setIsLoading(false);
        return;
      }
      
      // Verify token with server and get fresh user data
      const response = await authService.me();
      
      // Map backend response to frontend format
      const backendUser = response.data.user;
      const mappedUser: UserProfile = {
        id: backendUser.id,
        email: backendUser.email,
        firstName: backendUser.first_name || backendUser.firstName,
        lastName: backendUser.last_name || backendUser.lastName,
        fatherName: backendUser.father_name || backendUser.fatherName,
        phone: backendUser.phone,
        role: {
          name: backendUser.role,
          displayName: backendUser.role_display_name || getRoleDisplayName(backendUser.role),
          permissions: backendUser.permissions || ['*'],
          hierarchyLevel: getHierarchyLevel(backendUser.role)
        },
        branch: backendUser.branch_code ? {
          id: backendUser.branch_id || backendUser.branch_code,
          name: backendUser.branch_name || backendUser.branch_code,
          code: backendUser.branch_code
        } : undefined,
        lastLoginAt: backendUser.last_login_at,
        isActive: backendUser.status === 'active'
      };
      
      setUser(mappedUser);
      
    } catch (error) {
      // Token invalid, clear it
      tokenService.removeToken();
      console.error('Auth initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    tokenService.setToken(response.data.token);
    
    // Map backend response to frontend format
    const backendUser = response.data.user;
    const mappedUser: UserProfile = {
      id: backendUser.id,
      email: backendUser.email,
      firstName: backendUser.first_name || backendUser.firstName,
      lastName: backendUser.last_name || backendUser.lastName,
      fatherName: backendUser.father_name || backendUser.fatherName,
      phone: backendUser.phone,
      role: {
        name: backendUser.role,
        displayName: backendUser.role_display_name || getRoleDisplayName(backendUser.role),
        permissions: backendUser.permissions || ['*'],
        hierarchyLevel: getHierarchyLevel(backendUser.role)
      },
      branch: backendUser.branch_code ? {
        id: backendUser.branch_id || backendUser.branch_code,
        name: backendUser.branch_name || backendUser.branch_code,
        code: backendUser.branch_code
      } : undefined,
      lastLoginAt: backendUser.last_login_at,
      isActive: backendUser.status === 'active'
    };
    
    setUser(mappedUser);
  };
  
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenService.removeToken();
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };
  
  const refreshUser = async () => {
    try {
      const response = await authService.me();
      
      // Map backend response to frontend format
      const backendUser = response.data.user;
      const mappedUser: UserProfile = {
        id: backendUser.id,
        email: backendUser.email,
        firstName: backendUser.first_name || backendUser.firstName,
        lastName: backendUser.last_name || backendUser.lastName,
        fatherName: backendUser.father_name || backendUser.fatherName,
        phone: backendUser.phone,
        role: {
          name: backendUser.role,
          displayName: backendUser.role_display_name || getRoleDisplayName(backendUser.role),
          permissions: backendUser.permissions || ['*'],
          hierarchyLevel: getHierarchyLevel(backendUser.role)
        },
        branch: backendUser.branch_code ? {
          id: backendUser.branch_id || backendUser.branch_code,
          name: backendUser.branch_name || backendUser.branch_code,
          code: backendUser.branch_code
        } : undefined,
        lastLoginAt: backendUser.last_login_at,
        isActive: backendUser.status === 'active'
      };
      
      setUser(mappedUser);
    } catch (error) {
      console.error('User refresh failed:', error);
      await logout();
    }
  };
  
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.role.permissions) return false;
    return user.role.permissions.includes('*') || user.role.permissions.includes(permission);
  };
  
  const hasRole = (role: string): boolean => {
    return user?.role.name === role;
  };
  
  const canAccess = (resource: string, action: string): boolean => {
    const permission = `${resource}.${action}`;
    return hasPermission(permission) || hasPermission(`${resource}.*`);
  };
  
  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
    hasPermission,
    hasRole,
    canAccess
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export types
export type { UserProfile, LoginRequest, AuthContextValue };