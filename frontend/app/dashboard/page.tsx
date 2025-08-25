'use client';

import { useAuth } from '@/lib/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  const renderDashboardContent = () => {
    if (!user) return null;

    switch (user.role.toLowerCase()) {
      case 'manager':
        return <ManagerDashboard />;
      case 'agent':
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Agent Panel</h1>
            <p className="text-gray-600">Agent dashboardu hazırlanır...</p>
          </div>
        );
      case 'vp':
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">VP Panel</h1>
            <p className="text-gray-600">VP dashboardu hazırlanır...</p>
          </div>
        );
      case 'director':
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Director Panel</h1>
            <p className="text-gray-600">Director dashboardu hazırlanır...</p>
          </div>
        );
      case 'admin':
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Panel</h1>
            <p className="text-gray-600">Admin dashboardu hazırlanır...</p>
          </div>
        );
      default:
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
            <p className="text-gray-600">Xoş gəlmisiniz!</p>
          </div>
        );
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {renderDashboardContent()}
      </DashboardLayout>
    </ProtectedRoute>
  );
}