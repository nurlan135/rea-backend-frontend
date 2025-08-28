/**
 * Admin Dashboard Page
 * Main dashboard page with overview stats and quick actions
 */

import { Metadata } from 'next';
import { 
  Users, 
  Building, 
  DollarSign, 
  Calendar, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard - REA INVEST Admin',
  description: 'REA INVEST admin dashboard with overview statistics',
};

// Mock data - replace with actual API calls
const dashboardStats = {
  totalUsers: 156,
  activeUsers: 142,
  totalProperties: 1234,
  activeProperties: 1156,
  totalDeals: 89,
  pendingApprovals: 12,
  thisMonthRevenue: 125000,
  recentActivities: [
    { id: 1, type: 'user_created', message: 'Yeni istifadəçi yaradıldı: Əli Məmmədov', time: '5 dəqiqə əvvəl' },
    { id: 2, type: 'property_updated', message: 'Əmlak yeniləndi: Yasamal, 3 otaq', time: '15 dəqiqə əvvəl' },
    { id: 3, type: 'deal_approved', message: 'Sövdələşmə təsdiqləndi: #REA-2024-001', time: '1 saat əvvəl' },
    { id: 4, type: 'user_login', message: 'Manager daxil oldu: Leyla Həsənova', time: '2 saat əvvəl' }
  ]
};

function StatCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  color = 'blue' 
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ElementType;
  color?: 'blue' | 'green' | 'yellow' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  const changeColorClasses = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {change && (
              <p className={`ml-2 text-sm font-medium ${changeColorClasses[changeType || 'neutral']}`}>
                {change}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          REA INVEST idarəetmə paneli ümumiləşdirici məlumatlar
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ümumi İstifadəçilər"
          value={dashboardStats.totalUsers}
          change="+12%"
          changeType="increase"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Aktiv Əmlak"
          value={dashboardStats.activeProperties}
          change="+8%"
          changeType="increase"
          icon={Building}
          color="green"
        />
        <StatCard
          title="Bu Ay Sövdələşmələr"
          value={dashboardStats.totalDeals}
          change="+23%"
          changeType="increase"
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Gözləyən Təsdiq"
          value={dashboardStats.pendingApprovals}
          change="-5%"
          changeType="decrease"
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Son Fəaliyyətlər</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardStats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {activity.type === 'user_created' && (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    {activity.type === 'property_updated' && (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Building className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                    {activity.type === 'deal_approved' && (
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                      </div>
                    )}
                    {activity.type === 'user_login' && (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Tez Əməliyyatlar</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Yeni İstifadəçi</span>
              </button>
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Building className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Yeni Əmlak</span>
              </button>
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <DollarSign className="h-8 w-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Yeni Sövdələşmə</span>
              </button>
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Calendar className="h-8 w-8 text-yellow-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Rezervasiya</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Diqqət</h4>
            <p className="text-sm text-yellow-700 mt-1">
              {dashboardStats.pendingApprovals} sövdələşmə təsdiq gözləyir. 
              <a href="/admin/deals?status=pending" className="font-medium underline ml-1">
                İndi bax
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}