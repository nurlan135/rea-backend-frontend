'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import { AuthService } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
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

  // Don't render login form if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div>
      <LoginForm />
    </div>
  );
}