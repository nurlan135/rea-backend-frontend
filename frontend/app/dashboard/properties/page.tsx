'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PropertyManagement from '@/components/properties/PropertyManagement';

export default function PropertiesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PropertyManagement />
      </DashboardLayout>
    </ProtectedRoute>
  );
}