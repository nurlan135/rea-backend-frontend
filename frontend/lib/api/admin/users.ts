/**
 * Admin Users API Service
 * API calls for admin user management
 */

import apiClient, { ApiResponse } from '../client';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'admin' | 'director' | 'vp' | 'manager' | 'agent';
  branch_code?: string;
  status: 'active' | 'inactive' | 'suspended';
  permissions?: string[];
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  login_attempts: number;
  locked_until?: string;
  force_password_change: boolean;
  last_password_change?: string;
  is_locked?: boolean;
  role_permissions?: string[];
}

export interface UserListResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters?: {
    search: string;
    role: string;
    status: string;
    branch_code: string;
    sort: string;
    order: string;
  };
}

export interface UserCreateData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  branch_code?: string;
  password: string;
  status?: string;
  force_password_change?: boolean;
}

export interface UserUpdateData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  branch_code?: string;
  status?: string;
  force_password_change?: boolean;
}

export interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  role?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPermissions {
  userId: string;
  userRole: string;
  permissions: {
    rolePermissions: string[];
    customPermissions: string[];
    allPermissions: string[];
    customDetails: Array<{
      permission: string;
      restrictions?: string;
      expires_at?: string;
    }>;
  };
}

export interface PermissionCategories {
  role_permissions: Record<string, string[]>;
  permission_categories: Record<string, {
    label: string;
    permissions: Array<{
      key: string;
      label: string;
    }>;
  }>;
}

class AdminUsersService {
  private readonly basePath = '/api/admin/users';

  // Get users list with filters
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    branch_code?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }): Promise<ApiResponse<UserListResponse>> {
    return apiClient.get(this.basePath, params);
  }

  // Get specific user
  async getUser(id: string): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get(`${this.basePath}/${id}`);
  }

  // Create new user
  async createUser(data: UserCreateData): Promise<ApiResponse<{ user: User; temporary_password?: string }>> {
    return apiClient.post(this.basePath, data);
  }

  // Update user
  async updateUser(id: string, data: UserUpdateData): Promise<ApiResponse<{ user: User }>> {
    return apiClient.patch(`${this.basePath}/${id}`, data);
  }

  // Delete user
  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.basePath}/${id}`);
  }

  // Reset user password
  async resetPassword(id: string, newPassword: string): Promise<ApiResponse<{ temporary_password: string }>> {
    return apiClient.post(`${this.basePath}/${id}/reset-password`, { new_password: newPassword });
  }

  // Unlock user account
  async unlockUser(id: string): Promise<ApiResponse<void>> {
    return apiClient.post(`${this.basePath}/${id}/unlock`);
  }

  // Get available permissions
  async getPermissions(): Promise<ApiResponse<PermissionCategories>> {
    return apiClient.get(`${this.basePath}/list-permissions`);
  }

  // Get permission templates
  async getPermissionTemplates(): Promise<ApiResponse<{ templates: PermissionTemplate[] }>> {
    return apiClient.get(`${this.basePath}/permission-templates`);
  }

  // Get user permissions
  async getUserPermissions(id: string): Promise<ApiResponse<UserPermissions>> {
    return apiClient.get(`${this.basePath}/${id}/permissions`);
  }

  // Grant custom permission to user
  async grantPermission(
    userId: string, 
    permission: string, 
    options?: {
      restrictions?: any;
      expiresAt?: string;
    }
  ): Promise<ApiResponse<any>> {
    return apiClient.post(`${this.basePath}/${userId}/permissions`, {
      permission,
      ...options
    });
  }

  // Revoke custom permission from user
  async revokePermission(userId: string, permission: string): Promise<ApiResponse<any>> {
    return apiClient.delete(`${this.basePath}/${userId}/permissions/${encodeURIComponent(permission)}`);
  }

  // Apply permission template to user
  async applyPermissionTemplate(userId: string, templateId: string): Promise<ApiResponse<any>> {
    return apiClient.post(`${this.basePath}/${userId}/apply-template`, { templateId });
  }
}

// Create singleton instance
const adminUsersService = new AdminUsersService();

export default adminUsersService;