'use client';

import { useAuth } from '@/lib/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';
import AgentDashboard from '@/components/dashboard/AgentDashboard';
import DirectorDashboard from '@/components/dashboard/DirectorDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import VPDashboard from '@/components/dashboard/VPDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  const renderDashboardContent = () => {
    if (!user) return null;

    switch (user.role.toLowerCase()) {
      case 'manager':
        return <ManagerDashboard />;
      case 'agent':
        return <AgentDashboard />;
      case 'vp':
        return <VPDashboard />;
      case 'director':
        return <DirectorDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'call_center':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Call Center Panel</h1>
              <p className="text-muted-foreground">Zəng mərkəzi və müştəri xidmətləri</p>
            </div>
            <div className="text-center py-12">
              <p className="text-muted-foreground">Call Center dashboardu tezliklə hazır olacaq...</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">REA INVEST idarəetmə sisteminə xoş gəlmisiniz!</p>
            </div>
            <div className="text-center py-12">
              <p className="text-muted-foreground">Xahiş edirik, sistem administratoru ilə əlaqə saxlayın.</p>
            </div>
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