'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirect authenticated users to dashboard
        router.push('/dashboard');
      } else {
        // Redirect unauthenticated users to login
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking authentication or redirecting
  if (isLoading || (!isLoading && (isAuthenticated || !isAuthenticated))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-blue-600 shadow-lg">
              <svg
                className="h-10 w-10 text-white"
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
            <h1 className="mt-6 text-4xl font-extrabold text-gray-900">
              REA INVEST
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Əmlak İdarəetmə Sistemi
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Real Estate Management System
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-600">Yönləndirilir...</span>
            </div>
            
            <div className="mt-6 text-xs text-gray-500 bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-2">Manual Giriş:</p>
              <Link 
                href="/login"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Login səhifəsinə gedin
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}