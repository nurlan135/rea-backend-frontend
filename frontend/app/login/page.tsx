'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthContext';
import LoginForm from '@/components/auth/LoginForm';

// Loading component for login form
const LoginFormSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    <div className="h-12 bg-gray-200 rounded"></div>
  </div>
);

// Main loading component
const PageLoadingComponent = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Yüklənir...</p>
    </div>
  </div>
);

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Preload critical resources for better performance
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Preload dashboard page for faster navigation after login
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = '/dashboard';
      document.head.appendChild(link);
      
      // Preload user context API
      const apiLink = document.createElement('link');
      apiLink.rel = 'prefetch';
      apiLink.href = '/api/auth/me';
      document.head.appendChild(apiLink);
    }
  }, []);

  // Redirect authenticated users
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect') || '/dashboard';
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking authentication status
  if (isLoading) {
    return <PageLoadingComponent />;
  }

  // Show login page only for unauthenticated users
  if (isAuthenticated) {
    return <PageLoadingComponent />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main container */}
      <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        {/* Header section */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo container */}
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-white shadow-lg mb-6">
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">REA</span>
            </div>
          </div>
          
          {/* Title and subtitle */}
          <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            REA INVEST
          </h1>
          <p className="mt-3 text-center text-base text-gray-600">
            Əmlak İdarəetmə Sistemi
          </p>
          <p className="mt-1 text-center text-sm text-gray-500">
            Hesabınıza daxil olmaq üçün email və parolunuzu daxil edin
          </p>
        </div>

        {/* Form section */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
            <Suspense fallback={<LoginFormSkeleton />}>
              <LoginForm 
                redirectTo="/dashboard"
                onSuccess={(user) => {
                  // Optional: Add success tracking or analytics here
                  console.log('Login successful for user:', user.email);
                }}
                onError={(error) => {
                  // Optional: Add error tracking or analytics here
                  console.error('Login error:', error.code, error.message);
                }}
              />
            </Suspense>
          </div>

          {/* Footer info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Bu sistem REA INVEST şirkətinin əmlak idarəetmə platformasıdır.
              <br />
              Texniki dəstək üçün administrator ilə əlaqə saxlayın.
            </p>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse delay-2000"></div>
      </div>
    </div>
  );
}