'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallbackUrl?: string;
}

export default function ProtectedRoute({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallbackUrl = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return; // Wait for auth state to initialize

    if (!isAuthenticated || !user) {
      router.push(fallbackUrl);
      return;
    }

    // Check role requirements
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => 
        user.role.toLowerCase() === role.toLowerCase()
      );
      
      if (!hasRequiredRole) {
        router.push('/unauthorized');
        return;
      }
    }

    // Check permission requirements
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.every(permission =>
        user.permissions.includes(permission)
      );
      
      if (!hasRequiredPermissions) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, router, requiredRoles, requiredPermissions, fallbackUrl]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Yüklənir...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated (router will handle redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => 
      user.role.toLowerCase() === role.toLowerCase()
    );
    
    if (!hasRequiredRole) {
      return null;
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every(permission =>
      user.permissions.includes(permission)
    );
    
    if (!hasRequiredPermissions) {
      return null;
    }
  }

  return <>{children}</>;
}

// Higher-order component for page-level protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}