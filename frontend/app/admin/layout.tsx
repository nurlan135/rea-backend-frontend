/**
 * Admin Layout
 * Layout for admin dashboard with navigation and security
 */

'use client';

import AdminNavigation from '@/components/admin/AdminNavigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user has admin permissions
    if (!isLoading && isAuthenticated && user) {
      const adminRoles = ['admin'];
      if (!adminRoles.includes(user.role)) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm text-gray-600">Yüklənir...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Don't render content if not admin
  const adminRoles = ['admin'];
  if (!adminRoles.includes(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation Header */}
      <AdminNavigation />
      
      <div className="flex">
        {/* Admin Sidebar */}
        <AdminSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Breadcrumbs */}
          <div className="bg-white border-b px-6 py-4">
            <Breadcrumbs />
          </div>
          
          {/* Page Content */}
          <main className="flex-1 p-6">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}