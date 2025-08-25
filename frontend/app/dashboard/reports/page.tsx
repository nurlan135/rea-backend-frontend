'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ReportsCenter from '@/components/reports/ReportsCenter';

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ReportsCenter />
      </DashboardLayout>
    </ProtectedRoute>
  );
}