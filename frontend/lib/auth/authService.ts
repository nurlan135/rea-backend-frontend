// Authentication API Service

import { TokenService } from './tokenService';

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  success: true;
  data: {
    token: string;
    expires_in: string;
    user: UserProfile;
  };
}

export interface UserProfile {
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

export interface AuthErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

// Common error codes with Azerbaijani messages
export const AuthErrorCodes = {
  MISSING_CREDENTIALS: 'Email və parol tələb olunur',
  INVALID_CREDENTIALS: 'Yanlış email və ya parol',
  ACCOUNT_LOCKED: 'Hesab müvəqqəti bloklanıb',
  ACCOUNT_DISABLED: 'Hesab deaktiv edilib',
  TOO_MANY_ATTEMPTS: 'Həddindən artıq cəhd. Daha sonra cəhd edin',
  TOKEN_EXPIRED: 'Sessiya bitib. Yenidən daxil olun',
  INVALID_TOKEN: 'Yanlış token',
  ACCESS_DENIED: 'Giriş icazəsi yoxdur',
  SESSION_EXPIRED: 'Sessiya müddəti bitib',
  NETWORK_ERROR: 'Şəbəkə xətası. İnternet bağlantınızı yoxlayın',
  SERVER_ERROR: 'Server xətası. Daha sonra cəhd edin',
  UNKNOWN_ERROR: 'Gözlənilməz xəta baş verdi'
} as const;

class AuthService {
  private baseURL = '/api/auth';
  
  /**
   * User login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': this.generateRequestId(),
        },
        body: JSON.stringify({
          email: credentials.email.toLowerCase().trim(),
          password: credentials.password,
          remember_me: credentials.remember_me || false
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new AuthError(
          data.error?.code || 'LOGIN_ERROR',
          data.error?.message || AuthErrorCodes.UNKNOWN_ERROR,
          response.status,
          data.error?.details
        );
      }
      
      return data;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      
      // Network or parsing errors
      throw new AuthError(
        'NETWORK_ERROR',
        AuthErrorCodes.NETWORK_ERROR,
        0,
        error
      );
    }
  }
  
  /**
   * User logout
   */
  async logout(): Promise<void> {
    const token = TokenService.getToken();
    
    if (!token) {
      return; // Already logged out
    }
    
    try {
      await fetch(`${this.baseURL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Request-ID': this.generateRequestId(),
        },
      });
    } catch (error) {
      // Log error but don't throw - logout should always succeed locally
      console.error('Logout API error:', error);
    }
  }
  
  /**
   * Get current user information
   */
  async me(): Promise<{ success: true; data: { user: UserProfile } }> {
    const token = TokenService.getToken();
    
    if (!token) {
      throw new AuthError('TOKEN_MISSING', AuthErrorCodes.TOKEN_EXPIRED, 401);
    }
    
    if (TokenService.isExpired(token)) {
      throw new AuthError('TOKEN_EXPIRED', AuthErrorCodes.TOKEN_EXPIRED, 401);
    }
    
    try {
      const response = await fetch(`${this.baseURL}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Request-ID': this.generateRequestId(),
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new AuthError(
          data.error?.code || 'ME_ERROR',
          data.error?.message || AuthErrorCodes.UNKNOWN_ERROR,
          response.status,
          data.error?.details
        );
      }
      
      return data;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError(
        'NETWORK_ERROR',
        AuthErrorCodes.NETWORK_ERROR,
        0,
        error
      );
    }
  }
  
  /**
   * Check service health
   */
  async health(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {
          'X-Request-ID': this.generateRequestId(),
        },
      });
      
      return await response.json();
    } catch (error) {
      throw new AuthError(
        'HEALTH_CHECK_ERROR',
        'Sistem sağlamlıq yoxlaması uğursuz',
        0,
        error
      );
    }
  }
  
  /**
   * Validate token without API call
   */
  isTokenValid(): boolean {
    const token = TokenService.getToken();
    
    if (!token) return false;
    if (!TokenService.isValidFormat(token)) return false;
    if (TokenService.isExpired(token)) return false;
    
    return true;
  }
  
  /**
   * Get current user from token (without API call)
   */
  getCurrentUserFromToken(): Partial<UserProfile> | null {
    const token = TokenService.getToken();
    
    if (!token || !this.isTokenValid()) {
      return null;
    }
    
    const payload = TokenService.getPayload(token);
    if (!payload) return null;
    
    return {
      id: payload.sub,
      email: payload.email,
      role: {
        name: payload.role,
        displayName: '', // Need to get from API
        permissions: payload.permissions || [],
        hierarchyLevel: 0 // Need to get from API
      }
    };
  }
  
  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get client IP (best effort)
   */
  async getClientIP(): Promise<string> {
    try {
      // This is a fallback - in production, server should determine real IP
      return 'client-side';
    } catch {
      return 'unknown';
    }
  }
}

// Custom error class for authentication errors
export class AuthError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;
  public timestamp: string;
  
  constructor(code: string, message: string, statusCode: number = 0, details?: any) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Singleton instance
export const authService = new AuthService();
export default authService;