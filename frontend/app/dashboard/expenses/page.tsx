'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function ExpensesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Xərclər</h1>
            <p className="text-muted-foreground">
              Şirkət xərclərinin və büdcənin idarə edilməsi
            </p>
          </div>
          
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Xərc Modulu</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Xərc tracking və büdcə idarəetməsi funksiyaları tezliklə əlavə ediləcək.
            </p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}