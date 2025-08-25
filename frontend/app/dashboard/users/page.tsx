'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function UsersPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">İstifadəçilər</h1>
            <p className="text-muted-foreground">
              Sistem istifadəçilərinin idarə edilməsi və rol təyinləri
            </p>
          </div>
          
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">İstifadəçi İdarəetməsi</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              İstifadəçi idarəetməsi, rol təyinləri və icazə sistemi tezliklə əlavə ediləcək.
            </p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}