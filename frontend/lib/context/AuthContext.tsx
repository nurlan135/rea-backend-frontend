'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials } from '../types/auth';
import { AuthService } from '../auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize authentication state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = AuthService.getToken();
        const storedUser = AuthService.getUser();

        if (token && storedUser) {
          // Verify token is still valid by fetching current user
          const currentUser = await AuthService.getCurrentUser();
          
          if (currentUser) {
            setAuthState({
              user: currentUser,
              token,
              isLoading: false,
              isAuthenticated: true,
            });
          } else {
            // Token is invalid, clear storage
            AuthService.removeToken();
            setAuthState({
              user: null,
              token: null,
              isLoading: false,
              isAuthenticated: false,
            });
          }
        } else {
          setAuthState({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await AuthService.login(credentials);
      
      if (response.success) {
        setAuthState({
          user: response.data.user,
          token: response.data.token,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      
      if (currentUser) {
        setAuthState(prev => ({
          ...prev,
          user: currentUser,
        }));
      } else {
        // User session is invalid
        await logout();
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      await logout();
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Hook for checking permissions
export function usePermission(permission: string): boolean {
  const { user } = useAuth();
  return user?.permissions?.includes(permission) || false;
}

// Hook for checking roles
export function useRole(...roles: string[]): boolean {
  const { user } = useAuth();
  return user ? roles.includes(user.role.toLowerCase()) : false;
}