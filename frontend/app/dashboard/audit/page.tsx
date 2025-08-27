'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function AuditPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Audit Log</h1>
            <p className="text-muted-foreground">
              Sistem təhlükəsizliyi və audit log izlənməsi
            </p>
          </div>
          
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Audit Log Sistemi</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Sistem aktivlərinin izlənməsi və audit log funksionalitəsi tezliklə əlavə ediləcək.
            </p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}