// Frontend Audit Service for Authentication Events

import { tokenHelpers } from './tokenService';

export interface AuditEventData {
  action: string;
  user_id?: string;
  email?: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  failure_reason?: string;
  additional_data?: any;
}

export interface AuditEvent extends AuditEventData {
  id: string;
  timestamp: string;
  session_id?: string;
}

// Authentication audit event types
export const AUTH_AUDIT_ACTIONS = {
  LOGIN_ATTEMPT: 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS', 
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS'
} as const;

class AuditService {
  private baseURL = '/api/audit';
  
  /**
   * Log authentication event to server
   */
  async logAuthEvent(eventData: Partial<AuditEventData>): Promise<void> {
    try {
      // Prepare event data with client context
      const enrichedEventData = await this.enrichEventData(eventData);
      
      // Send to server (fire-and-forget for performance)
      fetch(`${this.baseURL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify(enrichedEventData),
      }).catch(error => {
        // Silent failure - don't break user flow for audit logging
        console.warn('Audit logging failed:', error);
        
        // Store locally as fallback
        this.storeEventLocally(enrichedEventData);
      });
      
    } catch (error) {
      console.warn('Audit event preparation failed:', error);
      
      // Store locally as fallback
      this.storeEventLocally(eventData);
    }
  }
  
  /**
   * Log successful login event
   */
  async logLoginSuccess(userEmail: string, additionalData?: any): Promise<void> {
    await this.logAuthEvent({
      action: AUTH_AUDIT_ACTIONS.LOGIN_SUCCESS,
      email: userEmail,
      success: true,
      additional_data: {
        ...additionalData,
        login_method: 'form_login',
        client_info: this.getClientInfo()
      }
    });
  }
  
  /**
   * Log failed login attempt
   */
  async logLoginFailure(email: string, reason: string, additionalData?: any): Promise<void> {
    await this.logAuthEvent({
      action: AUTH_AUDIT_ACTIONS.LOGIN_FAILED,
      email,
      success: false,
      failure_reason: reason,
      additional_data: {
        ...additionalData,
        login_method: 'form_login',
        client_info: this.getClientInfo()
      }
    });
  }
  
  /**
   * Log logout event
   */
  async logLogout(userId?: string, additionalData?: any): Promise<void> {
    await this.logAuthEvent({
      action: AUTH_AUDIT_ACTIONS.LOGOUT,
      user_id: userId,
      success: true,
      additional_data: {
        ...additionalData,
        logout_method: 'user_initiated',
        client_info: this.getClientInfo()
      }
    });
  }
  
  /**
   * Log session expiry event
   */
  async logSessionExpired(userId?: string, additionalData?: any): Promise<void> {
    await this.logAuthEvent({
      action: AUTH_AUDIT_ACTIONS.SESSION_EXPIRED,
      user_id: userId,
      success: false,
      failure_reason: 'TOKEN_EXPIRED',
      additional_data: {
        ...additionalData,
        expiry_type: 'automatic',
        client_info: this.getClientInfo()
      }
    });
  }
  
  /**
   * Log permission denied event
   */
  async logPermissionDenied(requiredPermission: string, attemptedAction: string, additionalData?: any): Promise<void> {
    await this.logAuthEvent({
      action: AUTH_AUDIT_ACTIONS.PERMISSION_DENIED,
      success: false,
      failure_reason: 'INSUFFICIENT_PERMISSIONS',
      additional_data: {
        required_permission: requiredPermission,
        attempted_action: attemptedAction,
        ...additionalData,
        client_info: this.getClientInfo()
      }
    });
  }
  
  /**
   * Log unauthorized access attempt
   */
  async logUnauthorizedAccess(attemptedResource: string, additionalData?: any): Promise<void> {
    await this.logAuthEvent({
      action: AUTH_AUDIT_ACTIONS.UNAUTHORIZED_ACCESS,
      success: false,
      failure_reason: 'UNAUTHENTICATED_ACCESS',
      additional_data: {
        attempted_resource: attemptedResource,
        ...additionalData,
        client_info: this.getClientInfo()
      }
    });
  }
  
  /**
   * Get user's audit log (if they have permission)
   */
  async getUserAuditLog(userId?: string, limit = 50): Promise<AuditEvent[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(userId && { user_id: userId })
      });
      
      const response = await fetch(`${this.baseURL}/auth/user?${params}`, {
        method: 'GET',
        headers: {
          ...this.getAuthHeaders()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Audit log fetch failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data?.events || [];
      
    } catch (error) {
      console.error('Failed to fetch user audit log:', error);
      return [];
    }
  }
  
  /**
   * Get security events summary
   */
  async getSecurityEventsSummary(timeframe = '24h'): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/auth/security-summary?timeframe=${timeframe}`, {
        method: 'GET',
        headers: {
          ...this.getAuthHeaders()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Security summary fetch failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || {};
      
    } catch (error) {
      console.error('Failed to fetch security summary:', error);
      return {};
    }
  }
  
  /**
   * Enrich event data with client context
   */
  private async enrichEventData(eventData: Partial<AuditEventData>): Promise<AuditEventData> {
    const clientIP = await this.getClientIP();
    const userAgent = this.getUserAgent();
    const sessionId = this.getSessionId();
    
    return {
      action: eventData.action || 'UNKNOWN_ACTION',
      user_id: eventData.user_id,
      email: eventData.email,
      ip_address: eventData.ip_address || clientIP,
      user_agent: eventData.user_agent || userAgent,
      success: eventData.success ?? false,
      failure_reason: eventData.failure_reason,
      additional_data: {
        ...eventData.additional_data,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
        screen_resolution: this.getScreenResolution(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
  }
  
  /**
   * Get authentication headers for API requests
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Add auth token if available
    const token = this.getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add request tracking
    headers['X-Request-ID'] = this.generateRequestId();
    headers['X-Client-Version'] = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
    
    return headers;
  }
  
  /**
   * Get stored authentication token
   */
  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return (window as any).__REA_TOKEN || localStorage.getItem('rea_invest_token');
  }
  
  /**
   * Get session ID from token
   */
  private getSessionId(): string | null {
    const token = this.getStoredToken();
    if (!token) return null;
    
    return tokenHelpers.getSessionId(token);
  }
  
  /**
   * Get client IP address (best effort)
   */
  private async getClientIP(): Promise<string> {
    try {
      // In a real application, you might use a service like ipify
      // For now, return a placeholder that the server can override
      return 'client-determined';
    } catch {
      return 'unknown';
    }
  }
  
  /**
   * Get user agent string
   */
  private getUserAgent(): string {
    if (typeof window === 'undefined') return 'server-side';
    return navigator.userAgent || 'unknown';
  }
  
  /**
   * Get client information
   */
  private getClientInfo(): any {
    if (typeof window === 'undefined') return { environment: 'server-side' };
    
    return {
      platform: navigator.platform,
      language: navigator.language,
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      screen: this.getScreenResolution(),
      viewport: this.getViewportSize(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      memory: (navigator as any).deviceMemory || 'unknown',
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    };
  }
  
  /**
   * Get screen resolution
   */
  private getScreenResolution(): string {
    if (typeof window === 'undefined') return 'unknown';
    return `${window.screen.width}x${window.screen.height}`;
  }
  
  /**
   * Get viewport size
   */
  private getViewportSize(): string {
    if (typeof window === 'undefined') return 'unknown';
    return `${window.innerWidth}x${window.innerHeight}`;
  }
  
  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Store event locally as fallback when server logging fails
   */
  private storeEventLocally(eventData: Partial<AuditEventData>): void {
    if (typeof window === 'undefined') return;
    
    try {
      const localEvents = JSON.parse(localStorage.getItem('rea_audit_events_fallback') || '[]');
      
      const event = {
        ...eventData,
        id: this.generateRequestId(),
        timestamp: new Date().toISOString(),
        stored_locally: true
      };
      
      localEvents.push(event);
      
      // Keep only last 100 events to avoid storage bloat
      if (localEvents.length > 100) {
        localEvents.splice(0, localEvents.length - 100);
      }
      
      localStorage.setItem('rea_audit_events_fallback', JSON.stringify(localEvents));
      
    } catch (error) {
      console.warn('Failed to store audit event locally:', error);
    }
  }
  
  /**
   * Get locally stored audit events
   */
  getLocalAuditEvents(): AuditEvent[] {
    if (typeof window === 'undefined') return [];
    
    try {
      return JSON.parse(localStorage.getItem('rea_audit_events_fallback') || '[]');
    } catch {
      return [];
    }
  }
  
  /**
   * Clear locally stored audit events
   */
  clearLocalAuditEvents(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('rea_audit_events_fallback');
  }
}

// Singleton instance
export const auditService = new AuditService();
export default auditService;