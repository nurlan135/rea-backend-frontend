'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CommunicationCenter from '@/components/communications/CommunicationCenter';

export default function CommunicationsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <CommunicationCenter />
      </DashboardLayout>
    </ProtectedRoute>
  );
}