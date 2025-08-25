'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BookingManagement from '@/components/bookings/BookingManagement';

export default function BookingsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <BookingManagement />
      </DashboardLayout>
    </ProtectedRoute>
  );
}