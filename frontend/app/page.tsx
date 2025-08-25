'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { AuthService } from '@/lib/auth';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (!isLoading && isAuthenticated && user) {
      const dashboardUrl = AuthService.getDashboardUrl(user.role);
      router.push(dashboardUrl);
    }
  }, [isAuthenticated, isLoading, user, router]);

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

  // Don't render home page content if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            REA INVEST
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Əmlak İdarəetmə Sistemi
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/login"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Sistemə Daxil Ol
          </Link>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p>Test istifadəçisi:</p>
            <p>E-poçt: admin@rea-invest.com</p>
            <p>Şifrə: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
