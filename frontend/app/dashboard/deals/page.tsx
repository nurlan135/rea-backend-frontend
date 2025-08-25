'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function DealsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Satışlar</h1>
            <p className="text-muted-foreground">
              Satış və kirayə əməliyyatlarının idarə edilməsi
            </p>
          </div>
          
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Satış Modulu</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Satış və kirayə əməliyyatlarının tam funksionalitəsi tezliklə əlavə ediləcək.
            </p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}