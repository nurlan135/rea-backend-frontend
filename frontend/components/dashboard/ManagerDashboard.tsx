'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import KPIWidget from './KPIWidget';
import RecentActivities from './RecentActivities';
import { AuthService } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DashboardData {
  activeProperties: number;
  totalBookings: number;
  monthlyRevenue: number;
  avgSalePrice: number;
  propertiesChange: number;
  bookingsChange: number;
  revenueChange: number;
  salesChange: number;
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Mock data for now - replace with actual API calls
        const mockData: DashboardData = {
          activeProperties: 127,
          totalBookings: 34,
          monthlyRevenue: 2450000, // AZN
          avgSalePrice: 165000, // AZN
          propertiesChange: 12.5,
          bookingsChange: -3.2,
          revenueChange: 18.7,
          salesChange: 8.1,
        };

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setDashboardData(mockData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const propertyIcon = (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );

  const bookingIcon = (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3a4 4 0 118 0v4m-8 0h8m-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-2"
      />
    </svg>
  );

  const revenueIcon = (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
      />
    </svg>
  );

  const salesIcon = (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          Xoş gəlmisiniz, {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Bu gün olan fəaliyyətlərinizə baxış
        </p>
      </div>

      {/* KPI Widgets Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <KPIWidget
          title="Aktiv Əmlaklar"
          value={dashboardData?.activeProperties || 0}
          change={dashboardData?.propertiesChange}
          changeType={dashboardData?.propertiesChange && dashboardData.propertiesChange > 0 ? 'increase' : 'decrease'}
          icon={propertyIcon}
          loading={loading}
        />
        <KPIWidget
          title="Bu Ay Rezervasiya"
          value={dashboardData?.totalBookings || 0}
          change={dashboardData?.bookingsChange}
          changeType={dashboardData?.bookingsChange && dashboardData.bookingsChange > 0 ? 'increase' : 'decrease'}
          icon={bookingIcon}
          loading={loading}
        />
        <KPIWidget
          title="Aylıq Gəlir"
          value={dashboardData ? formatCurrency(dashboardData.monthlyRevenue) : ''}
          change={dashboardData?.revenueChange}
          changeType={dashboardData?.revenueChange && dashboardData.revenueChange > 0 ? 'increase' : 'decrease'}
          icon={revenueIcon}
          loading={loading}
        />
        <KPIWidget
          title="Orta Satış Qiyməti"
          value={dashboardData ? formatCurrency(dashboardData.avgSalePrice) : ''}
          change={dashboardData?.salesChange}
          changeType={dashboardData?.salesChange && dashboardData.salesChange > 0 ? 'increase' : 'decrease'}
          icon={salesIcon}
          loading={loading}
        />
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <RecentActivities />
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm border border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Sürətli Əməliyyatlar</CardTitle>
              <CardDescription>
                Tez-tez istifadə olunan funksiyalar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-12 text-left hover:bg-blue-50 hover:border-blue-200"
              >
                <svg className="h-5 w-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Yeni Əmlak Əlavə Et
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 text-left hover:bg-green-50 hover:border-green-200"
              >
                <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-8 0h8m-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
                </svg>
                Rezervasiya Et
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 text-left hover:bg-purple-50 hover:border-purple-200"
              >
                <svg className="h-5 w-5 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Hesabat Yarat
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 text-left hover:bg-amber-50 hover:border-amber-200"
              >
                <svg className="h-5 w-5 text-amber-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Müştəri Əlavə Et
              </Button>
            </CardContent>
          </Card>

          {/* Performance Chart Placeholder */}
          <Card className="mt-6 shadow-sm border border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Aylıq Performans</CardTitle>
              <CardDescription>
                Son 30 günün statistikası
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg className="h-12 w-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-muted-foreground font-medium">Qrafik yüklənir...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}