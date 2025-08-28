'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallbackComponent?: React.ComponentType;
  redirectTo?: string;
}

// Default unauthorized component
const UnauthorizedPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">
        Giriş icazəsi yoxdur
      </h1>
      <p className="text-gray-600 mb-6">
        Bu səhifəyə giriş üçün lazım olan icazələriniz yoxdur.
      </p>
      <button
        onClick={() => window.history.back()}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Geri qayıt
      </button>
    </div>
  </div>
);

// Loading component
const LoadingComponent: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Yüklənir...</p>
    </div>
  </div>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
  fallbackComponent: FallbackComponent = UnauthorizedPage,
  redirectTo = '/login'
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingComponent />;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
    router.push(redirectUrl);
    return <LoadingComponent />;
  }
  
  // Check specific permission if required
  if (requiredPermission && user) {
    const hasPermission = user.role.permissions.includes('*') || 
                         user.role.permissions.includes(requiredPermission);
    
    if (!hasPermission) {
      return <FallbackComponent />;
    }
  }
  
  // Check specific role if required
  if (requiredRole && user?.role.name !== requiredRole) {
    return <FallbackComponent />;
  }
  
  return <>{children}</>;
};

// HOC version for wrapping page components
export function withAuth<T extends {}>(
  Component: React.ComponentType<T>,
  options?: {
    requiredPermission?: string;
    requiredRole?: string;
    redirectTo?: string;
  }
) {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const AuthenticatedComponent = (props: T) => {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
  
  AuthenticatedComponent.displayName = `withAuth(${displayName})`;
  
  return AuthenticatedComponent;
}

// Higher-order component for role-specific access
export function withRole(requiredRole: string) {
  return function <T extends {}>(Component: React.ComponentType<T>) {
    return withAuth(Component, { requiredRole });
  };
}

// Higher-order component for permission-specific access
export function withPermission(requiredPermission: string) {
  return function <T extends {}>(Component: React.ComponentType<T>) {
    return withAuth(Component, { requiredPermission });
  };
}

// Hook for checking permissions in components
export function usePermissions() {
  const { user, hasPermission, hasRole, canAccess } = useAuth();
  
  return {
    user,
    hasPermission,
    hasRole,
    canAccess,
    
    // Specific role checks
    isAdmin: () => hasRole('admin'),
    isDirector: () => hasRole('director'),
    isVP: () => hasRole('vp'),
    isManager: () => hasRole('manager'),
    isAgent: () => hasRole('agent'),
    
    // Hierarchy checks
    isManagerOrAbove: () => user && user.role.hierarchyLevel >= 2,
    isVPOrAbove: () => user && user.role.hierarchyLevel >= 3,
    isDirectorOrAbove: () => user && user.role.hierarchyLevel >= 4,
    
    // Common permission groups
    canManageProperties: () => canAccess('properties', 'manage'),
    canViewReports: () => canAccess('reports', 'read'),
    canApproveDeals: () => canAccess('approvals', 'process'),
    canManageUsers: () => canAccess('users', 'manage'),
    canConfigureSystem: () => canAccess('system', 'configure')
  };
}

export default ProtectedRoute;