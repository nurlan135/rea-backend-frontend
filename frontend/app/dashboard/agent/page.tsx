'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function AgentDashboardPage() {
  return (
    <ProtectedRoute requiredRoles={['agent']}>
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Agent Panel</h1>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-600 mb-4">Agent dashboardu hazırlanır...</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Mənim Rezervasiyalarım</h3>
                <p className="text-blue-600">Tezliklə əlavə ediləcək</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">Aktivlər</h3>
                <p className="text-green-600">Tezliklə əlavə ediləcək</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}