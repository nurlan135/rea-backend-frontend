'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Panel</h1>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-600 mb-4">Admin dashboardu hazırlanır...</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800">Sistem İdarəetməsi</h3>
                <p className="text-red-600">Tezliklə əlavə ediləcək</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800">İstifadəçi İdarəetməsi</h3>
                <p className="text-purple-600">Tezliklə əlavə ediləcək</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800">Audit Loglar</h3>
                <p className="text-yellow-600">Tezliklə əlavə ediləcək</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}