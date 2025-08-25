'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';

export default function ManagerDashboardPage() {
  return (
    <ProtectedRoute requiredRoles={['manager']}>
      <DashboardLayout>
        <ManagerDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
}