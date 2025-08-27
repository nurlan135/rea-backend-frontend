'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import KPIWidget from './KPIWidget';
import RecentActivities from './RecentActivities';
import { AuthService } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KPIGrid } from '@/components/ui/kpi-card';
import { Building, Calendar, DollarSign, TrendingUp, Plus, BookOpen, BarChart3, UserPlus } from 'lucide-react';

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

  const propertyIcon = <Building className="h-6 w-6" />;
  const bookingIcon = <Calendar className="h-6 w-6" />;
  const revenueIcon = <DollarSign className="h-6 w-6" />;
  const salesIcon = <TrendingUp className="h-6 w-6" />;

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8 animate-fadeInUp">
        <h1 className="text-4xl font-bold text-foreground bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
          Xoş gəlmisiniz, {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-muted-foreground mt-3 text-lg font-medium">
          Bu gün olan fəaliyyətlərinizə baxış • {new Date().toLocaleDateString('az-AZ', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* KPI Widgets Grid */}
      <div className="mb-8">
        <KPIGrid columns={4} className="gap-6">
          <KPIWidget
            title="Aktiv Əmlaklar"
            value={dashboardData?.activeProperties || 0}
            change={dashboardData?.propertiesChange}
            changeType={dashboardData?.propertiesChange && dashboardData.propertiesChange > 0 ? 'increase' : 'decrease'}
            icon={propertyIcon}
            loading={loading}
            onClick={() => console.log('Properties clicked')}
          />
          <KPIWidget
            title="Bu Ay Rezervasiya"
            value={dashboardData?.totalBookings || 0}
            change={dashboardData?.bookingsChange}
            changeType={dashboardData?.bookingsChange && dashboardData.bookingsChange > 0 ? 'increase' : 'decrease'}
            icon={bookingIcon}
            loading={loading}
            onClick={() => console.log('Bookings clicked')}
          />
          <KPIWidget
            title="Aylıq Gəlir"
            value={dashboardData ? formatCurrency(dashboardData.monthlyRevenue) : ''}
            change={dashboardData?.revenueChange}
            changeType={dashboardData?.revenueChange && dashboardData.revenueChange > 0 ? 'increase' : 'decrease'}
            icon={revenueIcon}
            loading={loading}
            onClick={() => console.log('Revenue clicked')}
          />
          <KPIWidget
            title="Orta Satış Qiyməti"
            value={dashboardData ? formatCurrency(dashboardData.avgSalePrice) : ''}
            change={dashboardData?.salesChange}
            changeType={dashboardData?.salesChange && dashboardData.salesChange > 0 ? 'increase' : 'decrease'}
            icon={salesIcon}
            loading={loading}
            onClick={() => console.log('Sales clicked')}
          />
        </KPIGrid>
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <RecentActivities />
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card variant="elevated" className="shadow-lg border-0 bg-gradient-to-br from-card to-card/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Sürətli Əməliyyatlar
              </CardTitle>
              <CardDescription className="text-base">
                Tez-tez istifadə olunan funksiyalar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="ghost"
                size="lg"
                className="w-full justify-start h-14 text-left group hover:bg-primary/10 hover:border-primary/20 border-2 border-transparent transition-all duration-200"
              >
                <Plus className="h-5 w-5 text-primary mr-3 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Yeni Əmlak</span>
                  <span className="text-xs text-muted-foreground">Əmlak əlavə et</span>
                </div>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full justify-start h-14 text-left group hover:bg-success/10 hover:border-success/20 border-2 border-transparent transition-all duration-200"
              >
                <BookOpen className="h-5 w-5 text-success mr-3 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Rezervasiya</span>
                  <span className="text-xs text-muted-foreground">Yeni rezervasiya et</span>
                </div>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full justify-start h-14 text-left group hover:bg-info/10 hover:border-info/20 border-2 border-transparent transition-all duration-200"
              >
                <BarChart3 className="h-5 w-5 text-info mr-3 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Hesabat</span>
                  <span className="text-xs text-muted-foreground">Hesabat yarat</span>
                </div>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full justify-start h-14 text-left group hover:bg-warning/10 hover:border-warning/20 border-2 border-transparent transition-all duration-200"
              >
                <UserPlus className="h-5 w-5 text-warning mr-3 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Müştəri</span>
                  <span className="text-xs text-muted-foreground">Yeni müştəri əlavə et</span>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Performance Chart Placeholder */}
          <Card variant="ghost" className="mt-6 bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Aylıq Performans
              </CardTitle>
              <CardDescription className="text-base">
                Son 30 günün statistikası
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-br from-muted/20 to-muted/5 rounded-xl border border-muted/20 flex items-center justify-center backdrop-blur-sm">
                <div className="text-center animate-pulse">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground font-medium text-sm">
                    Performans qrafiki hazırlanır...
                  </p>
                  <div className="mt-4 flex justify-center space-x-2">
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}