// JWT Token Management Service

export interface JWTPayload {
  sub: string;          // User ID (subject)
  email: string;        // User email
  iat: number;          // Issued at
  exp: number;          // Expiry time
  role: string;         // User role name
  permissions: string[]; // User permissions array
  branch_id?: string;   // Branch ID if applicable
  session_id: string;   // Session identifier
}

export class TokenService {
  private static TOKEN_KEY = 'rea_invest_token';
  private static REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 minutes
  
  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
      // Also set in memory for faster access
      (window as any).__REA_TOKEN = token;
    }
  }
  
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Check memory first
    const memoryToken = (window as any).__REA_TOKEN;
    if (memoryToken) return memoryToken;
    
    // Fall back to localStorage
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      (window as any).__REA_TOKEN = token;
    }
    return token;
  }
  
  static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      delete (window as any).__REA_TOKEN;
    }
  }
  
  static isExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
  
  static shouldRefresh(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now();
      const expiryTime = payload.exp * 1000;
      return (expiryTime - currentTime) < this.REFRESH_THRESHOLD;
    } catch {
      return false;
    }
  }
  
  static getPayload(token: string): JWTPayload | null {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
  
  static isValidFormat(token: string): boolean {
    try {
      const parts = token.split('.');
      return parts.length === 3 && !!parts[0] && !!parts[1] && !!parts[2];
    } catch {
      return false;
    }
  }
  
  static getRemainingTime(token: string): number {
    try {
      const payload = this.getPayload(token);
      if (!payload) return 0;
      
      const currentTime = Math.floor(Date.now() / 1000);
      const remainingSeconds = payload.exp - currentTime;
      return Math.max(0, remainingSeconds);
    } catch {
      return 0;
    }
  }
  
  static formatExpiryTime(token: string): string {
    try {
      const payload = this.getPayload(token);
      if (!payload) return '';
      
      const expiryDate = new Date(payload.exp * 1000);
      return expiryDate.toLocaleString('az-AZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }
}

// Token configuration constants
export const TOKEN_CONFIG = {
  EXPIRES_IN: '8h', // 8 hours for work day
  ALGORITHM: 'HS256' as const,
  ISSUER: 'rea-invest',
  AUDIENCE: 'rea-invest-web',
  REFRESH_THRESHOLD_MS: 30 * 60 * 1000 // 30 minutes
};

// Helper functions for token operations
export const tokenHelpers = {
  /**
   * Check if user has specific permission based on token
   */
  hasPermission(token: string, permission: string): boolean {
    try {
      const payload = TokenService.getPayload(token);
      if (!payload || !payload.permissions) return false;
      return payload.permissions.includes('*') || payload.permissions.includes(permission);
    } catch {
      return false;
    }
  },
  
  /**
   * Check if user has specific role based on token
   */
  hasRole(token: string, role: string): boolean {
    try {
      const payload = TokenService.getPayload(token);
      return payload?.role === role;
    } catch {
      return false;
    }
  },
  
  /**
   * Get user ID from token
   */
  getUserId(token: string): string | null {
    try {
      const payload = TokenService.getPayload(token);
      return payload?.sub || null;
    } catch {
      return null;
    }
  },
  
  /**
   * Get user email from token
   */
  getUserEmail(token: string): string | null {
    try {
      const payload = TokenService.getPayload(token);
      return payload?.email || null;
    } catch {
      return null;
    }
  },
  
  /**
   * Get session ID from token
   */
  getSessionId(token: string): string | null {
    try {
      const payload = TokenService.getPayload(token);
      return payload?.session_id || null;
    } catch {
      return null;
    }
  }
};

export default TokenService;