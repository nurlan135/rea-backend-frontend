'use client';

import { use } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PropertyDetail from '@/components/properties/PropertyDetail';

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>
}

export default function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PropertyDetail propertyId={id} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}